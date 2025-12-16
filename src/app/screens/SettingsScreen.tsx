/**
 * WORKB Mobile - Settings Screen
 * App settings and user profile management
 * 관리자(admin/hr/manager): 승인 관리 메뉴 추가
 * 직원(employee): 기본 메뉴만 표시
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAuthStore } from '../../stores';
import { FCMService } from '../../services';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// TODO: 실제 API에서 가져올 승인 대기 카운트
const MOCK_PENDING_COUNTS = {
  leave: 3,
  correction: 2,
};

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  danger,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View
      style={[
        styles.settingIcon,
        danger && { backgroundColor: Colors.error + '20' },
      ]}
    >
      <Icon
        name={icon}
        size={20}
        color={danger ? Colors.error : Colors.primary}
      />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && { color: Colors.error }]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || (
      onPress && <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
    )}
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);

  // 관리자 여부 체크 (admin, hr, manager = 관리자)
  const isAdmin = user?.role && user.role !== 'employee';

  const handlePushToggle = async (value: boolean) => {
    setPushEnabled(value);
    if (value) {
      await FCMService.initialize();
    }
    // TODO: Update server preference
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>설정</Text>
        </View>

        {/* Profile Section */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.avatarPlaceholder}>
            <Icon name="person" size={32} color={Colors.textSecondary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || '사용자'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileRole}>
              {user?.department || '부서 미지정'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Admin Section - 관리자만 표시 */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>관리</Text>
            <View style={styles.sectionContent}>
              <SettingItem
                icon="checkmark-circle-outline"
                title="승인 관리"
                subtitle={`휴가 ${MOCK_PENDING_COUNTS.leave}건, 근태정정 ${MOCK_PENDING_COUNTS.correction}건 대기중`}
                onPress={() => navigation.navigate('ApprovalManagement')}
                rightElement={
                  <View style={styles.badgeContainer}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {MOCK_PENDING_COUNTS.leave + MOCK_PENDING_COUNTS.correction}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
                  </View>
                }
              />
            </View>
            <View style={styles.adminNotice}>
              <Icon name="information-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.adminNoticeText}>
                상세 설정은 웹 관리자 페이지에서 관리하세요
              </Text>
            </View>
          </View>
        )}

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              title="푸시 알림"
              subtitle="출퇴근, 휴가, 게시판 알림"
              rightElement={
                <Switch
                  value={pushEnabled}
                  onValueChange={handlePushToggle}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              }
            />
          </View>
        </View>

        {/* Work Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>근무</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="time-outline"
              title="근무 기록"
              subtitle="이번 달 출퇴근 기록 확인"
              onPress={() => navigation.navigate('AttendanceHistory')}
            />
            <SettingItem
              icon="create-outline"
              title="근태 정정 요청"
              subtitle="출퇴근 시간 수정 요청"
              onPress={() => navigation.navigate('AttendanceCorrection')}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="information-circle-outline"
              title="버전"
              subtitle="1.0.0"
            />
            <SettingItem
              icon="document-text-outline"
              title="이용약관"
              onPress={() => {}}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="개인정보처리방침"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="log-out-outline"
              title="로그아웃"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>WORKB v1.0.0</Text>
          <Text style={styles.footerText}>© 2024 WORKB. All rights reserved.</Text>
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  profileName: {
    ...Typography.heading3,
    color: Colors.text,
  },
  profileEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  profileRole: {
    ...Typography.small,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.text,
  },
  settingSubtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  footerText: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  badgeText: {
    ...Typography.small,
    color: Colors.surface,
    fontWeight: '600',
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  adminNoticeText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
});

export default SettingsScreen;
