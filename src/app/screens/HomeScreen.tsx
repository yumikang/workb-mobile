/**
 * WORKB Mobile - Home Screen
 * Main dashboard with attendance check-in/out
 * Supports Leader/Staff mode toggle
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAuthStore, useAttendanceStore } from '../../stores';
import { RootStackParamList } from '../../types';

type ViewMode = 'leader' | 'staff';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
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
  const [viewMode, setViewMode] = useState<ViewMode>('staff');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  // 관리자 권한 확인 (admin 또는 leader 역할)
  const isAdmin = user?.role === 'admin' || user?.role === 'leader';

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
        const now = new Date();
        setCheckInTime(now);
        setShowCheckInModal(true);
      }
    } catch (error) {
      console.error('Attendance action failed:', error);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
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
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              {user?.photoURL ? (
                <View style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={24} color={Colors.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Mode Toggle + Status Badges Row */}
          <View style={styles.toggleAndBadgesRow}>
            {/* Mode Toggle - 관리자만 표시 */}
            {isAdmin && (
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    viewMode === 'leader' && styles.modeToggleButtonActive,
                  ]}
                  onPress={() => setViewMode('leader')}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      viewMode === 'leader' && styles.modeToggleTextActive,
                    ]}
                  >
                    리더
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    viewMode === 'staff' && styles.modeToggleButtonActive,
                  ]}
                  onPress={() => setViewMode('staff')}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      viewMode === 'staff' && styles.modeToggleTextActive,
                    ]}
                  >
                    직원
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
                  {status === 'working' && startTime ? (
                    <Text style={styles.actionButtonStartTime}>
                      {formatTime(startTime)}~
                    </Text>
                  ) : (
                    <Text style={styles.actionButtonSubtext}>
                      시작할 준비 완료
                    </Text>
                  )}
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

        {/* Leader Mode: 관리자 전용 기능 */}
        {viewMode === 'leader' && isAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>관리자 메뉴</Text>

            {/* 휴가 승인 */}
            <TouchableOpacity style={styles.adminCard}>
              <View style={styles.adminCardIcon}>
                <Icon name="calendar-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.adminCardContent}>
                <Text style={styles.adminCardTitle}>휴가 승인</Text>
                <Text style={styles.adminCardSubtitle}>대기 중인 요청 3건</Text>
              </View>
              <View style={styles.adminCardBadge}>
                <Text style={styles.adminCardBadgeText}>3</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* 공지사항 작성 */}
            <TouchableOpacity style={styles.adminCard}>
              <View style={styles.adminCardIcon}>
                <Icon name="megaphone-outline" size={24} color={Colors.warning} />
              </View>
              <View style={styles.adminCardContent}>
                <Text style={styles.adminCardTitle}>공지사항 작성</Text>
                <Text style={styles.adminCardSubtitle}>새 공지사항 등록</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* 팀원 근태 현황 */}
            <TouchableOpacity style={styles.adminCard}>
              <View style={styles.adminCardIcon}>
                <Icon name="people-outline" size={24} color={Colors.secondary} />
              </View>
              <View style={styles.adminCardContent}>
                <Text style={styles.adminCardTitle}>팀원 근태 현황</Text>
                <Text style={styles.adminCardSubtitle}>출근 5명 / 총 8명</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* 근무 통계 */}
            <TouchableOpacity style={styles.adminCard}>
              <View style={styles.adminCardIcon}>
                <Icon name="stats-chart-outline" size={24} color={Colors.accent} />
              </View>
              <View style={styles.adminCardContent}>
                <Text style={styles.adminCardTitle}>근무 통계</Text>
                <Text style={styles.adminCardSubtitle}>이번 주 리포트 보기</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Schedule - 공통 표시 */}
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

      {/* 출근 완료 모달 */}
      <Modal
        visible={showCheckInModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalCheckIcon}>
              <Icon name="checkmark" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.modalTime}>{formatTime(checkInTime)}</Text>
            <Text style={styles.modalTitle}>출근 처리되었습니다!</Text>
            <View style={styles.modalWorkspace}>
              <Icon name="business-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.modalWorkspaceText}>WORKB</Text>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCheckInModal(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  toggleAndBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  actionButtonStartTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFEB3B',
    letterSpacing: 1,
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
  // Mode Toggle Styles
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  modeToggleButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  modeToggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeToggleText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeToggleTextActive: {
    color: Colors.surface,
  },
  // Admin Section Styles
  adminSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminCardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  adminCardContent: {
    flex: 1,
  },
  adminCardTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  adminCardSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  adminCardBadge: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginRight: Spacing.sm,
  },
  adminCardBadgeText: {
    ...Typography.small,
    color: Colors.surface,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalCheckIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  modalTime: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  modalWorkspace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  modalWorkspaceText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  modalButton: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  modalButtonText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
});

export default HomeScreen;
