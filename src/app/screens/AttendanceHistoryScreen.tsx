/**
 * WORKB Mobile - Attendance History Screen
 * 이번 달 출퇴근 기록 리스트 뷰
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { RootStackParamList, AttendanceRecord } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceHistory'>;

// DEV 모드 목 데이터
const generateMockData = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 이번 달 1일부터 오늘까지
  for (let day = 1; day <= today.getDate(); day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();

    // 주말 제외
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // 랜덤하게 다양한 상태 생성
    const isLate = Math.random() < 0.1;
    const isEarlyLeave = Math.random() < 0.05;
    const checkInHour = isLate ? 9 + Math.floor(Math.random() * 2) : 8 + Math.floor(Math.random() * 2);
    const checkInMinute = Math.floor(Math.random() * 60);
    const checkOutHour = isEarlyLeave ? 16 + Math.floor(Math.random() * 2) : 18 + Math.floor(Math.random() * 2);
    const checkOutMinute = Math.floor(Math.random() * 60);

    const checkIn = new Date(currentYear, currentMonth, day, checkInHour, checkInMinute);
    const checkOut = day < today.getDate()
      ? new Date(currentYear, currentMonth, day, checkOutHour, checkOutMinute)
      : undefined;

    const workMinutes = checkOut
      ? Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000)
      : undefined;

    let status: AttendanceRecord['status'] = 'normal';
    if (isLate) status = 'late';
    else if (isEarlyLeave) status = 'early_leave';
    else if (workMinutes && workMinutes < 480) status = 'short_work';

    records.push({
      id: `att-${day}`,
      userId: 'user1',
      date: date.toISOString().split('T')[0],
      checkInTime: checkIn,
      checkOutTime: checkOut,
      workMinutes,
      workLocation: Math.random() > 0.3 ? 'office' : 'remote',
      status,
    });
  }

  return records.reverse(); // 최신순
};

const AttendanceHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [records] = useState<AttendanceRecord[]>(generateMockData());

  // 현재 월 표시
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: API 호출
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTime = (date?: Date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatWorkHours = (minutes?: number) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' });
    return { day, weekday };
  };

  const getStatusInfo = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'late':
        return { label: '지각', color: Colors.warning };
      case 'early_leave':
        return { label: '조퇴', color: Colors.warning };
      case 'short_work':
        return { label: '근무부족', color: Colors.error };
      case 'absent':
        return { label: '결근', color: Colors.error };
      default:
        return { label: '정상', color: Colors.success };
    }
  };

  const getLocationIcon = (location: AttendanceRecord['workLocation']) => {
    switch (location) {
      case 'office':
        return 'business-outline';
      case 'remote':
        return 'home-outline';
      case 'field':
        return 'car-outline';
      default:
        return 'location-outline';
    }
  };

  // 요약 통계
  const totalDays = records.length;
  const lateDays = records.filter((r) => r.status === 'late').length;
  const totalWorkMinutes = records.reduce((sum, r) => sum + (r.workMinutes || 0), 0);
  const avgWorkHours = totalDays > 0 ? Math.round(totalWorkMinutes / totalDays / 60 * 10) / 10 : 0;

  const renderRecord = (record: AttendanceRecord) => {
    const { day, weekday } = formatDate(record.date);
    const statusInfo = getStatusInfo(record.status);
    const isToday = record.date === new Date().toISOString().split('T')[0];

    return (
      <View
        key={record.id}
        style={[styles.recordCard, isToday && styles.recordCardToday]}
      >
        {/* 날짜 */}
        <View style={styles.dateSection}>
          <Text style={[styles.dateDay, isToday && styles.dateDayToday]}>{day}</Text>
          <Text style={[styles.dateWeekday, isToday && styles.dateWeekdayToday]}>
            {weekday}
          </Text>
        </View>

        {/* 출퇴근 시간 */}
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <Icon name="log-in-outline" size={14} color={Colors.success} />
            <Text style={styles.timeText}>{formatTime(record.checkInTime)}</Text>
          </View>
          <View style={styles.timeRow}>
            <Icon name="log-out-outline" size={14} color={Colors.error} />
            <Text style={styles.timeText}>{formatTime(record.checkOutTime)}</Text>
          </View>
        </View>

        {/* 근무시간 */}
        <View style={styles.workSection}>
          <Text style={styles.workHours}>{formatWorkHours(record.workMinutes)}</Text>
          <View style={styles.locationRow}>
            <Icon
              name={getLocationIcon(record.workLocation)}
              size={12}
              color={Colors.textMuted}
            />
          </View>
        </View>

        {/* 상태 */}
        <View
          style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}
        >
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>근무 기록</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 월 표시 */}
        <View style={styles.monthSection}>
          <Text style={styles.monthText}>{monthYear}</Text>
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalDays}일</Text>
            <Text style={styles.summaryLabel}>출근일</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{avgWorkHours}h</Text>
            <Text style={styles.summaryLabel}>일평균</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, lateDays > 0 && { color: Colors.warning }]}>
              {lateDays}회
            </Text>
            <Text style={styles.summaryLabel}>지각</Text>
          </View>
        </View>

        {/* 기록 리스트 */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>출퇴근 기록</Text>
          {records.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>이번 달 출퇴근 기록이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {records.map(renderRecord)}
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
  monthSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  monthText: {
    ...Typography.heading3,
    color: Colors.text,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...Typography.heading2,
    color: Colors.text,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
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
  recordsList: {
    gap: Spacing.sm,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordCardToday: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dateSection: {
    width: 44,
    alignItems: 'center',
  },
  dateDay: {
    ...Typography.heading3,
    color: Colors.text,
  },
  dateDayToday: {
    color: Colors.primary,
  },
  dateWeekday: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  dateWeekdayToday: {
    color: Colors.primary,
  },
  timeSection: {
    flex: 1,
    marginLeft: Spacing.md,
    gap: Spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeText: {
    ...Typography.caption,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  workSection: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  workHours: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  locationRow: {
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  statusText: {
    ...Typography.small,
    fontWeight: '600',
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

export default AttendanceHistoryScreen;
