/**
 * WORKB Mobile - Home Screen
 * Main dashboard with attendance check-in/out
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAuthStore, useAttendanceStore } from '../../stores';

const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const {
    status,
    startTime,
    checkIn,
    checkOut,
    fetchStatus,
    isLoading,
  } = useAttendanceStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  }, []);

  const handlePress = async () => {
    try {
      if (status === 'working') {
        await checkOut();
      } else {
        await checkIn();
      }
    } catch (error) {
      console.error('Attendance action failed:', error);
    }
  };

  const formatDuration = () => {
    if (!startTime || status !== 'working') return '00:00:00';
    const diff = currentTime.getTime() - startTime.getTime();
    if (diff < 0) return '00:00:00';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후에요';
    return '수고하셨습니다';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>
                {user?.displayName || '사용자'}님
              </Text>
            </View>
            {user?.photoURL ? (
              <View style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="person" size={24} color={Colors.textSecondary} />
              </View>
            )}
          </View>

          <View style={styles.statusBadges}>
            <View style={styles.badge}>
              <Icon name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.badgeText}>사무실</Text>
            </View>
            <View style={styles.badge}>
              <Icon name="wifi-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.badgeText}>연결됨</Text>
            </View>
          </View>
        </View>

        {/* Main Action Area */}
        <View style={styles.mainArea}>
          {/* Current Time */}
          <View style={styles.timeDisplay}>
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.currentDate}>
              {currentTime.toLocaleDateString('ko-KR', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Check In/Out Button */}
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            disabled={isLoading}
            style={[
              styles.actionButton,
              status === 'working' ? styles.workingButton : styles.readyButton,
            ]}
          >
            <View style={styles.actionButtonInner}>
              {isLoading ? (
                <Text style={styles.actionButtonText}>...</Text>
              ) : (
                <>
                  <Text style={styles.actionButtonText}>
                    {status === 'working' ? '퇴근하기' : '출근하기'}
                  </Text>
                  <Text style={styles.actionButtonSubtext}>
                    {status === 'working' ? '근무 중...' : '시작할 준비 완료'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Work Duration */}
          {status === 'working' && (
            <View style={styles.durationContainer}>
              <Icon name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.durationText}>{formatDuration()}</Text>
            </View>
          )}
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>오늘의 일정</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleContent}>
              <Text style={styles.scheduleTitle}>표준 근무</Text>
              <Text style={styles.scheduleTime}>09:00 AM - 06:00 PM</Text>
            </View>
            <View style={styles.scheduleStatus}>
              <Text style={styles.scheduleStatusText}>정상</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.heading2,
    color: Colors.text,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  badgeText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  mainArea: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  currentTime: {
    fontSize: 56,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -2,
  },
  currentDate: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actionButton: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  workingButton: {
    backgroundColor: Colors.primary,
  },
  readyButton: {
    backgroundColor: Colors.secondary,
  },
  actionButtonInner: {
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...Typography.heading2,
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  actionButtonSubtext: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  durationText: {
    ...Typography.heading3,
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  scheduleSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  scheduleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleContent: {},
  scheduleTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  scheduleTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  scheduleStatus: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  scheduleStatusText: {
    ...Typography.small,
    color: Colors.success,
    fontWeight: '600',
  },
});

export default HomeScreen;
