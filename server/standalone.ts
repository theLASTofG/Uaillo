import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { handleApi } from './api.ts';
import { fileStore } from './file-store.ts';
import { attachSocket } from './socket.ts';
import { Store } from './store.ts';

// Servidor de produção (Render): a mesma API REST e o mesmo socket do dev
// server, mais os arquivos de `dist/`. O front do GitHub Pages fala com ele
// por CORS (REST) e WebSocket; as origens aceitas vêm de ALLOWED_ORIGINS.

const PORT = Number(process.env.PORT ?? 8080);
const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'https://thelastofg.github.io,http://localhost:5180,http://localhost:5181')
  .split(',').map((o) => o.trim()).filter(Boolean);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8',
};

const store = new Store(fileStore(process.env.DATA_FILE ?? join(ROOT, 'data/db.json')));

const http = createServer(async (rq, rs) => {
  const origin = rq.headers.origin;
  if (origin && ORIGINS.includes(origin)) {
    rs.setHeader('access-control-allow-origin', origin);
    rs.setHeader('vary', 'origin');
    rs.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
    rs.setHeader('access-control-allow-headers', 'content-type');
  }
  if (rq.method === 'OPTIONS') return rs.writeHead(204).end();
  if (rq.url === '/healthz') return rs.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
  if (await handleApi(store, rq, rs)) return;
  serveStatic(rq.url ?? '/', rs);
});

/** Arquivos do build; rotas desconhecidas caem no index.html. */
function serveStatic(url: string, rs: import('node:http').ServerResponse) {
  const path = decodeURIComponent(new URL(url, 'http://x').pathname);
  let file = resolve(DIST, '.' + path);
  if (file !== DIST && !file.startsWith(DIST + sep)) return rs.writeHead(403).end();
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  if (!existsSync(file)) return rs.writeHead(404).end('build não encontrado: rode npm run build');
  const cache = file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  rs.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': cache });
  createReadStream(file).pipe(rs);
}

// Socket: aceita o próprio host (app servido daqui) e as origens liberadas.
attachSocket(http, store, (rq) => {
  const origin = rq.headers.origin;
  if (!origin || ORIGINS.includes(origin)) return true;
  try {
    return new URL(origin).host === rq.headers.host;
  } catch {
    return false;
  }
});
http.listen(PORT, () => console.log(`Uaillo em http://localhost:${PORT} (origens: ${ORIGINS.join(', ')})`));
