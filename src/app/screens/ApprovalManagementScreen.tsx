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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';

type TabType = 'leave' | 'correction';

interface LeaveRequest {
  id: string;
  employeeName: string;
  department: string;
  position?: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  requestedAt: string;
  remainingLeave?: number;
  attachments?: string[];
}

interface CorrectionRequest {
  id: string;
  employeeName: string;
  department: string;
  position?: string;
  date: string;
  type: string;
  originalTime: string;
  requestedTime: string;
  reason: string;
  requestedAt: string;
  attachments?: string[];
}

// TODO: 실제 API에서 가져올 데이터
const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: '1',
    employeeName: '김철수',
    department: '개발팀',
    position: '사원',
    type: '연차',
    startDate: '2024-01-15',
    endDate: '2024-01-16',
    days: 2,
    reason: '가족 행사로 인한 휴가 신청입니다. 부모님 환갑 잔치에 참석해야 하여 이틀간 연차를 사용하고자 합니다.',
    requestedAt: '2024-01-10',
    remainingLeave: 12,
  },
  {
    id: '2',
    employeeName: '이영희',
    department: '디자인팀',
    position: '대리',
    type: '반차(오전)',
    startDate: '2024-01-17',
    endDate: '2024-01-17',
    days: 0.5,
    reason: '정기 건강검진을 위해 오전 반차 신청합니다.',
    requestedAt: '2024-01-11',
    remainingLeave: 8.5,
  },
  {
    id: '3',
    employeeName: '박지민',
    department: '마케팅팀',
    position: '과장',
    type: '병가',
    startDate: '2024-01-18',
    endDate: '2024-01-19',
    days: 2,
    reason: '감기 증상으로 인한 병가 신청입니다. 고열과 기침 증상이 있어 병원 진료 후 휴식이 필요합니다.',
    requestedAt: '2024-01-12',
    remainingLeave: 15,
    attachments: ['진단서.pdf'],
  },
];

const MOCK_CORRECTION_REQUESTS: CorrectionRequest[] = [
  {
    id: '1',
    employeeName: '최민수',
    department: '개발팀',
    position: '사원',
    date: '2024-01-10',
    type: '출근 시간 정정',
    originalTime: '09:30',
    requestedTime: '09:00',
    reason: '아침 긴급 회의 참석으로 인해 출근 기록이 누락되었습니다. 회의실에서 바로 업무를 시작하여 출근 체크를 하지 못했습니다.',
    requestedAt: '2024-01-11',
  },
  {
    id: '2',
    employeeName: '정수진',
    department: '인사팀',
    position: '대리',
    date: '2024-01-09',
    type: '퇴근 시간 정정',
    originalTime: '18:00',
    requestedTime: '20:30',
    reason: '연말 정산 업무로 야근을 했으나 퇴근 기록이 제대로 되지 않았습니다. 해당 날짜 이메일 발송 기록으로 확인 가능합니다.',
    requestedAt: '2024-01-10',
    attachments: ['업무이메일_캡처.png'],
  },
];

const ApprovalManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('leave');
  const [refreshing, setRefreshing] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionRequest | null>(null);
  const [comment, setComment] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch latest approval requests
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const openLeaveDetail = (item: LeaveRequest) => {
    setSelectedLeave(item);
    setSelectedCorrection(null);
    setComment('');
    setDetailModalVisible(true);
  };

  const openCorrectionDetail = (item: CorrectionRequest) => {
    setSelectedCorrection(item);
    setSelectedLeave(null);
    setComment('');
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedLeave(null);
    setSelectedCorrection(null);
    setComment('');
  };

  const handleApprove = () => {
    const type = selectedLeave ? 'leave' : 'correction';
    Alert.alert(
      '승인 확인',
      type === 'leave' ? '휴가 신청을 승인하시겠습니까?' : '근태 정정을 승인하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '승인',
          onPress: () => {
            // TODO: API call with comment
            Alert.alert('완료', '승인되었습니다.');
            closeDetailModal();
          },
        },
      ]
    );
  };

  const handleReject = () => {
    const type = selectedLeave ? 'leave' : 'correction';
    if (!comment.trim()) {
      Alert.alert('알림', '반려 사유를 입력해주세요.');
      return;
    }
    Alert.alert(
      '반려 확인',
      type === 'leave' ? '휴가 신청을 반려하시겠습니까?' : '근태 정정을 반려하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '반려',
          style: 'destructive',
          onPress: () => {
            // TODO: API call with reject reason (comment)
            Alert.alert('완료', '반려되었습니다.');
            closeDetailModal();
          },
        },
      ]
    );
  };

  const renderLeaveItem = (item: LeaveRequest) => (
    <TouchableOpacity
      key={item.id}
      style={styles.requestCard}
      onPress={() => openLeaveDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.requestHeader}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.employeeName}</Text>
          <Text style={styles.department}>{item.department} · {item.position}</Text>
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
          <Text style={styles.detailText} numberOfLines={1}>{item.reason}</Text>
        </View>
        <Text style={styles.requestedAt}>신청일: {item.requestedAt}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailText}>상세보기</Text>
        <Icon name="chevron-forward" size={16} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderCorrectionItem = (item: CorrectionRequest) => (
    <TouchableOpacity
      key={item.id}
      style={styles.requestCard}
      onPress={() => openCorrectionDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.requestHeader}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.employeeName}</Text>
          <Text style={styles.department}>{item.department} · {item.position}</Text>
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
          <Text style={styles.detailText} numberOfLines={1}>{item.reason}</Text>
        </View>
        <Text style={styles.requestedAt}>신청일: {item.requestedAt}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailText}>상세보기</Text>
        <Icon name="chevron-forward" size={16} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    const isLeave = selectedLeave !== null;
    const item = isLeave ? selectedLeave : selectedCorrection;
    if (!item) return null;

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetailModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeDetailModal} style={styles.modalCloseButton}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {isLeave ? '휴가 신청 상세' : '근태 정정 상세'}
              </Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Employee Info Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>신청자 정보</Text>
                <View style={styles.modalInfoCard}>
                  <View style={styles.modalInfoRow}>
                    <Icon name="person-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.modalInfoLabel}>이름</Text>
                    <Text style={styles.modalInfoValue}>{item.employeeName}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Icon name="business-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.modalInfoLabel}>부서</Text>
                    <Text style={styles.modalInfoValue}>{item.department}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Icon name="briefcase-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.modalInfoLabel}>직급</Text>
                    <Text style={styles.modalInfoValue}>{item.position}</Text>
                  </View>
                </View>
              </View>

              {/* Request Details Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>신청 내용</Text>
                <View style={styles.modalInfoCard}>
                  {isLeave && selectedLeave ? (
                    <>
                      <View style={styles.modalInfoRow}>
                        <Icon name="document-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.modalInfoLabel}>휴가 유형</Text>
                        <View style={styles.leaveTypeBadge}>
                          <Text style={styles.leaveTypeText}>{selectedLeave.type}</Text>
                        </View>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Icon name="calendar-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.modalInfoLabel}>기간</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedLeave.startDate} ~ {selectedLeave.endDate}
                        </Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Icon name="time-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.modalInfoLabel}>일수</Text>
                        <Text style={styles.modalInfoValue}>{selectedLeave.days}일</Text>
                      </View>
                      {selectedLeave.remainingLeave !== undefined && (
                        <View style={styles.modalInfoRow}>
                          <Icon name="hourglass-outline" size={18} color={Colors.textSecondary} />
                          <Text style={styles.modalInfoLabel}>잔여 연차</Text>
                          <Text style={[styles.modalInfoValue, { color: Colors.primary }]}>
                            {selectedLeave.remainingLeave}일
                          </Text>
                        </View>
                      )}
                    </>
                  ) : selectedCorrection ? (
                    <>
                      <View style={styles.modalInfoRow}>
                        <Icon name="document-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.modalInfoLabel}>정정 유형</Text>
                        <View style={[styles.leaveTypeBadge, { backgroundColor: Colors.warning + '20' }]}>
                          <Text style={[styles.leaveTypeText, { color: Colors.warning }]}>
                            {selectedCorrection.type}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Icon name="calendar-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.modalInfoLabel}>날짜</Text>
                        <Text style={styles.modalInfoValue}>{selectedCorrection.date}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Icon name="time-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.modalInfoLabel}>기존 시간</Text>
                        <Text style={styles.modalInfoValue}>{selectedCorrection.originalTime}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Icon name="arrow-forward-outline" size={18} color={Colors.primary} />
                        <Text style={styles.modalInfoLabel}>정정 시간</Text>
                        <Text style={[styles.modalInfoValue, { color: Colors.primary, fontWeight: '600' }]}>
                          {selectedCorrection.requestedTime}
                        </Text>
                      </View>
                    </>
                  ) : null}
                  <View style={styles.modalInfoRow}>
                    <Icon name="create-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.modalInfoLabel}>신청일</Text>
                    <Text style={styles.modalInfoValue}>{item.requestedAt}</Text>
                  </View>
                </View>
              </View>

              {/* Reason Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>신청 사유</Text>
                <View style={styles.reasonCard}>
                  <Text style={styles.reasonText}>{item.reason}</Text>
                </View>
              </View>

              {/* Attachments Section */}
              {item.attachments && item.attachments.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>첨부 파일</Text>
                  <View style={styles.attachmentsList}>
                    {item.attachments.map((file, index) => (
                      <TouchableOpacity key={index} style={styles.attachmentItem}>
                        <Icon name="attach-outline" size={18} color={Colors.primary} />
                        <Text style={styles.attachmentText}>{file}</Text>
                        <Icon name="download-outline" size={18} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Comment Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>코멘트 (반려 시 필수)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="승인/반려에 대한 코멘트를 입력하세요"
                  placeholderTextColor={Colors.textMuted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalRejectButton]}
                onPress={handleReject}
              >
                <Icon name="close-circle-outline" size={20} color={Colors.error} />
                <Text style={styles.modalRejectButtonText}>반려</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalApproveButton]}
                onPress={handleApprove}
              >
                <Icon name="checkmark-circle-outline" size={20} color={Colors.surface} />
                <Text style={styles.modalApproveButtonText}>승인</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Detail Modal */}
      {renderDetailModal()}

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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  viewDetailText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
  },
  modalScrollView: {
    flex: 1,
  },
  modalSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalSectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  modalInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalInfoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    width: 80,
  },
  modalInfoValue: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  reasonCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
  attachmentsList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  attachmentText: {
    ...Typography.body,
    color: Colors.primary,
    flex: 1,
  },
  commentInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.text,
    minHeight: 100,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  modalRejectButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  modalRejectButtonText: {
    ...Typography.button,
    color: Colors.error,
  },
  modalApproveButton: {
    backgroundColor: Colors.primary,
  },
  modalApproveButtonText: {
    ...Typography.button,
    color: Colors.surface,
  },
});

export default ApprovalManagementScreen;
