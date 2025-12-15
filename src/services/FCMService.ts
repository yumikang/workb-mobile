/**
 * WORKB Mobile - FCM Service
 * Firebase Cloud Messaging for push notifications
 *
 * Only uses FCM for push notifications - NO Firebase Auth/Firestore
 */

import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS, FCM_TOPICS } from '@/constants';
import { FCMNotificationData } from '@/types';

// Firebase Messaging types (lazy loaded)
interface RemoteMessage {
  messageId?: string;
  data?: { [key: string]: string };
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
}

type FirebaseMessagingModule = {
  default: () => {
    requestPermission: () => Promise<number>;
    getToken: () => Promise<string>;
    deleteToken: () => Promise<void>;
    onMessage: (callback: (message: RemoteMessage) => void) => () => void;
    onNotificationOpenedApp: (callback: (message: RemoteMessage) => void) => () => void;
    getInitialNotification: () => Promise<RemoteMessage | null>;
    subscribeToTopic: (topic: string) => Promise<void>;
    unsubscribeFromTopic: (topic: string) => Promise<void>;
  };
  AuthorizationStatus: {
    AUTHORIZED: number;
    PROVISIONAL: number;
    DENIED: number;
    NOT_DETERMINED: number;
  };
};

let messagingModule: FirebaseMessagingModule | null = null;

const getMessaging = async (): Promise<FirebaseMessagingModule | null> => {
  if (messagingModule) return messagingModule;

  try {
    // @ts-ignore - dynamic import
    messagingModule = await import('@react-native-firebase/messaging');
    return messagingModule;
  } catch (error) {
    console.warn('[FCM] Firebase Messaging not installed');
    return null;
  }
};

export const FCMService = {
  /**
   * Initialize FCM and request permissions
   */
  async initialize(): Promise<boolean> {
    const firebase = await getMessaging();
    if (!firebase) {
      console.log('[FCM] Skipping initialization - Firebase not available');
      return false;
    }

    try {
      const messaging = firebase.default();
      const authStatus = await messaging.requestPermission();
      const enabled =
        authStatus === firebase.AuthorizationStatus.AUTHORIZED ||
        authStatus === firebase.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[FCM] Push notification permission granted');

        // Get and store FCM token
        const token = await messaging.getToken();
        await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
        console.log('[FCM] Token acquired:', token.substring(0, 20) + '...');

        return true;
      } else {
        console.log('[FCM] Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('[FCM] Initialization failed:', error);
      return false;
    }
  },

  /**
   * Get current FCM token
   */
  async getToken(): Promise<string | null> {
    // Try stored token first
    const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
    if (savedToken) return savedToken;

    // Get new token
    const firebase = await getMessaging();
    if (!firebase) return null;

    try {
      const messaging = firebase.default();
      const token = await messaging.getToken();
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
      return token;
    } catch (error) {
      console.error('[FCM] Failed to get token:', error);
      return null;
    }
  },

  /**
   * Register device token with backend server
   */
  async registerTokenWithServer(userId: string, workspaceId: string): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          userId,
          workspaceId,
          platform: Platform.OS,
          deviceId: `${Platform.OS}_${Date.now()}`, // Simple device ID
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('[FCM] Token registered with server');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[FCM] Failed to register token:', error);
      return false;
    }
  },

  /**
   * Subscribe to workspace topics for targeted notifications
   */
  async subscribeToWorkspace(workspaceId: string, teamId?: string): Promise<void> {
    const firebase = await getMessaging();
    if (!firebase) return;

    try {
      const messaging = firebase.default();

      // Subscribe to all users topic
      await messaging.subscribeToTopic(FCM_TOPICS.ALL_USERS);

      // Subscribe to workspace topic
      await messaging.subscribeToTopic(FCM_TOPICS.WORKSPACE(workspaceId));

      // Subscribe to team topic if provided
      if (teamId) {
        await messaging.subscribeToTopic(FCM_TOPICS.TEAM(teamId));
      }

      console.log('[FCM] Subscribed to workspace topics');
    } catch (error) {
      console.error('[FCM] Failed to subscribe to topics:', error);
    }
  },

  /**
   * Unsubscribe from all topics (on logout)
   */
  async unsubscribeAll(workspaceId?: string, teamId?: string): Promise<void> {
    const firebase = await getMessaging();
    if (!firebase) return;

    try {
      const messaging = firebase.default();

      await messaging.unsubscribeFromTopic(FCM_TOPICS.ALL_USERS);

      if (workspaceId) {
        await messaging.unsubscribeFromTopic(FCM_TOPICS.WORKSPACE(workspaceId));
      }

      if (teamId) {
        await messaging.unsubscribeFromTopic(FCM_TOPICS.TEAM(teamId));
      }

      // Clear stored token
      await AsyncStorage.removeItem(STORAGE_KEYS.FCM_TOKEN);

      console.log('[FCM] Unsubscribed from all topics');
    } catch (error) {
      console.error('[FCM] Failed to unsubscribe:', error);
    }
  },

  /**
   * Setup foreground notification listener
   */
  async onForegroundMessage(
    callback: (message: RemoteMessage) => void
  ): Promise<() => void> {
    const firebase = await getMessaging();
    if (!firebase) return () => {};

    const messaging = firebase.default();
    return messaging.onMessage(callback);
  },

  /**
   * Setup background notification opened listener
   */
  async onNotificationOpened(
    callback: (message: RemoteMessage) => void
  ): Promise<() => void> {
    const firebase = await getMessaging();
    if (!firebase) return () => {};

    const messaging = firebase.default();
    return messaging.onNotificationOpenedApp(callback);
  },

  /**
   * Get notification that opened the app from quit state
   */
  async getInitialNotification(): Promise<RemoteMessage | null> {
    const firebase = await getMessaging();
    if (!firebase) return null;

    const messaging = firebase.default();
    return messaging.getInitialNotification();
  },

  /**
   * Handle notification data and navigate accordingly
   */
  handleNotificationNavigation(
    data: FCMNotificationData | undefined,
    navigate: (screen: string, params?: any) => void
  ): void {
    if (!data) return;

    console.log('[FCM] Handling notification:', data);

    switch (data.type) {
      case 'attendance':
        navigate('Home');
        break;

      case 'leave':
        if (data.entityId) {
          navigate('LeaveDetail', { leaveId: data.entityId });
        } else {
          navigate('Leave');
        }
        break;

      case 'notice':
        if (data.entityId) {
          navigate('NoticeDetail', { noticeId: data.entityId });
        } else {
          navigate('Notices');
        }
        break;

      case 'presence_check':
        // Show presence check modal/alert
        Alert.alert(
          '근무 확인',
          '현재 근무 중이신가요?',
          [
            { text: '예, 근무 중입니다', onPress: () => this.respondToPresenceCheck(data.entityId!) },
            { text: '취소', style: 'cancel' },
          ]
        );
        break;

      default:
        if (data.screen) {
          navigate(data.screen);
        }
    }
  },

  /**
   * Respond to presence check
   */
  async respondToPresenceCheck(checkId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/attendance/presence-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkId, response: true }),
      });
      console.log('[FCM] Presence check responded');
    } catch (error) {
      console.error('[FCM] Failed to respond to presence check:', error);
    }
  },

  /**
   * Show local notification for foreground messages
   */
  showForegroundAlert(message: RemoteMessage, onView?: () => void): void {
    if (!message.notification) return;

    Alert.alert(
      message.notification.title || 'WORKB',
      message.notification.body || '',
      [
        { text: '닫기', style: 'cancel' },
        ...(onView ? [{ text: '보기', onPress: onView }] : []),
      ]
    );
  },
};

export default FCMService;
