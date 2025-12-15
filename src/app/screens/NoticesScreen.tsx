/**
 * WORKB Mobile - Notices Screen
 * Company announcements and notifications
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useNoticesStore } from '../../stores';
import { Notice } from '../../types';

const NoticesScreen: React.FC = () => {
  const {
    notices,
    unreadCount,
    isLoading,
    fetchNotices,
    markAsRead,
    markAllAsRead,
    setupRealtimeListeners,
    cleanupListeners,
  } = useNoticesStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotices();
    setupRealtimeListeners();

    return () => {
      cleanupListeners();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotices();
    setRefreshing(false);
  }, []);

  const handleNoticePress = async (notice: Notice) => {
    if (!notice.isRead) {
      await markAsRead(notice.id);
    }
    // TODO: Navigate to notice detail
  };

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
      style={[styles.noticeCard, !notice.isRead && styles.unreadCard]}
      onPress={() => handleNoticePress(notice)}
      activeOpacity={0.7}
    >
      <View style={styles.noticeHeader}>
        <View style={styles.noticeMeta}>
          {notice.isPinned && (
            <Icon name="pin" size={14} color={Colors.primary} style={styles.pinIcon} />
          )}
          {!notice.isRead && <View style={styles.unreadDot} />}
          <Text style={styles.noticeAuthor}>{notice.author}</Text>
          <Text style={styles.noticeSeparator}>·</Text>
          <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
        </View>
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
          <Text style={styles.headerTitle}>공지사항</Text>
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
              읽지 않은 공지 {unreadCount}개
            </Text>
          </View>
        )}

        {/* Notices List */}
        <View style={styles.noticesSection}>
          {notices.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                name="megaphone-outline"
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>공지사항이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.noticesList}>
              {notices.map(renderNoticeItem)}
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
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  noticeHeader: {
    marginBottom: Spacing.sm,
  },
  noticeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: Spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
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
});

export default NoticesScreen;
