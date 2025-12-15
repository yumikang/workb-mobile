/**
 * WORKB Mobile - Type Definitions
 */

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainTabs: undefined;
  LeaveRequest: undefined;
  NoticeDetail: { noticeId: string };
  Settings: undefined;
  Profile: undefined;
  AttendanceHistory: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Leave: undefined;
  Notices: undefined;
  Settings: undefined;
};

// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  photoURL?: string;
  workspaceId?: string;
  teamId?: string;
  department?: string;
}

// Attendance Types
export type AttendanceStatus = 'working' | 'out' | 'loading';
export type WorkLocation = 'office' | 'remote' | 'field';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  workMinutes?: number;
  workLocation: WorkLocation;
  status: 'normal' | 'late' | 'early_leave' | 'short_work' | 'absent';
}

// Leave Types
export type LeaveType = 'annual' | 'sick' | 'half_am' | 'half_pm' | 'personal';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string;
  status: LeaveStatus;
  createdAt: Date;
}

export interface LeaveBalance {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
}

// Notice Types
export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  isPinned: boolean;
  isNew: boolean;
  createdAt: Date;
  workspaceId: string;
}

// Socket Event Types
export interface SocketEvents {
  // Attendance Events
  'attendance:checkin': { userId: string; time: Date; workspaceId: string };
  'attendance:checkout': { userId: string; time: Date; workspaceId: string };
  'attendance:status_changed': { userId: string; status: AttendanceStatus };

  // Leave Events
  'leave:requested': { request: LeaveRequest };
  'leave:approved': { requestId: string; approverId: string };
  'leave:rejected': { requestId: string; reason: string };

  // Notice Events
  'notice:created': { notice: Notice };
  'notice:updated': { notice: Notice };

  // Presence Check Events
  'presence:check_required': { checkId: string; deadline: Date };
  'presence:check_response': { checkId: string; userId: string; responded: boolean };
}

// FCM Message Types
export interface FCMNotificationData {
  type: 'attendance' | 'leave' | 'notice' | 'presence_check' | 'general';
  screen?: string;
  entityId?: string;
  workspaceId?: string;
  [key: string]: string | undefined;
}

// Notice Category Type
export type NoticeCategory = 'general' | 'urgent' | 'hr' | 'event' | 'policy';
