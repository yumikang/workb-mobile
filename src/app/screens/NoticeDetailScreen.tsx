/**
 * WORKB Mobile - Notice Detail Screen
 * 공지사항 상세 페이지 + 댓글 기능
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../stores';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NoticeDetail'>;
type RouteProps = RouteProp<RootStackParamList, 'NoticeDetail'>;

interface NoticeDetailParams {
  noticeId: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  isPinned: boolean;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

// DEV 모드 목 댓글 데이터
const mockComments: Comment[] = [
  {
    id: '1',
    authorId: 'user1',
    authorName: '이영희',
    content: '확인했습니다. 감사합니다!',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    authorId: 'user2',
    authorName: '박철수',
    content: '연차 사용 계획서 양식은 어디서 받을 수 있나요?',
    createdAt: new Date(Date.now() - 1800000),
  },
];

const NoticeDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { user } = useAuthStore();

  // 파라미터로 전달된 공지 정보
  const { noticeId, title, content, author, createdAt, isPinned } = route.params as NoticeDetailParams;

  // 댓글 상태
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCommentTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      authorId: user?.id || 'anonymous',
      authorName: user?.displayName || '익명',
      content: newComment.trim(),
      createdAt: new Date(),
    };

    setComments((prev) => [...prev, comment]);
    setNewComment('');
    // TODO: API 호출
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
        <Text style={styles.headerTitle}>공지사항</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.scrollView}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            {isPinned && (
              <View style={styles.pinnedBadge}>
                <Icon name="pin" size={14} color={Colors.primary} />
                <Text style={styles.pinnedText}>고정됨</Text>
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
            <View style={styles.meta}>
              <Text style={styles.author}>{author}</Text>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.date}>{formatDate(createdAt)}</Text>
              <Text style={styles.time}>{formatTime(createdAt)}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content Section */}
          <View style={styles.contentSection}>
            <Text style={styles.content}>{content}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Icon name="chatbubble-outline" size={18} color={Colors.text} />
              <Text style={styles.commentsTitle}>댓글</Text>
              <Text style={styles.commentsCount}>{comments.length}</Text>
            </View>

            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>첫 댓글을 남겨보세요</Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Icon name="person" size={16} color={Colors.textSecondary} />
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                        <Text style={styles.commentTime}>
                          {formatCommentTime(comment.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="댓글을 입력하세요"
              placeholderTextColor={Colors.textMuted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newComment.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim()}
            >
              <Icon
                name="send"
                size={20}
                color={newComment.trim() ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  pinnedText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    ...Typography.heading2,
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  author: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  separator: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  date: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  time: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  divider: {
    height: 8,
    backgroundColor: Colors.background,
  },
  contentSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    minHeight: 150,
  },
  content: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 26,
  },
  // Comments Section
  commentsSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  commentsTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  commentsCount: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  noComments: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  noCommentsText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  commentsList: {
    gap: Spacing.lg,
  },
  commentItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  commentAuthor: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  commentTime: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  commentText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
  // Comment Input
  commentInputContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  commentInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 0,
  },
  sendButton: {
    padding: Spacing.xs,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default NoticeDetailScreen;
