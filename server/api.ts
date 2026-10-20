import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError, type Store } from './store.ts';

// REST no formato da API pública do Trello (prefixo /1/).
// Só cobre o necessário para o quadro funcionar.

type Handler = (store: Store, params: string[], body: any, query: URLSearchParams) => unknown;

const routes: [method: string, pattern: RegExp, handler: Handler][] = [
  ['GET', /^\/1\/members\/me\/boards$/, (s) => s.boardIds().map((id) => {
    const { lists, cards, ...b } = s.getBoard(id)!;
    return b;
  })],
  ['GET', /^\/1\/boards\/(\w+)$/, (s, [id]) => s.getBoard(id) ?? notFound('board')],
  ['POST', /^\/1\/cards$/, (s, _, b) => s.createCard(req(b.idList, 'idList'), req(b.name, 'name'), num(b.pos))],
  ['PUT', /^\/1\/cards\/(\w+)$/, (s, [id], b) => s.updateCard(id, pick(b, ['name', 'desc', 'idList', 'pos', 'closed', 'idLabels', 'due', 'dueComplete']))],
  ['POST', /^\/1\/cards\/(\w+)\/checklists$/, (s, [id], b) => s.createChecklist(id, req(b.name, 'name'))],
  ['DELETE', /^\/1\/checklists\/(\w+)$/, (s, [id]) => (s.deleteChecklist(id), {})],
  ['POST', /^\/1\/checklists\/(\w+)\/checkItems$/, (s, [id], b) => s.createCheckItem(id, req(b.name, 'name'))],
  ['PUT', /^\/1\/cards\/(\w+)\/checkItem\/(\w+)$/, (s, [id, item], b) => s.updateCheckItem(id, item, pick(b, ['name', 'state']))],
  ['DELETE', /^\/1\/cards\/(\w+)\/checkItem\/(\w+)$/, (s, [id, item]) => (s.deleteCheckItem(id, item), {})],
  ['GET', /^\/1\/cards\/(\w+)\/actions$/, (s, [id]) => s.comments(id)],
  ['POST', /^\/1\/cards\/(\w+)\/actions\/comments$/, (s, [id], b) => s.addComment(id, req(b.text, 'text'))],
  ['DELETE', /^\/1\/cards\/(\w+)$/, (s, [id]) => (s.deleteCard(id), {})],
  ['POST', /^\/1\/lists$/, (s, _, b) => s.createList(req(b.idBoard, 'idBoard'), req(b.name, 'name'))],
  ['PUT', /^\/1\/lists\/(\w+)$/, (s, [id], b) => s.updateList(id, pick(b, ['name', 'pos', 'closed']))],
];

/** Executa uma rota sem HTTP. Lança HttpError; usado também pelo modo demo no navegador. */
export function dispatch(store: Store, method: string, pathname: string, body: any, query = new URLSearchParams()) {
  const match = routes.find(([m, p]) => m === method && p.test(pathname));
  if (!match) throw new HttpError(404, 'route not found');
  return match[2](store, pathname.match(match[1])!.slice(1), body ?? {}, query);
}

/** Middleware connect. Devolve false se a rota não for da API. */
export async function handleApi(store: Store, rq: IncomingMessage, rs: ServerResponse): Promise<boolean> {
  const url = new URL(rq.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/1/')) return false;
  try {
    const body = rq.method === 'GET' || rq.method === 'DELETE' ? {} : await readJson(rq);
    send(rs, 200, dispatch(store, rq.method ?? 'GET', url.pathname, body, url.searchParams));
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    send(rs, status, { error: (e as Error).message });
  }
  return true;
}

function send(rs: ServerResponse, status: number, data: unknown) {
  rs.statusCode = status;
  rs.setHeader('content-type', 'application/json');
  rs.end(JSON.stringify(data));
}

async function readJson(rq: IncomingMessage) {
  let raw = '';
  for await (const chunk of rq) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new HttpError(400, 'invalid json');
  }
}

const notFound = (what: string): never => { throw new HttpError(404, `${what} not found`); };

function req(v: unknown, name: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `missing ${name}`);
  return v.trim();
}

function num(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function pick(b: any, keys: string[]) {
  return Object.fromEntries(keys.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));
}
