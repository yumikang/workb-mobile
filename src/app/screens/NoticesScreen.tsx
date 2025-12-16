/**
 * WORKB Mobile - Board Screen (게시판)
 * Company board posts (어드민 Board 모델과 연동)
 * Admin: Can create/edit/pin posts
 * Staff: View only
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useNoticesStore, useAuthStore } from '../../stores';
import { Notice, RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// DEV 모드 목 데이터
const mockNotices: Notice[] = [
  {
    id: '1',
    title: '2025년 연차 사용 계획 안내',
    content: '2025년 연차 사용 계획서를 1월 15일까지 제출해 주시기 바랍니다. 연차 촉진제도에 따라 미사용 연차는 소멸될 수 있으니 꼭 확인 부탁드립니다.',
    author: '인사팀',
    authorId: 'admin1',
    isPinned: true,
    isNew: true,
    isRead: false,
    createdAt: new Date(),
    workspaceId: 'ws1',
  },
  {
    id: '2',
    title: '사내 보안 교육 필수 이수 안내',
    content: '정보보안 교육을 1월 31일까지 필수로 이수해 주시기 바랍니다. 미이수 시 시스템 접근이 제한될 수 있습니다.',
    author: '보안팀',
    authorId: 'admin2',
    isPinned: true,
    isNew: false,
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 2),
    workspaceId: 'ws1',
  },
  {
    id: '3',
    title: '신년회 일정 공지',
    content: '2025년 신년회가 1월 17일 금요일 저녁 6시에 진행됩니다. 장소는 추후 공지 예정입니다.',
    author: '총무팀',
    authorId: 'admin3',
    isPinned: false,
    isNew: false,
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 5),
    workspaceId: 'ws1',
  },
];

const NoticesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    notices: storeNotices,
    unreadCount,
    isLoading,
    fetchNotices,
    markAsRead,
    markAllAsRead,
    setupRealtimeListeners,
    cleanupListeners,
  } = useNoticesStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // 관리자 권한 확인 (admin, hr, manager는 게시판 관리 가능)
  const isAdmin = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  // DEV 모드에서 목 데이터 사용
  const [localNotices, setLocalNotices] = useState<Notice[]>(mockNotices);
  const notices = __DEV__ ? localNotices : storeNotices;

  // 공지 작성 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticePinned, setNewNoticePinned] = useState(false);

  useEffect(() => {
    if (!__DEV__) {
      fetchNotices();
      setupRealtimeListeners();
      return () => {
        cleanupListeners();
      };
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotices();
    setRefreshing(false);
  }, []);

  const handleNoticePress = async (notice: Notice) => {
    if (!notice.isRead) {
      if (__DEV__) {
        setLocalNotices((prev) =>
          prev.map((n) => (n.id === notice.id ? { ...n, isRead: true } : n))
        );
      } else {
        await markAsRead(notice.id);
      }
    }
    // 상세 페이지로 이동
    navigation.navigate('NoticeDetail', {
      noticeId: notice.id,
      title: notice.title,
      content: notice.content,
      author: notice.author,
      createdAt: notice.createdAt.toISOString(),
      isPinned: notice.isPinned,
    });
  };

  // 공지 고정/해제 토글 (관리자 전용)
  const handleTogglePin = (noticeId: string) => {
    if (!isAdmin) return;

    if (__DEV__) {
      setLocalNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId ? { ...n, isPinned: !n.isPinned } : n
        )
      );
    }
    // TODO: API 호출
  };

  // 새 공지 작성 (관리자 전용)
  const handleCreateNotice = () => {
    if (!isAdmin) return;
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      Alert.alert('알림', '제목과 내용을 입력해주세요.');
      return;
    }

    const newNotice: Notice = {
      id: Date.now().toString(),
      title: newNoticeTitle,
      content: newNoticeContent,
      author: user?.displayName || '관리자',
      authorId: user?.id || '',
      isPinned: newNoticePinned,
      isNew: true,
      isRead: true,
      createdAt: new Date(),
      workspaceId: user?.workspaceId || '',
    };

    if (__DEV__) {
      setLocalNotices((prev) => [newNotice, ...prev]);
    }
    // TODO: API 호출

    setShowCreateModal(false);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setNewNoticePinned(false);
  };

  // 정렬: 고정 공지 먼저, 그 다음 최신순
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}분 전`;
      }
      return `${hours}시간 전`;
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    }

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNoticeItem = (notice: Notice) => (
    <TouchableOpacity
      key={notice.id}
      style={styles.noticeCard}
      onPress={() => handleNoticePress(notice)}
      activeOpacity={0.7}
    >
      <View style={styles.noticeHeader}>
        <View style={styles.noticeMeta}>
          {isAdmin ? (
            <TouchableOpacity onPress={() => handleTogglePin(notice.id)}>
              <Icon
                name={notice.isPinned ? 'pin' : 'pin-outline'}
                size={14}
                color={notice.isPinned ? Colors.primary : Colors.textMuted}
                style={styles.pinIcon}
              />
            </TouchableOpacity>
          ) : (
            notice.isPinned && (
              <Icon name="pin" size={14} color={Colors.primary} style={styles.pinIcon} />
            )
          )}
          <Text style={styles.noticeAuthor}>{notice.author}</Text>
          <Text style={styles.noticeSeparator}>·</Text>
          <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
        </View>
        <Text style={[styles.readStatus, notice.isRead && styles.readStatusRead]}>
          {notice.isRead ? '읽음' : '안읽음'}
        </Text>
      </View>

      <Text style={styles.noticeTitle} numberOfLines={2}>
        {notice.title}
      </Text>

      <Text style={styles.noticePreview} numberOfLines={2}>
        {notice.content}
      </Text>
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>게시판</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.markAllText}>모두 읽음</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Unread Count */}
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <Icon name="mail-unread-outline" size={18} color={Colors.primary} />
            <Text style={styles.unreadText}>
              읽지 않은 글 {unreadCount}개
            </Text>
          </View>
        )}

        {/* Notices List */}
        <View style={styles.noticesSection}>
          {sortedNotices.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                name="megaphone-outline"
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>게시글이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.noticesList}>
              {sortedNotices.map(renderNoticeItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 관리자 전용: 글쓰기 FAB */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={28} color={Colors.surface} />
        </TouchableOpacity>
      )}

      {/* 글 작성 모달 */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>새 글 작성</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="제목"
              placeholderTextColor={Colors.textMuted}
              value={newNoticeTitle}
              onChangeText={setNewNoticeTitle}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="내용을 입력하세요"
              placeholderTextColor={Colors.textMuted}
              value={newNoticeContent}
              onChangeText={setNewNoticeContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.pinnedToggle}
              onPress={() => setNewNoticePinned(!newNoticePinned)}
            >
              <Icon
                name={newNoticePinned ? 'checkbox' : 'square-outline'}
                size={22}
                color={newNoticePinned ? Colors.primary : Colors.textMuted}
              />
              <Text style={styles.pinnedToggleText}>상단 고정</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateNotice}
            >
              <Text style={styles.submitButtonText}>등록하기</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  markAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  markAllText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  unreadText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '500',
  },
  noticesSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  noticesList: {
    gap: Spacing.md,
  },
  noticeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  noticeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pinIcon: {
    marginRight: Spacing.xs,
  },
  noticeAuthor: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  noticeSeparator: {
    ...Typography.small,
    color: Colors.textMuted,
    marginHorizontal: Spacing.xs,
  },
  noticeDate: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  noticeTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  readStatus: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '500',
  },
  readStatusRead: {
    color: Colors.textMuted,
  },
  noticePreview: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 20,
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
  // FAB 스타일
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
    maxHeight: '80%',
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
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTextArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  pinnedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  pinnedToggleText: {
    ...Typography.body,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    ...Typography.bodyBold,
    color: Colors.surface,
  },
});

export default NoticesScreen;
