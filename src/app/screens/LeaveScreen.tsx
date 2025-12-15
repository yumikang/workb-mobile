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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useLeaveStore } from '../../stores';
import { LeaveRequest, LeaveStatus } from '../../types';

type LeaveTypeOption = 'annual' | 'half_am' | 'half_pm';

const LeaveScreen: React.FC = () => {
  const { requests, balance, isLoading, fetchLeaveData, setupRealtimeListeners, cleanupListeners } = useLeaveStore();
  const [refreshing, setRefreshing] = useState(false);

  // 휴가 신청 모달 상태
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveTypeOption>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

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

  const resetRequestForm = () => {
    setSelectedLeaveType('annual');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const handleOpenRequestModal = () => {
    resetRequestForm();
    setShowRequestModal(true);
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    resetRequestForm();
  };

  const handleSubmitRequest = () => {
    // 유효성 검사
    if (!startDate) {
      Alert.alert('알림', '시작일을 입력해주세요.');
      return;
    }

    if (selectedLeaveType === 'annual' && !endDate) {
      Alert.alert('알림', '종료일을 입력해주세요.');
      return;
    }

    // DEV: 신청 성공 처리 (실제로는 API 호출)
    Alert.alert(
      '휴가 신청 완료',
      `${getLeaveTypeText(selectedLeaveType)} 신청이 완료되었습니다.\n승인 대기 중입니다.`,
      [
        {
          text: '확인',
          onPress: () => {
            handleCloseRequestModal();
            // DEV: 새로고침
            fetchLeaveData();
          },
        },
      ]
    );
  };

  const getLeaveTypeLabel = (type: LeaveTypeOption) => {
    switch (type) {
      case 'annual':
        return '연차';
      case 'half_am':
        return '오전 반차';
      case 'half_pm':
        return '오후 반차';
    }
  };

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
          <TouchableOpacity
            style={styles.requestButton}
            activeOpacity={0.8}
            onPress={handleOpenRequestModal}
          >
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

      {/* 휴가 신청 모달 */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseRequestModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>휴가 신청</Text>
              <TouchableOpacity onPress={handleCloseRequestModal}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* 휴가 유형 선택 */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>휴가 유형</Text>
              <View style={styles.leaveTypeSelector}>
                {(['annual', 'half_am', 'half_pm'] as LeaveTypeOption[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.leaveTypeOption,
                      selectedLeaveType === type && styles.leaveTypeOptionSelected,
                    ]}
                    onPress={() => setSelectedLeaveType(type)}
                  >
                    <Text
                      style={[
                        styles.leaveTypeOptionText,
                        selectedLeaveType === type && styles.leaveTypeOptionTextSelected,
                      ]}
                    >
                      {getLeaveTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 날짜 입력 */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>
                {selectedLeaveType === 'annual' ? '시작일' : '날짜'}
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                value={startDate}
                onChangeText={setStartDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {selectedLeaveType === 'annual' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>종료일</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                  value={endDate}
                  onChangeText={setEndDate}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            )}

            {/* 사유 입력 */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>사유 (선택)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="휴가 사유를 입력해주세요"
                placeholderTextColor={Colors.textMuted}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* 제출 버튼 */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
              onPress={handleSubmitRequest}
            >
              <Text style={styles.submitButtonText}>신청하기</Text>
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
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  leaveTypeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  leaveTypeOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  leaveTypeOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  leaveTypeOptionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  leaveTypeOptionTextSelected: {
    color: Colors.surface,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTextArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonText: {
    ...Typography.button,
    color: Colors.surface,
  },
});

export default LeaveScreen;
