import { useState, useEffect } from 'react';
import type { TrackInfo } from './types/metadata';
import { TrackCard } from './components/track-card';
import { Loading } from './components/loading-track';
import { Error } from './components/error-message';
import { EmptyState } from './components/empty-state';
import { Layout } from './components/layout';

type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting';

function App() {
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');

  const handleDiscordRpcToggle = (enabled: boolean) => {
    void enabled;
    // WebSocket events are already being sent from the settings component
  };

  useEffect(() => {
    loadCurrentTrack();

    // Listen for real-time updates from content script (only on actual changes)
    const handleMessage = (message: { type: string; trackInfo: TrackInfo }) => {
      if (message.type === 'TRACK_UPDATE') {
        setTrackInfo(message.trackInfo);
        setError(null);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Listen for real websocket connection status updates
  useEffect(() => {
    const handleConnectionStatusUpdate = (message: {
      type: string;
      status: ConnectionStatus;
    }) => {
      if (
        message.type === 'CONNECTION_STATUS_UPDATE' ||
        message.type === 'WEBSOCKET_STATUS_CHANGE'
      ) {
        setConnectionStatus(message.status);
      }
    };

    // Listen for connection status updates from background script
    chrome.runtime.onMessage.addListener(handleConnectionStatusUpdate);

    // Get initial connection status
    chrome.runtime.sendMessage(
      { type: 'GET_CONNECTION_STATUS' },
      (response) => {
        if (response?.status) {
          setConnectionStatus(response.status);
        }
      }
    );

    return () => {
      chrome.runtime.onMessage.removeListener(handleConnectionStatusUpdate);
    };
  }, []);

  // Handle internal progress updates when playing
  useEffect(() => {
    if (!trackInfo?.isPlaying) return;

    const interval = setInterval(() => {
      setTrackInfo((prev) => {
        if (!prev?.isPlaying) return prev;

        const now = Date.now();
        const elapsed = now - prev.timestamp;
        const newCurrentDuration = Math.min(
          prev.metadata.currentDuration + elapsed,
          prev.metadata.totalDuration
        );

        return {
          ...prev,
          metadata: {
            ...prev.metadata,
            currentDuration: newCurrentDuration,
          },
          timestamp: now,
        };
      });
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [trackInfo?.isPlaying]);

  const loadCurrentTrack = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        setError('No active tab found');
        setIsLoading(false);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_CURRENT_TRACK',
      });

      if (response) {
        setTrackInfo(response);
        setError(null);
      } else {
        setError('No track information available');
      }
    } catch {
      setError(
        'Failed to load track information. Make sure you are on YouTube Music.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout
        connectionStatus={connectionStatus}
        onDiscordRpcToggle={handleDiscordRpcToggle}
      >
        <Loading />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout
        connectionStatus={connectionStatus}
        onDiscordRpcToggle={handleDiscordRpcToggle}
      >
        <Error message={error} onRetry={loadCurrentTrack} loading={isLoading} />
      </Layout>
    );
  }

  if (!trackInfo?.metadata) {
    return (
      <Layout
        connectionStatus={connectionStatus}
        onDiscordRpcToggle={handleDiscordRpcToggle}
      >
        <EmptyState />
      </Layout>
    );
  }

  const { metadata, isPlaying } = trackInfo;

  return (
    <Layout
      connectionStatus={connectionStatus}
      onDiscordRpcToggle={handleDiscordRpcToggle}
    >
      <TrackCard metadata={metadata} isPlaying={isPlaying} />
    </Layout>
  );
}

export default App;
