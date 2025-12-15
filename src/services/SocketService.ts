/**
 * WORKB Mobile - Socket.io Service
 * Real-time communication with backend server
 *
 * Integrates with existing codeb_project server.js Socket.io infrastructure
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL, STORAGE_KEYS } from '@/constants';
import { SocketEvents } from '@/types';

type EventCallback<T> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private currentWorkspaceId: string | null = null;

  /**
   * Initialize socket connection
   */
  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return true;
    }

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      this.socket = io(SOCKET_URL, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventListeners();

      return new Promise((resolve) => {
        this.socket!.on('connect', () => {
          console.log('[Socket] Connected:', this.socket?.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('[Socket] Connection error:', error.message);
          resolve(false);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            console.warn('[Socket] Connection timeout');
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('[Socket] Failed to connect:', error);
      return false;
    }
  }

  /**
   * Setup core event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;

      // Rejoin workspace room after reconnection
      if (this.currentWorkspaceId) {
        this.joinWorkspace(this.currentWorkspaceId);
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnection error:', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentWorkspaceId = null;
      console.log('[Socket] Disconnected manually');
    }
  }

  /**
   * Join workspace room for real-time updates
   */
  joinWorkspace(workspaceId: string): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot join workspace - not connected');
      return;
    }

    // Leave previous workspace if any
    if (this.currentWorkspaceId && this.currentWorkspaceId !== workspaceId) {
      this.leaveWorkspace(this.currentWorkspaceId);
    }

    this.socket.emit('join-workspace', workspaceId);
    this.currentWorkspaceId = workspaceId;
    console.log('[Socket] Joined workspace:', workspaceId);
  }

  /**
   * Leave workspace room
   */
  leaveWorkspace(workspaceId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('leave-workspace', workspaceId);
    console.log('[Socket] Left workspace:', workspaceId);
  }

  /**
   * Emit attendance check-in event
   */
  emitCheckIn(data: { userId: string; workspaceId: string; time: Date }): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot emit - not connected');
      return;
    }
    this.socket.emit('attendance:checkin', data);
  }

  /**
   * Emit attendance check-out event
   */
  emitCheckOut(data: { userId: string; workspaceId: string; time: Date }): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot emit - not connected');
      return;
    }
    this.socket.emit('attendance:checkout', data);
  }

  /**
   * Emit presence check response
   */
  emitPresenceResponse(data: { checkId: string; userId: string; responded: boolean }): void {
    if (!this.socket?.connected) return;
    this.socket.emit('presence:check_response', data);
  }

  /**
   * Subscribe to event
   */
  on<K extends keyof SocketEvents>(event: K, callback: EventCallback<SocketEvents[K]>): void {
    if (!this.socket) {
      console.warn('[Socket] Cannot subscribe - socket not initialized');
      return;
    }
    this.socket.on(event, callback as any);
  }

  /**
   * Unsubscribe from event
   */
  off<K extends keyof SocketEvents>(event: K, callback?: EventCallback<SocketEvents[K]>): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback as any);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Check connection status
   */
  get connected(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  /**
   * Get socket ID
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
