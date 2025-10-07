import React from 'react';
import iconSvg from '/icon.svg';
import { Separator } from './ui/separator';
import { Settings } from './settings';
import { ConnectionStatus } from './connection-status';

interface HeaderProps {
  connectionStatus?:
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'reconnecting';
  onDiscordRpcToggle?: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus = 'disconnected',
  onDiscordRpcToggle,
}) => {
  return (
    <div className="flex flex-col p-6 pb-4 bg-gradient-to-r from-background to-muted/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 group">
          <img
            src={iconSvg}
            alt="YTMPX"
            className="w-8 h-8 text-primary-foreground group-hover:scale-110 transition-transform duration-200"
          />
          <span className="text-xl font-bold text-foreground">YTMPX</span>
        </div>
        <Settings onDiscordRpcToggle={onDiscordRpcToggle} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">YouTube Music Extension</p>
        <ConnectionStatus status={connectionStatus} />
      </div>

      <Separator className="mt-4 w-full" />
    </div>
  );
};
