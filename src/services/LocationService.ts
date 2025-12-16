/**
 * WORKB Mobile - Location Service
 * GPS location monitoring and office proximity check
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';

// Office location configuration (하드코딩 - 추후 서버에서 받아올 수 있음)
const OFFICE_CONFIG = {
  // 사무실 좌표 (예시: 서울 강남역 근처)
  latitude: 37.4979,
  longitude: 127.0276,
  // 사무실 반경 (미터)
  radiusMeters: 100,
  // 회사 Wi-Fi SSID (예시)
  wifiSSID: 'WORKB_Office',
};

export type LocationStatus = 'office' | 'remote' | 'unknown' | 'denied';
export type WifiStatus = 'connected' | 'disconnected' | 'unknown';

// Geolocation types
interface GeoPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface GeoError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

interface LocationState {
  locationStatus: LocationStatus;
  wifiStatus: WifiStatus;
  isAtOffice: boolean;
  isWifiConnected: boolean;
  lastUpdated: Date | null;
}

type LocationChangeCallback = (state: LocationState) => void;

class LocationService {
  private currentState: LocationState = {
    locationStatus: 'unknown',
    wifiStatus: 'unknown',
    isAtOffice: false,
    isWifiConnected: false,
    lastUpdated: null,
  };
  private listeners: LocationChangeCallback[] = [];
  private watchId: number | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize location service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Request location permission
      const hasPermission = await this.requestLocationPermission();

      if (!hasPermission) {
        this.updateState({ locationStatus: 'denied' });
        return false;
      }

      // Configure geolocation
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
        enableBackgroundLocationUpdates: false,
      });

      // Get initial location
      await this.getCurrentLocation();

      // Check Wi-Fi status
      await this.checkWifiStatus();

      this.isInitialized = true;
      console.log('[Location] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Location] Initialization error:', error);
      return false;
    }
  }

  /**
   * Request location permission (Android only, iOS handled by system)
   */
  private async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // iOS permission is requested automatically when using geolocation
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '위치 권한 요청',
          message: '출퇴근 확인을 위해 사무실 위치 확인이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('[Location] Permission granted');
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        // User selected "Don't ask again"
        this.showSettingsAlert();
        return false;
      } else {
        console.log('[Location] Permission denied');
        return false;
      }
    } catch (error) {
      console.error('[Location] Permission error:', error);
      return false;
    }
  }

  /**
   * Show alert to guide user to settings
   */
  private showSettingsAlert(): void {
    Alert.alert(
      '위치 권한 필요',
      '출퇴근 확인을 위해 설정에서 위치 권한을 허용해주세요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '설정으로 이동', onPress: () => Linking.openSettings() },
      ]
    );
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<GeoPosition | null> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          this.handleLocationUpdate(position);
          resolve(position);
        },
        (error) => {
          this.handleLocationError(error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Start watching location changes
   */
  startWatching(): void {
    if (this.watchId !== null) {
      return;
    }

    this.watchId = Geolocation.watchPosition(
      (position) => this.handleLocationUpdate(position),
      (error) => this.handleLocationError(error),
      {
        enableHighAccuracy: true,
        distanceFilter: 50, // Update every 50 meters
        interval: 30000, // Android: check every 30 seconds
        fastestInterval: 15000,
      }
    );

    console.log('[Location] Started watching');
  }

  /**
   * Stop watching location changes
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('[Location] Stopped watching');
    }
  }

  /**
   * Handle location update
   */
  private handleLocationUpdate(position: GeoPosition): void {
    const { latitude, longitude } = position.coords;
    const distance = this.calculateDistance(
      latitude,
      longitude,
      OFFICE_CONFIG.latitude,
      OFFICE_CONFIG.longitude
    );

    const isAtOffice = distance <= OFFICE_CONFIG.radiusMeters;
    const locationStatus: LocationStatus = isAtOffice ? 'office' : 'remote';

    console.log(`[Location] Updated: ${latitude}, ${longitude}, Distance: ${distance}m, At office: ${isAtOffice}`);

    this.updateState({
      locationStatus,
      isAtOffice,
      lastUpdated: new Date(),
    });
  }

  /**
   * Handle location error
   */
  private handleLocationError(error: GeoError): void {
    console.warn('[Location] Error:', error.code, error.message);

    if (error.code === 1) {
      // Permission denied
      this.updateState({ locationStatus: 'denied' });
    } else {
      this.updateState({ locationStatus: 'unknown' });
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check Wi-Fi connection status
   */
  async checkWifiStatus(): Promise<void> {
    try {
      const state = await NetInfo.fetch();

      if (state.type === 'wifi' && state.isConnected) {
        // Wi-Fi 연결됨
        // Note: SSID는 Android에서만 사용 가능하고, iOS는 특별한 권한 필요
        // 여기서는 단순히 Wi-Fi 연결 여부만 확인
        this.updateState({
          wifiStatus: 'connected',
          isWifiConnected: true,
        });
        console.log('[Location] Wi-Fi connected');
      } else {
        this.updateState({
          wifiStatus: 'disconnected',
          isWifiConnected: false,
        });
        console.log('[Location] Wi-Fi disconnected');
      }
    } catch (error) {
      console.error('[Location] Wi-Fi check error:', error);
      this.updateState({ wifiStatus: 'unknown' });
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(partial: Partial<LocationState>): void {
    const prevState = { ...this.currentState };
    this.currentState = { ...this.currentState, ...partial };

    // Check if state actually changed
    const hasChanged =
      prevState.locationStatus !== this.currentState.locationStatus ||
      prevState.wifiStatus !== this.currentState.wifiStatus ||
      prevState.isAtOffice !== this.currentState.isAtOffice ||
      prevState.isWifiConnected !== this.currentState.isWifiConnected;

    if (hasChanged) {
      this.notifyListeners();
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.warn('[Location] Listener error:', error);
      }
    });
  }

  /**
   * Add state change listener
   */
  addListener(callback: LocationChangeCallback): () => void {
    this.listeners.push(callback);

    // Immediately call with current state
    callback(this.currentState);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current state
   */
  getState(): LocationState {
    return { ...this.currentState };
  }

  /**
   * Refresh location and Wi-Fi status
   */
  async refresh(): Promise<void> {
    await Promise.all([
      this.getCurrentLocation(),
      this.checkWifiStatus(),
    ]);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopWatching();
    this.listeners = [];
    this.isInitialized = false;
    console.log('[Location] Cleanup complete');
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
