/**
 * WORKB Mobile - Analytics Service
 * Firebase Analytics for usage tracking
 */

// Lazy load analytics to handle cases where Firebase isn't configured
let analyticsModule: any = null;

const getAnalytics = async () => {
  if (analyticsModule) return analyticsModule;

  try {
    analyticsModule = await import('@react-native-firebase/analytics');
    return analyticsModule;
  } catch (error) {
    console.warn('[Analytics] Firebase Analytics not available');
    return null;
  }
};

export const AnalyticsService = {
  /**
   * Log screen view
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      await firebase.default().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.warn('[Analytics] Screen view error:', error);
    }
  },

  /**
   * Log attendance check-in
   */
  async logCheckIn(workLocation: string): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      await firebase.default().logEvent('attendance_checkin', {
        work_location: workLocation,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('[Analytics] Check-in log error:', error);
    }
  },

  /**
   * Log attendance check-out
   */
  async logCheckOut(workMinutes: number): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      await firebase.default().logEvent('attendance_checkout', {
        work_minutes: workMinutes,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('[Analytics] Check-out log error:', error);
    }
  },

  /**
   * Log leave request
   */
  async logLeaveRequest(leaveType: string, days: number): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      await firebase.default().logEvent('leave_request', {
        leave_type: leaveType,
        days: days,
      });
    } catch (error) {
      console.warn('[Analytics] Leave request log error:', error);
    }
  },

  /**
   * Log notice view
   */
  async logNoticeView(noticeId: string, title: string): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      await firebase.default().logEvent('notice_view', {
        notice_id: noticeId,
        notice_title: title,
      });
    } catch (error) {
      console.warn('[Analytics] Notice view log error:', error);
    }
  },

  /**
   * Set user properties
   */
  async setUserProperties(properties: {
    userId?: string;
    workspaceId?: string;
    role?: string;
    department?: string;
  }): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      const analytics = firebase.default();

      if (properties.userId) {
        await analytics.setUserId(properties.userId);
      }
      if (properties.workspaceId) {
        await analytics.setUserProperty('workspace_id', properties.workspaceId);
      }
      if (properties.role) {
        await analytics.setUserProperty('user_role', properties.role);
      }
      if (properties.department) {
        await analytics.setUserProperty('department', properties.department);
      }
    } catch (error) {
      console.warn('[Analytics] Set user properties error:', error);
    }
  },

  /**
   * Log app open
   */
  async logAppOpen(): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      await firebase.default().logAppOpen();
    } catch (error) {
      console.warn('[Analytics] App open log error:', error);
    }
  },

  /**
   * Log custom event
   */
  async logEvent(eventName: string, params?: Record<string, any>): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      await firebase.default().logEvent(eventName, params);
    } catch (error) {
      console.warn(`[Analytics] Event ${eventName} log error:`, error);
    }
  },

  /**
   * Clear user data on logout
   */
  async clearUserData(): Promise<void> {
    try {
      const firebase = await getAnalytics();
      if (!firebase) return;

      await firebase.default().setUserId(null);
    } catch (error) {
      console.warn('[Analytics] Clear user data error:', error);
    }
  },
};

export default AnalyticsService;
