# YTMPX Server

YTMPX Server is a server that powers the YTMPX Chrome extension.

## Setup

```bash
npx --yes ytmpx
```

That's it! You can now use the YTMPX Chrome extension.

## Programmatic Usage (ESM-only)

```bash
npm i ytmpx
```

```ts
import { YtmpxServer } from 'ytmpx';

const server = new YtmpxServer();

server.start();
```
