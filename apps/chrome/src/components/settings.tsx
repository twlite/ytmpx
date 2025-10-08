import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface SettingsProps {
  onDiscordRpcToggle?: (enabled: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onDiscordRpcToggle }) => {
  const [discordRpcEnabled, setDiscordRpcEnabled] = useState(false);

  useEffect(() => {
    // Load Discord RPC setting from storage
    chrome.storage.sync.get(['discordRpcEnabled'], (result) => {
      setDiscordRpcEnabled(result.discordRpcEnabled ?? false);
    });
  }, []);

  const handleDiscordRpcToggle = (enabled: boolean) => {
    setDiscordRpcEnabled(enabled);
    chrome.storage.sync.set({ discordRpcEnabled: enabled });

    // Send WebSocket event to content script
    chrome.runtime
      .sendMessage({
        type: 'DISCORD_RPC_TOGGLE',
        enabled: enabled,
      })
      .catch(() => {
        // Ignore errors if content script is not available
      });

    onDiscordRpcToggle?.(enabled);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <SettingsIcon className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="discord-rpc" className="text-sm font-medium">
              Discord RPC
            </Label>
            <p className="text-xs text-muted-foreground">
              Show current track in Discord
            </p>
          </div>
          <Switch
            id="discord-rpc"
            checked={discordRpcEnabled}
            onCheckedChange={handleDiscordRpcToggle}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
