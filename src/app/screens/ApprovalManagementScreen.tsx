/**
 * WORKB Mobile - Approval Management Screen
 * 관리자 전용: 휴가/근태정정 승인 관리
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';

type TabType = 'leave' | 'correction';

// TODO: 실제 API에서 가져올 데이터
const MOCK_LEAVE_REQUESTS = [
  {
    id: '1',
    employeeName: '김철수',
    department: '개발팀',
    type: '연차',
    startDate: '2024-01-15',
    endDate: '2024-01-16',
    days: 2,
    reason: '개인 사유',
    requestedAt: '2024-01-10',
  },
  {
    id: '2',
    employeeName: '이영희',
    department: '디자인팀',
    type: '반차(오전)',
    startDate: '2024-01-17',
    endDate: '2024-01-17',
    days: 0.5,
    reason: '병원 진료',
    requestedAt: '2024-01-11',
  },
  {
    id: '3',
    employeeName: '박지민',
    department: '마케팅팀',
    type: '병가',
    startDate: '2024-01-18',
    endDate: '2024-01-19',
    days: 2,
    reason: '감기 증상',
    requestedAt: '2024-01-12',
  },
];

const MOCK_CORRECTION_REQUESTS = [
  {
    id: '1',
    employeeName: '최민수',
    department: '개발팀',
    date: '2024-01-10',
    type: '출근 시간 정정',
    originalTime: '09:30',
    requestedTime: '09:00',
    reason: '출근 기록 누락 (회의 참석)',
    requestedAt: '2024-01-11',
  },
  {
    id: '2',
    employeeName: '정수진',
    department: '인사팀',
    date: '2024-01-09',
    type: '퇴근 시간 정정',
    originalTime: '18:00',
    requestedTime: '20:30',
    reason: '야근 퇴근 기록 누락',
    requestedAt: '2024-01-10',
  },
];

const ApprovalManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('leave');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch latest approval requests
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleApprove = (id: string, type: TabType) => {
    Alert.alert(
      '승인 확인',
      type === 'leave' ? '휴가 신청을 승인하시겠습니까?' : '근태 정정을 승인하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '승인',
          onPress: () => {
            // TODO: API call
            Alert.alert('완료', '승인되었습니다.');
          },
        },
      ]
    );
  };

  const handleReject = (id: string, type: TabType) => {
    Alert.alert(
      '반려 확인',
      type === 'leave' ? '휴가 신청을 반려하시겠습니까?' : '근태 정정을 반려하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '반려',
          style: 'destructive',
          onPress: () => {
            // TODO: API call with reject reason
            Alert.alert('완료', '반려되었습니다.');
          },
        },
      ]
    );
  };

  const renderLeaveItem = (item: typeof MOCK_LEAVE_REQUESTS[0]) => (
    <View key={item.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.employeeName}</Text>
          <Text style={styles.department}>{item.department}</Text>
        </View>
        <View style={styles.leaveTypeBadge}>
          <Text style={styles.leaveTypeText}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Icon name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            {item.startDate} ~ {item.endDate} ({item.days}일)
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="document-text-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{item.reason}</Text>
        </View>
        <Text style={styles.requestedAt}>신청일: {item.requestedAt}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id, 'leave')}
        >
          <Text style={styles.rejectButtonText}>반려</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id, 'leave')}
        >
          <Text style={styles.approveButtonText}>승인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCorrectionItem = (item: typeof MOCK_CORRECTION_REQUESTS[0]) => (
    <View key={item.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.employeeName}</Text>
          <Text style={styles.department}>{item.department}</Text>
        </View>
        <View style={[styles.leaveTypeBadge, { backgroundColor: Colors.warning + '20' }]}>
          <Text style={[styles.leaveTypeText, { color: Colors.warning }]}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Icon name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            {item.originalTime} → {item.requestedTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="document-text-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{item.reason}</Text>
        </View>
        <Text style={styles.requestedAt}>신청일: {item.requestedAt}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id, 'correction')}
        >
          <Text style={styles.rejectButtonText}>반려</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id, 'correction')}
        >
          <Text style={styles.approveButtonText}>승인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>승인 관리</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leave' && styles.activeTab]}
          onPress={() => setActiveTab('leave')}
        >
          <Text style={[styles.tabText, activeTab === 'leave' && styles.activeTabText]}>
            휴가 신청
          </Text>
          {MOCK_LEAVE_REQUESTS.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{MOCK_LEAVE_REQUESTS.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'correction' && styles.activeTab]}
          onPress={() => setActiveTab('correction')}
        >
          <Text style={[styles.tabText, activeTab === 'correction' && styles.activeTabText]}>
            근태 정정
          </Text>
          {MOCK_CORRECTION_REQUESTS.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{MOCK_CORRECTION_REQUESTS.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'leave' ? (
          MOCK_LEAVE_REQUESTS.length > 0 ? (
            MOCK_LEAVE_REQUESTS.map(renderLeaveItem)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="checkmark-circle-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>대기 중인 휴가 신청이 없습니다</Text>
            </View>
          )
        ) : (
          MOCK_CORRECTION_REQUESTS.length > 0 ? (
            MOCK_CORRECTION_REQUESTS.map(renderCorrectionItem)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="checkmark-circle-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>대기 중인 근태 정정이 없습니다</Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.text,
  },
  headerRight: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  tabBadgeText: {
    ...Typography.small,
    color: Colors.surface,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  department: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  leaveTypeBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  leaveTypeText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  requestDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  requestedAt: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rejectButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: Colors.primary,
  },
  approveButtonText: {
    ...Typography.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
});

export default ApprovalManagementScreen;
