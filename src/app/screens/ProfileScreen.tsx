/**
 * WORKB Mobile - Profile Screen
 * User profile info and attendance history with edit functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAuthStore, useAttendanceStore } from '../../stores';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

// 임시 출근 기록 데이터 (DEV)
const mockAttendanceHistory = [
  {
    id: '1',
    date: new Date(),
    checkIn: '09:00',
    checkOut: '18:00',
    workHours: '9시간 00분',
    status: 'normal',
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000),
    checkIn: '09:15',
    checkOut: '18:30',
    workHours: '9시간 15분',
    status: 'late',
  },
  {
    id: '3',
    date: new Date(Date.now() - 86400000 * 2),
    checkIn: '08:55',
    checkOut: '17:30',
    workHours: '8시간 35분',
    status: 'early_leave',
  },
];

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, updateProfile } = useAuthStore();
  const { status, startTime } = useAttendanceStore();
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(user?.photoURL || null);
  const [isSaving, setIsSaving] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return { text: '정상', color: Colors.success };
      case 'late':
        return { text: '지각', color: Colors.warning };
      case 'early_leave':
        return { text: '조퇴', color: Colors.warning };
      case 'absent':
        return { text: '결근', color: Colors.danger };
      default:
        return { text: '-', color: Colors.textMuted };
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openEditModal = () => {
    setEditName(user?.displayName || '');
    setEditEmail(user?.email || '');
    setEditPhotoUri(user?.photoURL || null);
    setShowEditModal(true);
  };

  const handleImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '사진 촬영', '앨범에서 선택'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openCamera();
          } else if (buttonIndex === 2) {
            openGallery();
          }
        }
      );
    } else {
      Alert.alert(
        '프로필 사진',
        '사진을 선택하세요',
        [
          { text: '취소', style: 'cancel' },
          { text: '사진 촬영', onPress: openCamera },
          { text: '앨범에서 선택', onPress: openGallery },
        ]
      );
    }
  };

  const openCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8,
    });

    if (result.assets && result.assets[0]?.uri) {
      setEditPhotoUri(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8,
    });

    if (result.assets && result.assets[0]?.uri) {
      setEditPhotoUri(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('오류', '이름을 입력해주세요');
      return;
    }

    if (!editEmail.trim() || !editEmail.includes('@')) {
      Alert.alert('오류', '올바른 이메일을 입력해주세요');
      return;
    }

    setIsSaving(true);
    try {
      // updateProfile이 존재하면 호출, 없으면 로컬 상태만 업데이트
      if (updateProfile) {
        await updateProfile({
          displayName: editName.trim(),
          email: editEmail.trim(),
          photoURL: editPhotoUri || undefined,
        });
      }
      setShowEditModal(false);
      Alert.alert('완료', '프로필이 수정되었습니다');
    } catch (error) {
      Alert.alert('오류', '프로필 수정에 실패했습니다');
      console.error('Profile update failed:', error);
    } finally {
      setIsSaving(false);
    }
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
        <Text style={styles.headerTitle}>내 프로필</Text>
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Icon name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarLarge} onPress={openEditModal}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <Icon name="person" size={48} color={Colors.textSecondary} />
            )}
            <View style={styles.avatarEditBadge}>
              <Icon name="camera" size={14} color={Colors.surface} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.displayName || '사용자'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>
              {user?.role === 'admin'
                ? '최고관리자'
                : user?.role === 'hr'
                ? 'HR 담당자'
                : user?.role === 'manager'
                ? '매니저'
                : '직원'}
            </Text>
          </View>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'info' && styles.tabButtonActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'info' && styles.tabButtonTextActive,
              ]}
            >
              내 정보
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'history' && styles.tabButtonTextActive,
              ]}
            >
              출근 기록
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'info' ? (
          <View style={styles.infoSection}>
            {/* Current Status */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>현재 상태</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        status === 'working' ? Colors.success : Colors.textMuted,
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {status === 'working' ? '근무 중' : '퇴근'}
                </Text>
                {status === 'working' && startTime && (
                  <Text style={styles.statusTime}>
                    {startTime.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    ~
                  </Text>
                )}
              </View>
            </View>

            {/* User Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoCardTitle}>기본 정보</Text>
                <TouchableOpacity onPress={openEditModal}>
                  <Text style={styles.editLinkText}>수정</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>이름</Text>
                <Text style={styles.infoValue}>
                  {user?.displayName || '-'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>이메일</Text>
                <Text style={styles.infoValue}>{user?.email || '-'}</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowDisabled]}>
                <Text style={styles.infoLabel}>부서</Text>
                <Text style={styles.infoValueDisabled}>
                  {user?.department || '미지정'}
                </Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowDisabled, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>권한</Text>
                <Text style={styles.infoValueDisabled}>
                  {user?.role === 'admin'
                    ? '최고관리자'
                    : user?.role === 'hr'
                    ? 'HR 담당자'
                    : user?.role === 'manager'
                    ? '매니저'
                    : '직원'}
                </Text>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historySection}>
            {/* Today's Record */}
            {status === 'working' && startTime && (
              <View style={styles.todayCard}>
                <View style={styles.todayHeader}>
                  <Text style={styles.todayTitle}>오늘</Text>
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>근무 중</Text>
                  </View>
                </View>
                <View style={styles.todayContent}>
                  <View style={styles.todayTimeRow}>
                    <View style={styles.todayTimeItem}>
                      <Text style={styles.todayTimeLabel}>출근</Text>
                      <Text style={styles.todayTimeValue}>
                        {startTime.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.todayTimeItem}>
                      <Text style={styles.todayTimeLabel}>퇴근</Text>
                      <Text style={styles.todayTimeValue}>-</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* History List */}
            <Text style={styles.historyTitle}>최근 기록</Text>
            {mockAttendanceHistory.map((record) => {
              const statusInfo = getStatusText(record.status);
              return (
                <View key={record.id} style={styles.historyCard}>
                  <View style={styles.historyDate}>
                    <Text style={styles.historyDateText}>
                      {formatDate(record.date)}
                    </Text>
                    <View
                      style={[
                        styles.historyStatus,
                        { backgroundColor: statusInfo.color + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyStatusText,
                          { color: statusInfo.color },
                        ]}
                      >
                        {statusInfo.text}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyTimes}>
                    <View style={styles.historyTimeItem}>
                      <Icon
                        name="log-in-outline"
                        size={16}
                        color={Colors.primary}
                      />
                      <Text style={styles.historyTimeText}>{record.checkIn}</Text>
                    </View>
                    <View style={styles.historyTimeItem}>
                      <Icon
                        name="log-out-outline"
                        size={16}
                        color={Colors.secondary}
                      />
                      <Text style={styles.historyTimeText}>
                        {record.checkOut}
                      </Text>
                    </View>
                    <Text style={styles.historyWorkHours}>{record.workHours}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>프로필 수정</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving}>
              <Text style={[styles.modalSaveText, isSaving && styles.modalSaveTextDisabled]}>
                {isSaving ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Profile Image Edit */}
            <View style={styles.modalAvatarSection}>
              <TouchableOpacity style={styles.modalAvatar} onPress={handleImagePicker}>
                {editPhotoUri ? (
                  <Image source={{ uri: editPhotoUri }} style={styles.modalAvatarImage} />
                ) : (
                  <Icon name="person" size={48} color={Colors.textSecondary} />
                )}
                <View style={styles.modalAvatarEditBadge}>
                  <Icon name="camera" size={16} color={Colors.surface} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleImagePicker}>
                <Text style={styles.changePhotoText}>사진 변경</Text>
              </TouchableOpacity>
            </View>

            {/* Edit Form */}
            <View style={styles.formSection}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>이름</Text>
                <TextInput
                  style={styles.formInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="이름을 입력하세요"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>이메일</Text>
                <TextInput
                  style={styles.formInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="이메일을 입력하세요"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Read-only fields */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>부서</Text>
                <View style={styles.formInputDisabled}>
                  <Text style={styles.formInputDisabledText}>
                    {user?.department || '미지정'}
                  </Text>
                  <Icon name="lock-closed" size={16} color={Colors.textMuted} />
                </View>
                <Text style={styles.formHint}>부서는 관리자만 변경할 수 있습니다</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>권한</Text>
                <View style={styles.formInputDisabled}>
                  <Text style={styles.formInputDisabledText}>
                    {user?.role === 'admin'
                      ? '최고관리자'
                      : user?.role === 'hr'
                      ? 'HR 담당자'
                      : user?.role === 'manager'
                      ? '매니저'
                      : '직원'}
                  </Text>
                  <Icon name="lock-closed" size={16} color={Colors.textMuted} />
                </View>
                <Text style={styles.formHint}>권한은 관리자만 변경할 수 있습니다</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
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
  editButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.surface,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  userName: {
    ...Typography.heading2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  userBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  userBadgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.primary,
  },
  infoSection: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoCardTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  editLinkText: {
    ...Typography.body,
    color: Colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    ...Typography.body,
    color: Colors.text,
  },
  statusTime: {
    ...Typography.body,
    color: Colors.primary,
    marginLeft: 'auto',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoRowDisabled: {
    opacity: 0.6,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
  },
  infoValueDisabled: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    marginTop: Spacing.md,
  },
  logoutButtonText: {
    ...Typography.bodyBold,
    color: Colors.danger,
  },
  historySection: {
    padding: Spacing.lg,
  },
  todayCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  todayTitle: {
    ...Typography.heading3,
    color: Colors.surface,
  },
  todayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  todayBadgeText: {
    ...Typography.small,
    color: Colors.surface,
    fontWeight: '600',
  },
  todayContent: {},
  todayTimeRow: {
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  todayTimeItem: {},
  todayTimeLabel: {
    ...Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  },
  todayTimeValue: {
    ...Typography.heading3,
    color: Colors.surface,
  },
  historyTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyDateText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  historyStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  historyStatusText: {
    ...Typography.small,
    fontWeight: '600',
  },
  historyTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  historyTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  historyTimeText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  historyWorkHours: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
  },
  modalSaveText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  modalSaveTextDisabled: {
    color: Colors.textMuted,
  },
  modalContent: {
    flex: 1,
  },
  modalAvatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.surface,
  },
  modalAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalAvatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  modalAvatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  changePhotoText: {
    ...Typography.body,
    color: Colors.primary,
  },
  formSection: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  formGroup: {},
  formLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.text,
  },
  formInputDisabled: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formInputDisabledText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  formHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});

export default ProfileScreen;
