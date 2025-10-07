import { YtmpxServer } from '../src/index';

const server = new YtmpxServer();

server.start();

process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});
