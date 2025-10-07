import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    // Show the status badge after a short delay to avoid flickering
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [status]);

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
  );
};
