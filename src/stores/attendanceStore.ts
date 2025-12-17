/**
 * WORKB Mobile - Attendance Store
 * Attendance state management with real-time sync
 */

import { create } from 'zustand';
import api from '@/services/api';
import { socketService } from '@/services/SocketService';
import { AnalyticsService } from '@/services/AnalyticsService';
import { AttendanceStatus, WorkLocation, AttendanceRecord } from '@/types';

interface AttendanceState {
  status: AttendanceStatus;
  startTime: Date | null;
  endTime: Date | null;
  workDuration: string;
  workLocation: WorkLocation;
  todayRecord: AttendanceRecord | null;
  isLoading: boolean;

  // Actions
  fetchStatus: () => Promise<void>;
  checkIn: (location?: WorkLocation) => Promise<void>;
  checkOut: () => Promise<void>;
  setWorkLocation: (location: WorkLocation) => void;
  calculateDuration: () => string;

  // Real-time sync
  setupRealtimeListeners: () => void;
  cleanupListeners: () => void;
}

// 오늘 날짜인지 확인 (0시 기준)
const isToday = (date: Date | null): boolean => {
  if (!date) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  status: 'not_checked_in',
  startTime: null,
  endTime: null,
  workDuration: '00:00:00',
  workLocation: 'office',
  todayRecord: null,
  isLoading: false,

  fetchStatus: async () => {
    set({ isLoading: true });

    // DEV MODE: Check if need to reset for new day
    if (__DEV__) {
      const { startTime, endTime, status } = get();

      // 출근 기록이 오늘 것이 아니면 리셋
      if (startTime && !isToday(startTime)) {
        console.log('[Attendance] DEV MODE: New day detected, resetting status');
        set({
          status: 'not_checked_in',
          startTime: null,
          endTime: null,
          workDuration: '00:00:00',
          isLoading: false,
        });
        return;
      }

      // 이미 상태가 있으면 유지
      if (status !== 'loading') {
        set({ isLoading: false });
        return;
      }

      // 초기 상태는 미출근
      console.log('[Attendance] DEV MODE: Using local state');
      set({ status: 'not_checked_in', isLoading: false });
      return;
    }

    try {
      const response = await api.get('/mobile/v1/attendance');
      const data = response.data;

      // Determine if currently working
      const isWorking =
        data.status === 'PRESENT' ||
        data.status === 'WORK_FROM_HOME' ||
        (data.checkIn && !data.checkOut);

      const startTime = data.checkIn ? new Date(data.checkIn) : null;
      const endTime = data.checkOut ? new Date(data.checkOut) : null;

      set({
        status: isWorking ? 'working' : 'out',
        startTime,
        endTime,
        workLocation: data.workLocation || 'office',
        todayRecord: data,
        isLoading: false,
      });

      // Update duration if working
      if (isWorking && startTime) {
        get().calculateDuration();
      }
    } catch (error) {
      console.error('[Attendance] Failed to fetch status:', error);
      set({ status: 'out', isLoading: false });
    }
  },

  checkIn: async (location: WorkLocation = 'office') => {
    const { workLocation } = get();
    const finalLocation = location || workLocation;

    set({ status: 'loading' });

    // DEV MODE: Simulate check-in locally
    if (__DEV__) {
      const checkInTime = new Date();
      set({
        status: 'working',
        startTime: checkInTime,
        endTime: null,
        workLocation: finalLocation,
      });
      console.log('[Attendance] DEV MODE: Check-in simulated at', checkInTime.toLocaleTimeString());
      return;
    }

    try {
      const response = await api.post('/attendance/checkin', {
        workLocation: finalLocation,
      });

      const checkInTime = new Date();

      set({
        status: 'working',
        startTime: checkInTime,
        endTime: null,
        workLocation: finalLocation,
      });

      // Emit socket event for real-time sync
      socketService.emitCheckIn({
        userId: response.data.userId,
        workspaceId: response.data.workspaceId,
        time: checkInTime,
      });

      // Log analytics
      await AnalyticsService.logCheckIn(finalLocation);

      console.log('[Attendance] Check-in successful');
    } catch (error) {
      console.error('[Attendance] Check-in failed:', error);
      set({ status: 'out' });
      throw error;
    }
  },

  checkOut: async () => {
    set({ status: 'loading' });

    // DEV MODE: Simulate check-out locally
    if (__DEV__) {
      const checkOutTime = new Date();
      set({
        status: 'out',
        endTime: checkOutTime,
      });
      console.log('[Attendance] DEV MODE: Check-out simulated at', checkOutTime.toLocaleTimeString());
      return;
    }

    try {
      const { startTime } = get();
      const response = await api.post('/attendance/checkout');

      const checkOutTime = new Date();
      const workMinutes = startTime
        ? Math.floor((checkOutTime.getTime() - startTime.getTime()) / 60000)
        : 0;

      set({
        status: 'out',
        endTime: checkOutTime,
      });

      // Emit socket event for real-time sync
      socketService.emitCheckOut({
        userId: response.data.userId,
        workspaceId: response.data.workspaceId,
        time: checkOutTime,
      });

      // Log analytics
      await AnalyticsService.logCheckOut(workMinutes);

      console.log('[Attendance] Check-out successful');
    } catch (error) {
      console.error('[Attendance] Check-out failed:', error);
      // Refetch status to get correct state
      await get().fetchStatus();
      throw error;
    }
  },

  setWorkLocation: (location: WorkLocation) => {
    set({ workLocation: location });
  },

  calculateDuration: () => {
    const { startTime, status } = get();

    if (!startTime || status !== 'working') {
      return '00:00:00';
    }

    const now = new Date();
    const diff = now.getTime() - startTime.getTime();

    if (diff < 0) return '00:00:00';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const duration = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    set({ workDuration: duration });
    return duration;
  },

  setupRealtimeListeners: () => {
    // Listen for attendance status changes from other devices or admin actions
    socketService.on('attendance:status_changed', (data) => {
      console.log('[Attendance] Real-time status update:', data);
      // Refetch status to get latest data
      get().fetchStatus();
    });

    // Listen for presence check requests
    socketService.on('presence:check_required', (data) => {
      console.log('[Attendance] Presence check required:', data);
      // This will be handled by FCM for background notifications
      // For foreground, we can show an alert
    });
  },

  cleanupListeners: () => {
    socketService.off('attendance:status_changed');
    socketService.off('presence:check_required');
  },
}));

export default useAttendanceStore;
