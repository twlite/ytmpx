import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';

type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting';

interface ConnectionStatusProps {
  status?: ConnectionStatus;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status = 'disconnected',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  useEffect(() => {
    // Show the status badge after a short delay to avoid flickering
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(refreshCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

  const handleRefresh = async () => {
    if (isRefreshing || refreshCooldown > 0) return;

    setIsRefreshing(true);
    setRefreshCooldown(3);

    try {
      // Send message to content script to reconnect
      chrome.runtime.sendMessage({ type: 'RECONNECT_WEBSOCKET' });
    } catch (error) {
      console.error('Failed to reconnect:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          variant: 'default' as const,
          className:
            'bg-green-500/20 text-green-600 hover:bg-green-500/30 border-0 shadow-lg shadow-green-500/20',
          icon: <Wifi className="w-3 h-3" />,
          text: 'Connected',
          animation: 'animate-pulse',
        };
      case 'connecting':
        return {
          variant: 'secondary' as const,
          className:
            'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 border-0',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Connecting',
          animation: '',
        };
      case 'reconnecting':
        return {
          variant: 'secondary' as const,
          className:
            'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 border-0',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Reconnecting',
          animation: '',
        };
      case 'disconnected':
      default:
        return {
          variant: 'destructive' as const,
          className:
            'bg-red-500/20 text-red-600 hover:bg-red-500/30 border-0 text-destructive-foreground',
          icon: <WifiOff className="w-3 h-3" />,
          text: 'No Server',
          animation: '',
        };
    }
  };

  const config = getStatusConfig();

  const getTooltipText = () => {
    const url = (
      <span className="font-mono text-xs font-medium">ws://localhost:8765</span>
    );

    switch (status) {
      case 'connected':
        return <>Connected to WebSocket server at {url}</>;
      case 'connecting':
        return <>Connecting to {url}...</>;
      case 'reconnecting':
        return <>Reconnecting to {url}...</>;
      case 'disconnected':
      default:
        return <>WebSocket server not available at {url}</>;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={config.variant}
              className={`${config.className} ${config.animation} transition-all duration-200 cursor-help`}
            >
              <div className="flex items-center gap-1.5">
                {config.icon}
                <span className="text-xs font-medium">{config.text}</span>
              </div>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Refresh button - only show when disconnected */}
      {status === 'disconnected' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing || refreshCooldown > 0}
                className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-600 disabled:opacity-50"
              >
                {isRefreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {isRefreshing
                  ? 'Reconnecting...'
                  : refreshCooldown > 0
                  ? `Try again in ${refreshCooldown}s`
                  : 'Reconnect to server'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
