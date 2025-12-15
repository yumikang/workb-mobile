/**
 * WORKB Mobile - Leave Store
 * Leave request and balance management
 */

import { create } from 'zustand';
import api from '@/services/api';
import { socketService } from '@/services/SocketService';
import { AnalyticsService } from '@/services/AnalyticsService';
import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '@/types';

interface LeaveState {
  requests: LeaveRequest[];
  balance: LeaveBalance | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLeaveData: () => Promise<void>;
  submitRequest: (data: {
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;

  // Real-time sync
  setupRealtimeListeners: () => void;
  cleanupListeners: () => void;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  requests: [],
  balance: null,
  isLoading: false,
  error: null,

  fetchLeaveData: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get('/leave');
      const { requests, balance } = response.data;

      // Parse dates in requests
      const parsedRequests = requests.map((req: any) => ({
        ...req,
        startDate: new Date(req.startDate),
        endDate: new Date(req.endDate),
        createdAt: new Date(req.createdAt),
      }));

      set({
        requests: parsedRequests,
        balance,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[Leave] Failed to fetch data:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch leave data',
      });
    }
  },

  submitRequest: async (data) => {
    set({ isLoading: true, error: null });

    try {
      // Calculate days
      const startTime = data.startDate.getTime();
      const endTime = data.endDate.getTime();
      const days = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;

      // Adjust for half-day
      const actualDays = data.type === 'half_am' || data.type === 'half_pm' ? 0.5 : days;

      const response = await api.post('/leave', {
        type: data.type,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        days: actualDays,
        reason: data.reason,
      });

      const newRequest: LeaveRequest = {
        ...response.data,
        startDate: new Date(response.data.startDate),
        endDate: new Date(response.data.endDate),
        createdAt: new Date(response.data.createdAt),
      };

      // Add to local state
      set((state) => ({
        requests: [newRequest, ...state.requests],
        isLoading: false,
      }));

      // Log analytics
      await AnalyticsService.logLeaveRequest(data.type, actualDays);

      console.log('[Leave] Request submitted:', newRequest.id);
    } catch (error: any) {
      console.error('[Leave] Submit failed:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to submit leave request',
      });
      throw error;
    }
  },

  cancelRequest: async (requestId: string) => {
    set({ isLoading: true });

    try {
      await api.delete(`/leave/${requestId}`);

      // Remove from local state
      set((state) => ({
        requests: state.requests.filter((req) => req.id !== requestId),
        isLoading: false,
      }));

      console.log('[Leave] Request cancelled:', requestId);
    } catch (error: any) {
      console.error('[Leave] Cancel failed:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to cancel request',
      });
      throw error;
    }
  },

  setupRealtimeListeners: () => {
    // Listen for leave approval
    socketService.on('leave:approved', (data) => {
      console.log('[Leave] Request approved:', data.requestId);
      set((state) => ({
        requests: state.requests.map((req) =>
          req.id === data.requestId ? { ...req, status: 'approved' as LeaveStatus } : req
        ),
      }));
    });

    // Listen for leave rejection
    socketService.on('leave:rejected', (data) => {
      console.log('[Leave] Request rejected:', data.requestId);
      set((state) => ({
        requests: state.requests.map((req) =>
          req.id === data.requestId ? { ...req, status: 'rejected' as LeaveStatus } : req
        ),
      }));
    });
  },

  cleanupListeners: () => {
    socketService.off('leave:approved');
    socketService.off('leave:rejected');
  },
}));

export default useLeaveStore;
