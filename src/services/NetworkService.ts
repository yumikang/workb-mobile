/**
 * WORKB Mobile - Network Service
 * Network status monitoring
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

type NetworkStatus = 'wifi' | 'cellular' | 'none' | 'unknown';
type NetworkChangeCallback = (status: NetworkStatus, isConnected: boolean) => void;

class NetworkService {
  private subscription: NetInfoSubscription | null = null;
  private currentStatus: NetworkStatus = 'unknown';
  private isConnected: boolean = false;
  private listeners: NetworkChangeCallback[] = [];

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    // Get initial state
    const state = await NetInfo.fetch();
    this.updateStatus(state);

    // Subscribe to network changes
    this.subscription = NetInfo.addEventListener((state) => {
      this.updateStatus(state);
    });

    console.log('[Network] Initialized:', this.currentStatus, 'connected:', this.isConnected);
  }

  /**
   * Update internal status and notify listeners
   */
  private updateStatus(state: NetInfoState): void {
    const prevConnected = this.isConnected;
    const prevStatus = this.currentStatus;

    this.isConnected = state.isConnected ?? false;

    if (state.type === 'wifi') {
      this.currentStatus = 'wifi';
    } else if (state.type === 'cellular') {
      this.currentStatus = 'cellular';
    } else if (state.type === 'none') {
      this.currentStatus = 'none';
    } else {
      this.currentStatus = 'unknown';
    }

    // Notify listeners only if status changed
    if (prevConnected !== this.isConnected || prevStatus !== this.currentStatus) {
      console.log('[Network] Status changed:', this.currentStatus, 'connected:', this.isConnected);
      this.notifyListeners();
    }
  }

  /**
   * Notify all registered listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentStatus, this.isConnected);
      } catch (error) {
        console.warn('[Network] Listener error:', error);
      }
    });
  }

  /**
   * Add network change listener
   */
  addListener(callback: NetworkChangeCallback): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * Check if connected to internet
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Check current connection (one-time)
   */
  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Cleanup subscription
   */
  cleanup(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners = [];
    console.log('[Network] Cleanup complete');
  }
}

// Export singleton instance
export const networkService = new NetworkService();
export default networkService;
