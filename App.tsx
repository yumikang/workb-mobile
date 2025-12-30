/**
 * WORKB Mobile - Main Application Entry Point
 * Bare React Native with FCM + Socket.io integration
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, LogBox, Alert, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { Colors } from './src/constants';
import {
  NetworkService,
  AnalyticsService,
  FCMService,
  socketService,
} from './src/services';
import { ErrorBoundary } from './src/components/common';
import { useAuthStore } from './src/stores';
import { RootStackParamList } from './src/types';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

// Navigation ref for deep linking and push notification navigation
const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

function App(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const { isLoggedIn, user } = useAuthStore();

  // Handle FCM notification navigation
  const handleNotificationNavigation = useCallback(
    (data: { [key: string]: string } | undefined) => {
      if (!data) return;

      setTimeout(() => {
        // Navigate based on notification type
        if (data.screen === 'leave') {
          navigationRef.current?.navigate('MainTabs');
        } else if (data.screen === 'notice' && data.entityId) {
          navigationRef.current?.navigate('MainTabs');
        } else if (data.screen === 'attendance') {
          navigationRef.current?.navigate('MainTabs');
        } else if (data.screen) {
          // @ts-ignore - dynamic screen navigation
          navigationRef.current?.navigate(data.screen);
        }
      }, 500);
    },
    []
  );

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize NetworkService
        await NetworkService.initialize();

        const networkStatus = NetworkService.getNetworkStatus();
        if (networkStatus === 'none') {
          Alert.alert(
            '인터넷 연결 없음',
            '네트워크 연결을 확인해주세요.',
            [{ text: '확인', style: 'default' }],
            { cancelable: true }
          );
          console.log('[App] ⚠️ No network connection');
        }

        // Log app open event (only if online)
        if (networkStatus !== 'none') {
          await AnalyticsService.logAppOpen();
        }

        // Initialize FCM for push notifications (only if online)
        if (networkStatus !== 'none') {
          const fcmEnabled = await FCMService.initialize();
          if (fcmEnabled) {
            console.log('[App] ✅ FCM initialized');

            // Check if app was opened from a notification
            const initialNotification = await FCMService.getInitialNotification();
            if (initialNotification?.data) {
              console.log('[App] App opened from notification:', initialNotification.data);
              handleNotificationNavigation(initialNotification.data);
            }
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error('[App] Initialization error:', error);
        setIsReady(true);
      }
    };

    initApp();

    return () => {
      NetworkService.cleanup();
      socketService.disconnect();
    };
  }, [handleNotificationNavigation]);

  // Setup FCM notification listeners
  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeOpened: (() => void) | undefined;

    const setupNotificationListeners = async () => {
      // Foreground notification handler
      unsubscribeForeground = await FCMService.onForegroundMessage((message) => {
        console.log('[App] Foreground notification:', message);

        if (message.notification) {
          Alert.alert(
            message.notification.title || '알림',
            message.notification.body || '',
            [
              { text: '닫기', style: 'cancel' },
              {
                text: '보기',
                onPress: () => handleNotificationNavigation(message.data),
              },
            ]
          );
        }
      });

      // Background/quit notification opened handler
      unsubscribeOpened = await FCMService.onNotificationOpened((message) => {
        console.log('[App] Notification opened:', message);
        handleNotificationNavigation(message.data);
      });
    };

    setupNotificationListeners();

    return () => {
      unsubscribeForeground?.();
      unsubscribeOpened?.();
    };
  }, [handleNotificationNavigation]);

  // Connect Socket.io when user logs in
  useEffect(() => {
    if (isLoggedIn && user?.workspaceId) {
      const token = useAuthStore.getState().token;
      if (token) {
        socketService.connect(token, user.workspaceId);
      }
    } else {
      socketService.disconnect();
    }
  }, [isLoggedIn, user?.workspaceId]);

  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.surface}
          translucent={false}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Colors.surface}
            translucent={false}
          />
          <NavigationContainer
            ref={navigationRef}
            theme={{
              dark: false,
              colors: {
                primary: Colors.primary,
                background: Colors.background,
                card: Colors.surface,
                text: Colors.text,
                border: Colors.border,
                notification: Colors.error,
              },
              fonts: {
                regular: {
                  fontFamily: 'System',
                  fontWeight: '400',
                },
                medium: {
                  fontFamily: 'System',
                  fontWeight: '500',
                },
                bold: {
                  fontFamily: 'System',
                  fontWeight: '700',
                },
                heavy: {
                  fontFamily: 'System',
                  fontWeight: '900',
                },
              },
            }}
          >
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;
