/**
 * WORKB Mobile - Attendance Correction Screen
 * 근태 정정 요청 (출퇴근 시간 수정 요청)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import {
  RootStackParamList,
  AttendanceCorrectionRequest,
  CorrectionType,
} from '../../types';
import { useAuthStore } from '../../stores';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceCorrection'>;

// DEV 모드 목 데이터
const mockCorrections: AttendanceCorrectionRequest[] = [
  {
    id: '1',
    userId: 'user1',
    date: '2024-12-13',
    correctionType: 'check_in',
    originalCheckIn: new Date(2024, 11, 13, 9, 32),
    requestedCheckIn: new Date(2024, 11, 13, 8, 55),
    reason: 'GPS 오류로 실제 출근 시간보다 늦게 기록됨',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '2',
    userId: 'user1',
    date: '2024-12-10',
    correctionType: 'check_out',
    originalCheckOut: undefined,
    requestedCheckOut: new Date(2024, 11, 10, 18, 30),
    reason: '퇴근 체크 깜빡함',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 4),
    reviewedAt: new Date(Date.now() - 86400000 * 3),
    reviewedBy: 'admin1',
  },
  {
    id: '3',
    userId: 'user1',
    date: '2024-12-05',
    correctionType: 'both',
    originalCheckIn: new Date(2024, 11, 5, 10, 15),
    originalCheckOut: new Date(2024, 11, 5, 17, 0),
    requestedCheckIn: new Date(2024, 11, 5, 9, 0),
    requestedCheckOut: new Date(2024, 11, 5, 18, 0),
    reason: '외근 후 복귀하여 출퇴근 시간 오류',
    status: 'rejected',
    createdAt: new Date(Date.now() - 86400000 * 10),
    reviewedAt: new Date(Date.now() - 86400000 * 9),
    reviewedBy: 'admin1',
    rejectReason: '증빙 자료 부족',
  },
];

const AttendanceCorrectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>(mockCorrections);

  // 새 요청 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [correctionType, setCorrectionType] = useState<CorrectionType>('check_in');
  const [requestedCheckIn, setRequestedCheckIn] = useState('');
  const [requestedCheckOut, setRequestedCheckOut] = useState('');
  const [reason, setReason] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: API 호출
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (date?: Date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: AttendanceCorrectionRequest['status']) => {
    switch (status) {
      case 'pending':
        return { label: '대기중', color: '#64748B', icon: 'time-outline' }; // slate-500
      case 'approved':
        return { label: '승인', color: '#0D9488', icon: 'checkmark-circle-outline' }; // teal-600
      case 'rejected':
        return { label: '반려', color: '#DC2626', icon: 'close-circle-outline' }; // red-600
    }
  };

  const getCorrectionTypeLabel = (type: CorrectionType) => {
    switch (type) {
      case 'check_in':
        return '출근 시간';
      case 'check_out':
        return '퇴근 시간';
      case 'both':
        return '출퇴근 시간';
    }
  };

  const handleSubmit = () => {
    if (!selectedDate || !reason.trim()) {
      Alert.alert('알림', '날짜와 사유를 입력해주세요.');
      return;
    }

    if (correctionType === 'check_in' && !requestedCheckIn) {
      Alert.alert('알림', '정정할 출근 시간을 입력해주세요.');
      return;
    }

    if (correctionType === 'check_out' && !requestedCheckOut) {
      Alert.alert('알림', '정정할 퇴근 시간을 입력해주세요.');
      return;
    }

    if (correctionType === 'both' && (!requestedCheckIn || !requestedCheckOut)) {
      Alert.alert('알림', '정정할 출퇴근 시간을 모두 입력해주세요.');
      return;
    }

    // 새 요청 추가 (DEV)
    const newRequest: AttendanceCorrectionRequest = {
      id: Date.now().toString(),
      userId: user?.id || '',
      date: selectedDate,
      correctionType,
      requestedCheckIn: requestedCheckIn
        ? new Date(`${selectedDate}T${requestedCheckIn}`)
        : undefined,
      requestedCheckOut: requestedCheckOut
        ? new Date(`${selectedDate}T${requestedCheckOut}`)
        : undefined,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date(),
    };

    setCorrections((prev) => [newRequest, ...prev]);
    resetModal();
    Alert.alert('완료', '근태 정정 요청이 접수되었습니다.');
  };

  const resetModal = () => {
    setShowModal(false);
    setSelectedDate('');
    setCorrectionType('check_in');
    setRequestedCheckIn('');
    setRequestedCheckOut('');
    setReason('');
  };

  const pendingCount = corrections.filter((c) => c.status === 'pending').length;

  const renderCorrectionItem = (item: AttendanceCorrectionRequest) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <View key={item.id} style={styles.correctionCard}>
        {/* 헤더 */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Icon name={statusInfo.icon} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* 정정 유형 */}
        <Text style={styles.correctionType}>
          {getCorrectionTypeLabel(item.correctionType)} 정정
        </Text>

        {/* 시간 비교 */}
        <View style={styles.timeComparison}>
          {(item.correctionType === 'check_in' || item.correctionType === 'both') && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>출근</Text>
              <Text style={styles.timeOriginal}>{formatTime(item.originalCheckIn)}</Text>
              <Icon name="arrow-forward" size={14} color={Colors.primary} />
              <Text style={styles.timeRequested}>{formatTime(item.requestedCheckIn)}</Text>
            </View>
          )}
          {(item.correctionType === 'check_out' || item.correctionType === 'both') && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>퇴근</Text>
              <Text style={styles.timeOriginal}>{formatTime(item.originalCheckOut)}</Text>
              <Icon name="arrow-forward" size={14} color={Colors.primary} />
              <Text style={styles.timeRequested}>{formatTime(item.requestedCheckOut)}</Text>
            </View>
          )}
        </View>

        {/* 사유 */}
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason}
        </Text>

        {/* 반려 사유 */}
        {item.status === 'rejected' && item.rejectReason && (
          <View style={styles.rejectReasonBox}>
            <Icon name="information-circle-outline" size={14} color={Colors.error} />
            <Text style={styles.rejectReasonText}>{item.rejectReason}</Text>
          </View>
        )}

        {/* 처리 정보 */}
        {item.reviewedAt && (
          <Text style={styles.reviewedInfo}>
            처리일: {formatDateTime(item.reviewedAt)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>근태 정정 요청</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 안내 카드 */}
        <View style={styles.infoCard}>
          <Icon name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            GPS 오류, 앱 문제 등으로 출퇴근 시간이 잘못 기록된 경우 정정을 요청할 수 있습니다.
          </Text>
        </View>

        {/* 대기중 카운트 */}
        {pendingCount > 0 && (
          <View style={styles.pendingBanner}>
            <Icon name="time-outline" size={18} color="#64748B" />
            <Text style={styles.pendingText}>
              대기 중인 요청 {pendingCount}건
            </Text>
          </View>
        )}

        {/* 요청 리스트 */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>요청 내역</Text>
          {corrections.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="document-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>정정 요청 내역이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.correctionsList}>
              {corrections.map(renderCorrectionItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB - 새 요청 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Icon name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>

      {/* 새 요청 모달 */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={resetModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>근태 정정 요청</Text>
              <TouchableOpacity onPress={resetModal}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* 날짜 선택 */}
              <Text style={styles.inputLabel}>정정할 날짜</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                value={selectedDate}
                onChangeText={setSelectedDate}
              />

              {/* 정정 유형 */}
              <Text style={styles.inputLabel}>정정 유형</Text>
              <View style={styles.typeSelector}>
                {(['check_in', 'check_out', 'both'] as CorrectionType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      correctionType === type && styles.typeOptionActive,
                    ]}
                    onPress={() => setCorrectionType(type)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        correctionType === type && styles.typeOptionTextActive,
                      ]}
                    >
                      {getCorrectionTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 출근 시간 입력 */}
              {(correctionType === 'check_in' || correctionType === 'both') && (
                <>
                  <Text style={styles.inputLabel}>정정할 출근 시간</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM (예: 09:00)"
                    placeholderTextColor={Colors.textMuted}
                    value={requestedCheckIn}
                    onChangeText={setRequestedCheckIn}
                  />
                </>
              )}

              {/* 퇴근 시간 입력 */}
              {(correctionType === 'check_out' || correctionType === 'both') && (
                <>
                  <Text style={styles.inputLabel}>정정할 퇴근 시간</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM (예: 18:00)"
                    placeholderTextColor={Colors.textMuted}
                    value={requestedCheckOut}
                    onChangeText={setRequestedCheckOut}
                  />
                </>
              )}

              {/* 사유 */}
              <Text style={styles.inputLabel}>정정 사유</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="GPS 오류, 앱 문제 등 정정이 필요한 사유를 입력해주세요"
                placeholderTextColor={Colors.textMuted}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>요청하기</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  scrollView: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.primary,
    flex: 1,
    lineHeight: 18,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64748B15',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  pendingText: {
    ...Typography.caption,
    color: '#64748B',
    fontWeight: '600',
  },
  listSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  listTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  correctionsList: {
    gap: Spacing.md,
  },
  correctionCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardDate: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusText: {
    ...Typography.small,
    fontWeight: '600',
  },
  correctionType: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  timeComparison: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    width: 32,
  },
  timeOriginal: {
    ...Typography.caption,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    fontFamily: 'monospace',
  },
  timeRequested: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  reasonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  rejectReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.error + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  rejectReasonText: {
    ...Typography.small,
    color: Colors.error,
    flex: 1,
  },
  reviewedInfo: {
    ...Typography.small,
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
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal Styles
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeOptionText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  typeOptionTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    ...Typography.bodyBold,
    color: Colors.surface,
  },
});

export default AttendanceCorrectionScreen;
