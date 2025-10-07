# YTMPX

YTMPX is a Chrome extension that shows your current YouTube Music track in Discord.

To use it, run

```bash
pnpm --filter=chrome build
```

and load the `dist` directory in `chrome://extensions/`.

---

# YTMPX Server

The server that powers the YTMPX Chrome extension, handling WebSocket connections and Discord RPC integration.

## Features

- WebSocket server for real-time communication with the Chrome extension
- Discord RPC integration for showing current YouTube Music track
- Toggle Discord RPC on/off from the extension UI
- Real-time track updates (play, pause, track changes)

# Setup

## Use ready-made Discord Application

To use the ready-made Discord Application, run the following command:

```bash
npx --yes ytmpx
```

That's it! You can now use the YTMPX Chrome extension.

## Setup your own Discord Application

### 1. Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "General Information" and copy the "Application ID"
4. Replace `123456789012345678` in `src/constants.ts` with your actual Application ID

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run the Server

```bash
pnpm dev
```

The server will start on `ws://localhost:8765` and connect to Discord.

## WebSocket Events

The server handles the following events from the Chrome extension:

- `track` - Track information (title, artist, duration, etc.)
- `pause` - Track paused
- `resume` - Track resumed
- `TURN_ON` - Enable Discord RPC
- `TURN_OFF` - Disable Discord RPC

## Discord RPC Features

- Shows current track title and artist
- Displays play/pause status with icons
- Shows progress bar with timestamps
- Includes "Listen on YouTube Music" button
- Automatically clears when extension disconnects
- Can be toggled on/off from the extension UI

## Development

```bash
# Build TypeScript
pnpm build

# Run in development
pnpm dev
```
