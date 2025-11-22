import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from '../config/api';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Connect to Socket.IO server
   */
  connect(userId?: string): void {
    try {
      if (this.socket?.connected) {
        console.log("⚡ Socket already connected");
        return;
      }

      console.log("⚡ Connecting to Socket.IO server...");

      this.socket = io(SOCKET_URL, {
        transports: ["polling", "websocket"], // Try polling first, then upgrade to websocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000, // 10 second timeout
        forceNew: true,
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket?.id);

        // Join user's personal room if userId provided
        if (userId && this.socket) {
          this.socket.emit("join", userId);
          console.log(`👤 Joined room for user: ${userId}`);
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
      });

      this.socket.on("connect_error", (error) => {
        console.warn("⚠️  Socket connection error (app will work without real-time updates):", error.message);
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
      });

      this.socket.on("reconnect_failed", () => {
        console.warn("⚠️  Socket reconnection failed (app will work without real-time updates)");
      });

      // Re-attach all listeners
      this.reattachListeners();
    } catch (error) {
      console.warn("⚠️  Failed to initialize socket (app will work without real-time updates):", error);
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      console.log("⚡ Disconnecting socket...");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    // Store listener for re-attachment on reconnect
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    // Attach to socket if connected
    if (this.socket) {
      this.socket.on(event, (...args: any[]) => callback(...args));
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: Function): void {
    if (callback) {
      // Remove specific callback
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      // Remove all callbacks for event
      this.listeners.delete(event);
    }

    // Remove from socket
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback as any);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("⚠️  Socket not connected, cannot emit event:", event);
    }
  }

  /**
   * Re-attach all stored listeners (used after reconnection)
   */
  private reattachListeners(): void {
    if (!this.socket) return;

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, (...args: any[]) => callback(...args));
      });
    });
  }

  /**
   * Join a specific room
   */
  joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("join", roomId);
      console.log(`👤 Joined room: ${roomId}`);
    }
  }

  /**
   * Leave a specific room
   */
  leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("leave", roomId);
      console.log(`👋 Left room: ${roomId}`);
    }
  }
}

// Export singleton instance
export default new SocketService();

