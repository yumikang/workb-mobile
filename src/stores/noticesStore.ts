/**
 * WORKB Mobile - Notices Store
 * Announcements and notifications management
 */

import { create } from 'zustand';
import api from '@/services/api';
import { socketService } from '@/services/SocketService';
import { Notice, NoticeCategory } from '@/types';

interface NoticesState {
  notices: Notice[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  selectedCategory: NoticeCategory | 'all';

  // Actions
  fetchNotices: () => Promise<void>;
  markAsRead: (noticeId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setCategory: (category: NoticeCategory | 'all') => void;

  // Real-time sync
  setupRealtimeListeners: () => void;
  cleanupListeners: () => void;
}

export const useNoticesStore = create<NoticesState>((set, get) => ({
  notices: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  selectedCategory: 'all',

  fetchNotices: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get('/notices');
      const notices: Notice[] = response.data.map((notice: any) => ({
        ...notice,
        createdAt: new Date(notice.createdAt),
        updatedAt: notice.updatedAt ? new Date(notice.updatedAt) : undefined,
      }));

      const unreadCount = notices.filter((n) => !n.isRead).length;

      set({
        notices,
        unreadCount,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[Notices] Failed to fetch:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch notices',
      });
    }
  },

  markAsRead: async (noticeId: string) => {
    try {
      await api.patch(`/notices/${noticeId}/read`);

      set((state) => {
        const updatedNotices = state.notices.map((notice) =>
          notice.id === noticeId ? { ...notice, isRead: true } : notice
        );
        const unreadCount = updatedNotices.filter((n) => !n.isRead).length;

        return { notices: updatedNotices, unreadCount };
      });

      console.log('[Notices] Marked as read:', noticeId);
    } catch (error: any) {
      console.error('[Notices] Mark read failed:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notices/read-all');

      set((state) => ({
        notices: state.notices.map((notice) => ({ ...notice, isRead: true })),
        unreadCount: 0,
      }));

      console.log('[Notices] All marked as read');
    } catch (error: any) {
      console.error('[Notices] Mark all read failed:', error);
    }
  },

  setCategory: (category: NoticeCategory | 'all') => {
    set({ selectedCategory: category });
  },

  setupRealtimeListeners: () => {
    // Listen for new notice
    socketService.on('notice:new', (data) => {
      console.log('[Notices] New notice received:', data.id);

      const newNotice: Notice = {
        ...data,
        createdAt: new Date(data.createdAt),
        isRead: false,
      };

      set((state) => ({
        notices: [newNotice, ...state.notices],
        unreadCount: state.unreadCount + 1,
      }));
    });

    // Listen for notice update
    socketService.on('notice:updated', (data) => {
      console.log('[Notices] Notice updated:', data.id);

      set((state) => ({
        notices: state.notices.map((notice) =>
          notice.id === data.id
            ? { ...notice, ...data, updatedAt: new Date(data.updatedAt) }
            : notice
        ),
      }));
    });

    // Listen for notice deletion
    socketService.on('notice:deleted', (data) => {
      console.log('[Notices] Notice deleted:', data.id);

      set((state) => {
        const deletedNotice = state.notices.find((n) => n.id === data.id);
        const unreadAdjust = deletedNotice && !deletedNotice.isRead ? 1 : 0;

        return {
          notices: state.notices.filter((notice) => notice.id !== data.id),
          unreadCount: state.unreadCount - unreadAdjust,
        };
      });
    });
  },

  cleanupListeners: () => {
    socketService.off('notice:new');
    socketService.off('notice:updated');
    socketService.off('notice:deleted');
  },
}));

export default useNoticesStore;
