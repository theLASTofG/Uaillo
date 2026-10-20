import type { Action, ClientMessage, ServerMessage } from '../shared/types.ts';

// Cliente do /1/Session/socket.
// - ping a cada 10 s (o servidor derruba após 24 s sem mensagens)
// - reconexão com espera crescente e limite diário de falhas, como o do Trello
// - ao reconectar, reassina mandando o último ixLastUpdate visto, e o
//   servidor devolve só as ações perdidas

const PING_EVERY_MS = 10_000;
const MAX_FAILURES_PER_DAY = 200;

type Status = 'conectando' | 'online' | 'offline';
type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

export class BoardSocket {
  private ws?: WebSocket;
  private reqid = 0;
  private pending = new Map<number, Pending>();
  private pingTimer?: number;
  private failures = 0;
  private failureDay = new Date().toDateString();

  constructor(
    private idBoard: string,
    private getIxLastUpdate: () => number,
    private onActions: (actions: Action[]) => void,
    private onStatus: (s: Status) => void,
  ) {}

  connect() {
    this.onStatus('conectando');
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = (this.ws = new WebSocket(`${proto}://${location.host}/1/Session/socket`));

    ws.onopen = async () => {
      this.failures = 0;
      this.pingTimer = window.setInterval(() => this.request({ type: 'ping' }).catch(() => {}), PING_EVERY_MS);
      try {
        await this.request({ type: 'subscribe', modelType: 'Board', idModel: this.idBoard, tags: ['clientActions'], ixLastUpdate: this.getIxLastUpdate() });
        this.onStatus('online');
      } catch {
        ws.close();
      }
    };

    ws.onmessage = (ev) => {
      const msg: ServerMessage = JSON.parse(ev.data);
      if ('notify' in msg) return this.onActions(msg.notify.actions);
      const p = this.pending.get(msg.reqid);
      if (!p) return;
      this.pending.delete(msg.reqid);
      'error' in msg ? p.reject(new Error(msg.error)) : p.resolve(msg.result);
    };

    ws.onclose = () => {
      clearInterval(this.pingTimer);
      for (const p of this.pending.values()) p.reject(new Error('socket closed'));
      this.pending.clear();
      this.onStatus('offline');
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    const today = new Date().toDateString();
    if (today !== this.failureDay) [this.failures, this.failureDay] = [0, today];
    if (++this.failures > MAX_FAILURES_PER_DAY) return;
    const delay = Math.min(30_000, 500 * 2 ** Math.min(this.failures, 6)) * (0.5 + Math.random());
    setTimeout(() => this.connect(), delay);
  }

  private request(msg: ClientMessage extends infer M ? (M extends unknown ? Omit<M, 'reqid'> : never) : never): Promise<unknown> {
    const reqid = this.reqid++;
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WebSocket.OPEN) return reject(new Error('socket not open'));
      this.pending.set(reqid, { resolve, reject });
      this.ws.send(JSON.stringify({ ...msg, reqid }));
    });
  }
}
