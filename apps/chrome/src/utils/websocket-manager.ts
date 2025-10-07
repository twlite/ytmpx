import type { Metadata } from '../types/metadata';

export interface TrackEvent {
  event: 'pause' | 'resume' | 'track' | 'TURN_ON' | 'TURN_OFF';
  metadata: Metadata;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectInterval: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  private startKeepAlive() {
    // Send a ping every 30 seconds to keep the service worker alive
    this.keepAliveInterval = setInterval(() => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'KEEP_ALIVE' }).catch(() => {
          // Ignore errors
        });
      }
    }, 30000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }
  private lastTrackId: string | null = null;
  private lastIsPlaying: boolean | null = null;

  constructor() {
    // Delay initial connection attempt to avoid immediate console errors
    setTimeout(() => {
      this.connect();
    }, 2000);

    // Keep the service worker alive by sending periodic pings
    this.startKeepAlive();
  }

  private connect() {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.isConnecting = true;
    this.isReconnecting = false; // Clear reconnecting flag when starting connection attempt

    try {
      // Create WebSocket with error handling
      this.ws = new WebSocket('ws://localhost:8765');

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.isReconnecting = false; // Clear reconnecting flag on successful connection
        this.clearReconnectInterval();
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.notifyConnectionChange('connected');
        // Send current track info immediately on connection
        this.sendCurrentTrackInfo();
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        console.log('YTMPX: WebSocket closed:', event.code, event.reason);
        this.notifyConnectionChange('disconnected');
        // Only reconnect if it wasn't a clean close
        if (event.code !== 1000) {
          console.log('YTMPX: Scheduling reconnect due to unexpected close');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        console.log('YTMPX: WebSocket error:', error);
        this.notifyConnectionChange('disconnected');
        // Suppress the connection refused error since it's expected when no server is running
        if (error instanceof Event && error.type === 'error') {
          // This is expected when no server is running, so we don't log it
          return;
        }
        console.log('YTMPX: Scheduling reconnect due to error');
        this.scheduleReconnect();
      };

      this.ws.onmessage = () => {
        // Handle incoming messages if needed
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) {
      return;
    }

    // Use exponential backoff: start with 5s, then 10s, then 30s, max 60s
    const delay = Math.min(
      5000 * Math.pow(1.5, this.getReconnectAttempts()),
      60000
    );

    // reset back to 0 if delay is greater than 60 seconds
    if (delay >= 60000) {
      this.reconnectAttempts = 0;
    }

    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null;
      // Set reconnecting flag and emit status only when actually about to reconnect
      this.isReconnecting = true;
      this.notifyConnectionChange('reconnecting');
      this.connect();
    }, delay);
  }

  private getReconnectAttempts(): number {
    return this.reconnectAttempts++;
  }

  private clearReconnectInterval() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  private notifyConnectionChange(
    status: 'connected' | 'disconnected' | 'reconnecting'
  ) {
    // Notify background script about connection status change
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime
        .sendMessage({
          type: 'WEBSOCKET_STATUS_CHANGE',
          status,
        })
        .catch(() => {
          // Ignore errors if background script is not available
        });
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getConnectionState():
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'reconnecting' {
    if (this.isConnecting) {
      return 'connecting';
    }
    if (this.isConnected()) {
      return 'connected';
    }
    if (this.isReconnecting) {
      return 'reconnecting';
    }
    return 'disconnected';
  }

  public sendEvent(event: TrackEvent) {
    if (!this.isConnected()) {
      return;
    }

    try {
      const message = JSON.stringify(event);
      this.ws!.send(message);
    } catch {
      // Handle send error silently
    }
  }

  public checkForTrackChanges(metadata: Metadata, isPlaying: boolean) {
    const currentTrackId = this.getTrackId(metadata);

    // Check for track change
    if (currentTrackId && currentTrackId !== this.lastTrackId) {
      this.sendEvent({
        event: 'track',
        metadata,
      });
      this.lastTrackId = currentTrackId;
    }

    // Check for play/pause state change
    if (this.lastIsPlaying !== null && this.lastIsPlaying !== isPlaying) {
      const eventType = isPlaying ? 'resume' : 'pause';
      this.sendEvent({
        event: eventType,
        metadata,
      });
    }

    this.lastIsPlaying = isPlaying;
  }

  private getTrackId(metadata: Metadata): string | null {
    // Try to extract track ID from URL or use title+artist as fallback
    if (metadata.url) {
      const urlMatch = metadata.url.match(/[?&]v=([^&]+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
    }

    // Fallback to title+artist combination
    if (metadata.title && metadata.author) {
      return `${metadata.title}-${metadata.author}`.replace(
        /[^a-zA-Z0-9]/g,
        '-'
      );
    }

    return null;
  }

  private sendCurrentTrackInfo() {
    // Request current track info from content script with retry mechanism
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: 'GET_CURRENT_TRACK' },
            (response) => {
              if (response && response.trackInfo) {
                // Send track info to server
                this.sendEvent({
                  event: 'track',
                  metadata: response.trackInfo.metadata,
                });

                // Send play/pause state
                const eventType = response.trackInfo.isPlaying
                  ? 'resume'
                  : 'pause';
                this.sendEvent({
                  event: eventType,
                  metadata: response.trackInfo.metadata,
                });
              }
            }
          );
        }
      });
    }
  }

  public destroy() {
    this.clearReconnectInterval();
    this.stopKeepAlive();
    this.isReconnecting = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
