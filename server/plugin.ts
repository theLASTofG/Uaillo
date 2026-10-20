import { resolve } from 'node:path';
import type { Server } from 'node:http';
import type { Plugin } from 'vite';
import { handleApi } from './api.ts';
import { fileStore } from './file-store.ts';
import { attachSocket } from './socket.ts';
import { Store } from './store.ts';

/** Plugin do Vite que pendura a API REST e o socket no dev server. */
export function uailloServer(): Plugin {
  return {
    name: 'uaillo-server',
    configureServer(server) {
      const store = new Store(fileStore(resolve(server.config.root, 'data/db.json')));
      server.middlewares.use((rq, rs, next) => {
        handleApi(store, rq, rs).then((handled) => handled || next(), next);
      });
      if (server.httpServer) attachSocket(server.httpServer as Server, store);
    },
  };
}
