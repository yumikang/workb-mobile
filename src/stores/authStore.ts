/**
 * WORKB Mobile - Auth Store
 * Authentication state management with Zustand
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { socketService } from '@/services/SocketService';
import { FCMService } from '@/services/FCMService';
import { AnalyticsService } from '@/services/AnalyticsService';
import { STORAGE_KEYS } from '@/constants';
import { User } from '@/types';

interface UpdateProfileData {
  displayName?: string;
  email?: string;
  photoURL?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  workspaceId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (identityToken: string, authorizationCode: string, fullName?: { givenName: string | null; familyName: string | null } | null) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  workspaceId: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Store credentials
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      if (user.workspaceId) {
        await AsyncStorage.setItem(STORAGE_KEYS.WORKSPACE_ID, user.workspaceId);
      }

      // Update state
      set({
        user,
        token,
        workspaceId: user.workspaceId,
        isLoading: false,
        isAuthenticated: true,
      });

      // Initialize services after login
      await get().initializeServicesAfterLogin(user);

      console.log('[Auth] Login successful:', user.email);
    } catch (error: any) {
      set({ isLoading: false });
      console.error('[Auth] Login failed:', error.message);
      throw error;
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true });

    try {
      const response = await api.post('/auth/google', { idToken });
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Store credentials
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      if (user.workspaceId) {
        await AsyncStorage.setItem(STORAGE_KEYS.WORKSPACE_ID, user.workspaceId);
      }

      // Update state
      set({
        user,
        token,
        workspaceId: user.workspaceId,
        isLoading: false,
        isAuthenticated: true,
      });

      // Initialize services after login
      await get().initializeServicesAfterLogin(user);

      console.log('[Auth] Google login successful:', user.email);
    } catch (error: any) {
      set({ isLoading: false });
      console.error('[Auth] Google login failed:', error.message);
      throw error;
    }
  },

  loginWithApple: async (identityToken: string, authorizationCode: string, fullName?: { givenName: string | null; familyName: string | null } | null) => {
    set({ isLoading: true });

    try {
      const response = await api.post('/auth/apple', {
        identityToken,
        authorizationCode,
        fullName: fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : undefined,
      });
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Store credentials
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      if (user.workspaceId) {
        await AsyncStorage.setItem(STORAGE_KEYS.WORKSPACE_ID, user.workspaceId);
      }

      // Update state
      set({
        user,
        token,
        workspaceId: user.workspaceId,
        isLoading: false,
        isAuthenticated: true,
      });

      // Initialize services after login
      await get().initializeServicesAfterLogin(user);

      console.log('[Auth] Apple login successful:', user.email);
    } catch (error: any) {
      set({ isLoading: false });
      console.error('[Auth] Apple login failed:', error.message);
      throw error;
    }
  },

  logout: async () => {
    const { user, workspaceId } = get();

    try {
      // Cleanup services
      socketService.disconnect();
      await FCMService.unsubscribeAll(workspaceId ?? undefined, user?.teamId);
      await AnalyticsService.clearUserData();

      // Clear storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_INFO,
        STORAGE_KEYS.WORKSPACE_ID,
        STORAGE_KEYS.FCM_TOKEN,
      ]);

      // Clear state
      set({
        user: null,
        token: null,
        workspaceId: null,
        isAuthenticated: false,
      });

      console.log('[Auth] Logout successful');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Still clear state even if cleanup fails
      set({
        user: null,
        token: null,
        workspaceId: null,
        isAuthenticated: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      const [token, userInfo, workspaceId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INFO),
        AsyncStorage.getItem(STORAGE_KEYS.WORKSPACE_ID),
      ]);

      if (token && userInfo) {
        const user = JSON.parse(userInfo) as User;

        set({
          token,
          user,
          workspaceId,
          isLoading: false,
          isAuthenticated: true,
        });

        // Initialize services
        await get().initializeServicesAfterLogin(user);

        console.log('[Auth] Session restored:', user.email);
        return true;
      }

      set({ isLoading: false, isAuthenticated: false });
      return false;
    } catch (error) {
      console.error('[Auth] Check auth error:', error);
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });

      // Persist updated user info
      AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
    }
  },

  updateProfile: async (data: UpdateProfileData) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      // TODO: 서버 API 연동 시 주석 해제
      // const response = await api.put('/users/profile', data);
      // const updatedUser = response.data.user;

      // 로컬 상태 업데이트 (서버 연동 전 임시)
      const updatedUser: User = {
        ...currentUser,
        displayName: data.displayName ?? currentUser.displayName,
        email: data.email ?? currentUser.email,
        photoURL: data.photoURL ?? currentUser.photoURL,
      };

      set({ user: updatedUser });

      // Persist updated user info
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));

      console.log('[Auth] Profile updated:', updatedUser.displayName);
    } catch (error: any) {
      console.error('[Auth] Profile update failed:', error.message);
      throw error;
    }
  },

  // Internal: Initialize services after successful authentication
  initializeServicesAfterLogin: async (user: User) => {
    try {
      // Connect to Socket.io
      const socketConnected = await socketService.connect();
      if (socketConnected && user.workspaceId) {
        socketService.joinWorkspace(user.workspaceId);
      }

      // Initialize FCM
      const fcmEnabled = await FCMService.initialize();
      if (fcmEnabled && user.workspaceId) {
        await FCMService.registerTokenWithServer(user.id, user.workspaceId);
        await FCMService.subscribeToWorkspace(user.workspaceId, user.teamId);
      }

      // Set analytics user properties
      await AnalyticsService.setUserProperties({
        userId: user.id,
        workspaceId: user.workspaceId,
        role: user.role,
        department: user.department,
      });
    } catch (error) {
      console.error('[Auth] Service initialization error:', error);
      // Don't throw - app should still work without these services
    }
  },
}));

export default useAuthStore;
