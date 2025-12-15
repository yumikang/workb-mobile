/**
 * WORKB Mobile - Leave Screen
 * Leave request management and balance display
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useLeaveStore } from '../../stores';
import { LeaveRequest, LeaveStatus } from '../../types';

const LeaveScreen: React.FC = () => {
  const { requests, balance, isLoading, fetchLeaveData, setupRealtimeListeners, cleanupListeners } = useLeaveStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaveData();
    setupRealtimeListeners();

    return () => {
      cleanupListeners();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaveData();
    setRefreshing(false);
  }, []);

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return Colors.success;
      case 'rejected':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  const getStatusText = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '반려됨';
      default:
        return '대기중';
    }
  };

  const getLeaveTypeText = (type: string) => {
    switch (type) {
      case 'annual':
        return '연차';
      case 'sick':
        return '병가';
      case 'half_am':
        return '오전 반차';
      case 'half_pm':
        return '오후 반차';
      case 'personal':
        return '개인 휴가';
      default:
        return type;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderLeaveItem = ({ item }: { item: LeaveRequest }) => (
    <View style={styles.leaveCard}>
      <View style={styles.leaveCardHeader}>
        <View style={styles.leaveType}>
          <Icon
            name={item.type.includes('half') ? 'time-outline' : 'calendar-outline'}
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.leaveTypeText}>{getLeaveTypeText(item.type)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.leaveCardBody}>
        <View style={styles.dateRange}>
          <Text style={styles.dateText}>
            {formatDate(item.startDate)}
            {item.startDate.getTime() !== item.endDate.getTime() &&
              ` - ${formatDate(item.endDate)}`}
          </Text>
          <Text style={styles.daysText}>{item.days}일</Text>
        </View>
        {item.reason && (
          <Text style={styles.reasonText} numberOfLines={2}>
            {item.reason}
          </Text>
        )}
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>휴가 관리</Text>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Icon name="sunny-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>연차</Text>
              <Text style={styles.balanceValue}>
                {balance?.annual.remaining ?? 0}
                <Text style={styles.balanceTotal}>
                  /{balance?.annual.total ?? 0}일
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <View style={[styles.balanceIcon, { backgroundColor: Colors.warning + '20' }]}>
              <Icon name="medkit-outline" size={24} color={Colors.warning} />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>병가</Text>
              <Text style={styles.balanceValue}>
                {balance?.sick.remaining ?? 0}
                <Text style={styles.balanceTotal}>
                  /{balance?.sick.total ?? 0}일
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Request Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.requestButton} activeOpacity={0.8}>
            <Icon name="add-circle-outline" size={20} color={Colors.surface} />
            <Text style={styles.requestButtonText}>휴가 신청</Text>
          </TouchableOpacity>
        </View>

        {/* Request History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>신청 내역</Text>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                name="document-outline"
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>신청 내역이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.requestList}>
              {requests.map((item) => (
                <View key={item.id}>
                  {renderLeaveItem({ item })}
                </View>
              ))}
            </View>
          )}
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
  balanceSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceInfo: {},
  balanceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  balanceValue: {
    ...Typography.heading3,
    color: Colors.text,
  },
  balanceTotal: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  actionSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  requestButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  requestButtonText: {
    ...Typography.button,
    color: Colors.surface,
  },
  historySection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  requestList: {
    gap: Spacing.md,
  },
  leaveCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leaveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  leaveType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  leaveTypeText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.small,
    fontWeight: '600',
  },
  leaveCardBody: {},
  dateRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  daysText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  reasonText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
});

export default LeaveScreen;
