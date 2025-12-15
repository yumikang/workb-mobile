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
  const { requests, balance, fetchLeaveData, setupRealtimeListeners, cleanupListeners } = useLeaveStore();
  const [refreshing, setRefreshing] = useState(false);

  // 연도 선택
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

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
    if (!startDate) {
      Alert.alert('알림', '시작일을 입력해주세요.');
      return;
    }

    if (selectedLeaveType === 'annual' && !endDate) {
      Alert.alert('알림', '종료일을 입력해주세요.');
      return;
    }

    Alert.alert(
      '휴가 신청 완료',
      `${getLeaveTypeText(selectedLeaveType)} 신청이 완료되었습니다.\n승인 대기 중입니다.`,
      [
        {
          text: '확인',
          onPress: () => {
            handleCloseRequestModal();
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
      case 'half_am':
        return '오전 반차';
      case 'half_pm':
        return '오후 반차';
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

  // 선택된 연도의 휴가 내역 필터링
  const filteredRequests = requests.filter((req) => {
    const reqYear = req.startDate.getFullYear();
    return reqYear === selectedYear;
  });

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

        {/* Year Selector */}
        <View style={styles.yearSelectorSection}>
          <TouchableOpacity
            style={styles.yearSelector}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={styles.yearText}>{selectedYear}</Text>
            <Icon name="chevron-down" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Annual Leave Card */}
        <View style={styles.leaveBalanceCard}>
          <View style={styles.leaveBalanceLeft}>
            <View style={styles.leaveBalanceHeader}>
              <View style={styles.leaveBalanceDot} />
              <Text style={styles.leaveBalanceTitle}>연차휴가</Text>
            </View>
            <Text style={styles.leaveBalanceDays}>
              {balance?.annual.remaining ?? 0}일
            </Text>
            <Text style={styles.leaveBalanceStatus}>신청 가능</Text>
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleOpenRequestModal}
          >
            <Text style={styles.applyButtonText}>신청</Text>
          </TouchableOpacity>
        </View>

        {/* Request History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>{selectedYear}년 신청 내역</Text>

          {filteredRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                name="document-outline"
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>
                {selectedYear}년 신청 내역이 없습니다
              </Text>
            </View>
          ) : (
            <View style={styles.requestList}>
              {filteredRequests.map((item) => (
                <View key={item.id}>
                  {renderLeaveItem({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.yearPickerOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.yearPickerContent}>
            {availableYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearPickerItem,
                  selectedYear === year && styles.yearPickerItemSelected,
                ]}
                onPress={() => {
                  setSelectedYear(year);
                  setShowYearPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.yearPickerItemText,
                    selectedYear === year && styles.yearPickerItemTextSelected,
                  ]}
                >
                  {year}년
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 휴가 신청 모달 */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseRequestModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>휴가 신청</Text>
              <TouchableOpacity onPress={handleCloseRequestModal}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

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
  yearSelectorSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  yearText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  // Annual Leave Balance Card
  leaveBalanceCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.primaryLight + '30',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveBalanceLeft: {},
  leaveBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  leaveBalanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  leaveBalanceTitle: {
    ...Typography.body,
    color: Colors.text,
  },
  leaveBalanceDays: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  leaveBalanceStatus: {
    ...Typography.caption,
    color: Colors.primary,
  },
  applyButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  applyButtonText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  // History Section
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
  // Year Picker Modal
  yearPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearPickerContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minWidth: 200,
  },
  yearPickerItem: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  yearPickerItemSelected: {
    backgroundColor: Colors.primaryLight + '30',
  },
  yearPickerItemText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
  },
  yearPickerItemTextSelected: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  // Request Modal
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
