import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { CloseCode, type ClientMessage, type ServerMessage } from '../shared/types.ts';
import type { Store } from './store.ts';

// Socket em /1/Session/socket, no mesmo estilo RPC do Trello:
// cada pedido leva `reqid` e recebe `{reqid, result}`.
// `subscribe` devolve o ixLastUpdate atual e, se o cliente mandar o último
// que viu, já empurra as ações perdidas para ele ressincronizar.

const PATH = '/1/Session/socket';
const PING_TIMEOUT_MS = 24_000;

export function attachSocket(http: Server, store: Store) {
  const wss = new WebSocketServer({ noServer: true });
  const subs = new Map<WebSocket, Set<string>>();

  http.on('upgrade', (rq, socket, head) => {
    if (new URL(rq.url ?? '/', 'http://localhost').pathname !== PATH) return; // deixa o HMR do Vite passar
    wss.handleUpgrade(rq, socket, head, (ws) => wss.emit('connection', ws));
  });

  wss.on('connection', (ws) => {
    subs.set(ws, new Set());
    let timer = setTimeout(() => ws.close(CloseCode.PingTimeout, 'ping timeout'), PING_TIMEOUT_MS);
    const send = (m: ServerMessage) => ws.send(JSON.stringify(m));

    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => ws.close(CloseCode.PingTimeout, 'ping timeout'), PING_TIMEOUT_MS);

      switch (msg.type) {
        case 'ping':
          return send({ reqid: msg.reqid, result: true });
        case 'subscribe': {
          const board = store.getBoard(msg.idModel);
          if (!board) {
            send({ reqid: msg.reqid, error: 'invalid model' });
            return ws.close(CloseCode.InvalidModel, 'invalid model');
          }
          subs.get(ws)!.add(msg.idModel);
          send({ reqid: msg.reqid, result: board.ixLastUpdate });
          if (msg.ixLastUpdate !== undefined && msg.ixLastUpdate < board.ixLastUpdate) {
            const actions = store.actionsSince(msg.idModel, msg.ixLastUpdate);
            send({ notify: { event: 'updateModels', typeName: 'Board', idModel: msg.idModel, actions } });
          }
          return;
        }
        case 'unsubscribe':
          subs.get(ws)!.delete(msg.idModel);
          return send({ reqid: msg.reqid, result: true });
      }
    });

    ws.on('close', () => {
      clearTimeout(timer);
      subs.delete(ws);
    });
  });

  store.onAction((action) => {
    const data = JSON.stringify({
      notify: { event: 'updateModels', typeName: 'Board', idModel: action.idBoard, actions: [action] },
    } satisfies ServerMessage);
    for (const [ws, boards] of subs) if (boards.has(action.idBoard) && ws.readyState === ws.OPEN) ws.send(data);
  });
}
