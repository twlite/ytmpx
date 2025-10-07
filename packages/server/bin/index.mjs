#!/usr/bin/env node

import { YtmpxServer } from '../dist/index.js';

const server = new YtmpxServer();

server.start();

process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
});