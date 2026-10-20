import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Server } from 'node:http';
import type { Plugin } from 'vite';
import { handleApi } from './api.ts';
import { attachSocket } from './socket.ts';
import { Store, type Persistence } from './store.ts';

/** Banco num arquivo JSON (modo local com servidor). */
function fileStore(file: string): Persistence {
  return {
    load: () => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null),
    save: (db) => {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(db, null, 2));
    },
  };
}

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
