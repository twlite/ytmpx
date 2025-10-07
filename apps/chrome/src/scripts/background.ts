import { WebSocketManager } from '../utils/websocket-manager';

let wsManager: WebSocketManager | null = null;

chrome.runtime.onInstalled.addListener(() => {
  // Initialize websocket manager
  wsManager = new WebSocketManager();

  // Notify all tabs about connection status
  notifyConnectionStatus('connecting');
});

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  switch (message.type) {
    case 'TRACK_CHANGED':
      // Send track change to websocket
      if (wsManager && message.trackInfo) {
        wsManager.checkForTrackChanges(
          message.trackInfo.metadata,
          message.trackInfo.isPlaying
        );
      }
      break;

    case 'TRACK_PROGRESS_UPDATE':
      // Send periodic progress update to websocket
      if (wsManager && message.trackInfo) {
        const eventType = message.isPlaying ? 'resume' : 'pause';
        wsManager.sendEvent({
          event: eventType,
          metadata: message.trackInfo.metadata,
        });
      }
      break;

    case 'GET_CONNECTION_STATUS': {
      // Return current connection status
      const status = wsManager?.getConnectionState() || 'disconnected';
      _sendResponse({ status });
      break;
    }

    case 'WEBSOCKET_STATUS_CHANGE':
      // Notify all tabs about websocket status change
      notifyConnectionStatus(message.status);
      break;

    case 'DISCORD_RPC_TOGGLE':
      // Send Discord RPC toggle event to websocket
      if (wsManager && wsManager.isConnected()) {
        const eventType = message.enabled ? 'TURN_ON' : 'TURN_OFF';
        wsManager.sendEvent({
          event: eventType as 'TURN_ON' | 'TURN_OFF',
          metadata: {
            author: '',
            url: '',
            title: '',
            totalDuration: 0,
            currentDuration: 0,
            image: null,
            artistUrl: null,
          },
        });
      }
      break;

    case 'KEEP_ALIVE':
      // Keep the service worker alive
      break;

    default:
      // Unknown message type
      break;
  }
});

// Monitor websocket connection status
function monitorConnectionStatus() {
  if (!wsManager) return;

  const currentStatus = wsManager.getConnectionState();

  // Notify all tabs about status change
  notifyConnectionStatus(currentStatus);

  // Check again in 1 second
  setTimeout(monitorConnectionStatus, 1000);
}

function notifyConnectionStatus(
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, {
            type: 'CONNECTION_STATUS_UPDATE',
            status,
          })
          .catch(() => {
            // Ignore errors for tabs that don't have our content script
          });
      }
    });
  });
}

// Start monitoring connection status
monitorConnectionStatus();
