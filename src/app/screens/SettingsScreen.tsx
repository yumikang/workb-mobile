/**
 * WORKB Mobile - Settings Screen
 * App settings and user profile management
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAuthStore } from '../../stores';
import { FCMService } from '../../services';

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
  const { user, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);

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
        <View style={styles.profileSection}>
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
        </View>

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
              onPress={() => {}}
            />
            <SettingItem
              icon="stats-chart-outline"
              title="근무 통계"
              subtitle="근무 시간 및 패턴 분석"
              onPress={() => {}}
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
});

export default SettingsScreen;
