/**
 * WORKB Mobile - Splash Screen
 * Initial loading screen with authentication check
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Colors, Typography, Spacing } from '../../constants';
import { NetworkService } from '../../services';
import { useAuthStore } from '../../stores';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { checkAuth, isLoggedIn } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize network service
        await NetworkService.initialize();

        // Check authentication status
        await checkAuth();

        // Minimum splash duration
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));

        // Navigate based on auth state
        if (isLoggedIn) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('[Splash] Initialization error:', error);
        navigation.replace('Login');
      }
    };

    initialize();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>W</Text>
        </View>
      </View>

      {/* App Name */}
      <Text style={styles.appName}>WORKB</Text>
      <Text style={styles.tagline}>스마트한 업무 관리</Text>

      {/* Loading Indicator */}
      <ActivityIndicator
        style={styles.loader}
        size="small"
        color={Colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.surface,
  },
  appName: {
    ...Typography.heading1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  loader: {
    position: 'absolute',
    bottom: 100,
  },
});

export default SplashScreen;
