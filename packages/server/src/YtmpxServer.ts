import { WebSocketServer } from 'ws';
import { Client, SetActivity } from '@xhayper/discord-rpc';
import { ActivityType } from 'discord-api-types/v10';
import { DISCORD_CLIENT_ID, WEBSOCKET_PORT } from './constants.js';

interface TrackMetadata {
  title: string;
  author: string;
  url: string;
  totalDuration: number;
  currentDuration: number;
  image: string | null;
  artistUrl: string | null;
}

interface WebSocketEvent {
  event: 'track' | 'pause' | 'resume' | 'TURN_ON' | 'TURN_OFF';
  metadata: TrackMetadata;
}

export class YtmpxServer {
  private discordClient: Client;
  private wss: WebSocketServer;
  private currentTrack: TrackMetadata | null = null;
  private isPlaying = false;
  private isDiscordRpcEnabled = true;

  public constructor() {
    this.discordClient = new Client({
      clientId: DISCORD_CLIENT_ID,
    });

    this.wss = new WebSocketServer({ port: WEBSOCKET_PORT });
    this.setupDiscordRpc();
    this.setupWebSocket();
  }

  private setupDiscordRpc(): void {
    this.discordClient.on('ready', () => {
      console.log('Discord RPC: Connected');
    });

    this.discordClient.on('error', (error) => {
      console.error('Discord RPC: Error:', error);
    });

    this.discordClient.login().catch(console.error);
  }

  private setupWebSocket(): void {
    console.log(`YTMPX Server running on ws://localhost:${WEBSOCKET_PORT}`);
    console.log('Discord RPC: Connecting...');

    this.wss.on('connection', (ws) => {
      console.log('YTMPX: Client connected');

      ws.on('message', (data) => {
        try {
          const event: WebSocketEvent = JSON.parse(data.toString());
          this.handleWebSocketEvent(event);
        } catch (error) {
          console.error('YTMPX: Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log('YTMPX: Client disconnected');
        this.clearDiscordActivity().catch(console.error);
      });

      ws.on('error', (err) => {
        console.error('YTMPX: WebSocket error:', err);
      });
    });

    console.log('Waiting for YTMPX extension to connect...');
  }

  private isValidMetadata(metadata: TrackMetadata): boolean {
    return !!(
      metadata.title &&
      metadata.author &&
      metadata.currentDuration >= 0 &&
      metadata.totalDuration >= 0
    );
  }

  private handleWebSocketEvent(event: WebSocketEvent): void {
    const { event: eventType, metadata } = event;

    switch (eventType) {
      case 'track':
        if (this.isValidMetadata(metadata)) {
          this.currentTrack = metadata;
        }
        this.updateDiscordActivity().catch(console.error);
        break;

      case 'pause':
        this.isPlaying = false;
        if (this.isValidMetadata(metadata)) {
          this.currentTrack = metadata;
        }
        this.updateDiscordActivity().catch(console.error);
        break;

      case 'resume':
        this.isPlaying = true;
        if (this.isValidMetadata(metadata)) {
          this.currentTrack = metadata;
        }
        this.updateDiscordActivity().catch(console.error);
        break;

      case 'TURN_ON':
        this.isDiscordRpcEnabled = true;
        console.log('Discord RPC: Enabled');
        this.updateDiscordActivity().catch(console.error);
        break;

      case 'TURN_OFF':
        this.isDiscordRpcEnabled = false;
        console.log('Discord RPC: Disabled');
        this.clearDiscordActivity().catch(console.error);
        break;

      default:
        console.log('YTMPX: Unknown event type:', eventType);
    }
  }

  private async updateDiscordActivity(): Promise<void> {
    if (!this.isDiscordRpcEnabled || !this.currentTrack) {
      return;
    }

    if (!this.discordClient.isConnected) {
      await this.discordClient.login();
    }

    const { title, author, image, currentDuration, totalDuration, artistUrl } =
      this.currentTrack;

    const startTime = this.isPlaying ? Date.now() - currentDuration : undefined;
    const endTime =
      this.isPlaying && totalDuration > 0
        ? Date.now() + (totalDuration - currentDuration)
        : undefined;

    const activity: SetActivity = {
      details: title || 'Unknown Title',
      state: author || 'Unknown Artist',
      largeImageUrl: image ?? undefined,
      type: ActivityType.Listening,
      startTimestamp: startTime,
      endTimestamp: endTime,
      name: 'YouTube Music',
      url: this.currentTrack.url || 'https://music.youtube.com',
      detailsUrl: this.currentTrack.url || 'https://music.youtube.com',
      stateUrl:
        artistUrl || this.currentTrack.url || 'https://music.youtube.com',
      buttons: [
        {
          label: 'Play on YouTube Music',
          url: this.currentTrack.url || 'https://music.youtube.com',
        },
      ],
    };

    try {
      await this.discordClient.user?.setActivity(activity);
    } catch (error) {
      console.error('Discord RPC: Error setting activity:', error);
    }
  }

  private async clearDiscordActivity(): Promise<void> {
    if (this.isDiscordRpcEnabled) {
      try {
        await this.discordClient.user?.setActivity({});
        await this.discordClient.destroy();
      } catch (error) {
        console.error('Discord RPC: Error clearing activity:', error);
      }
    }
  }

  public start(): void {
    console.log('YTMPX Server started');
  }

  public stop(): void {
    this.wss.close();
    this.discordClient.destroy();
    console.log('YTMPX Server stopped');
  }
}
