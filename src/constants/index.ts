/**
 * WORKB Mobile - Constants
 */

// API Configuration
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.workb.app/api';

// Socket.io Configuration
export const SOCKET_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.workb.app';

// Colors (matching tailwind.config.js)
export const Colors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  secondary: '#10B981',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  accent: '#8B5CF6',
  danger: '#DC2626',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  // Tab Bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#2563EB',
  tabBarInactive: '#9CA3AF',
  // Status colors
  statusWorking: '#2563EB',
  statusOut: '#10B981',
  statusLoading: '#9CA3AF',
};

// Typography
export const Typography = {
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// FCM Topics for WORKB
export const FCM_TOPICS = {
  ALL_USERS: 'workb_all_users',
  WORKSPACE: (id: string) => `workb_workspace_${id}`,
  TEAM: (id: string) => `workb_team_${id}`,
  ADMIN: 'workb_admin',
} as const;

// Async Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  WORKSPACE_ID: 'workspace_id',
  FCM_TOKEN: 'fcm_token',
  PUSH_ENABLED: 'push_enabled',
} as const;

export default Colors;
