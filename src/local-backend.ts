import type { Action } from '../shared/types.ts';
import { dispatch } from '../server/api.ts';
import { HttpError, Store, type Db } from '../server/store.ts';

// Modo demo (GitHub Pages): o mesmo Store e as mesmas rotas do servidor,
// rodando dentro do navegador e salvando no localStorage.
// O "socket" vira um ouvinte do Store; entre abas, o evento `storage`
// avisa que outra aba gravou, e reaproveitamos `actionsSince` para
// ressincronizar como no reconectar do socket real.

const KEY = 'uaillo-db';

const store = new Store({
  load: () => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Db) : null;
    } catch {
      return null;
    }
  },
  save: (db) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      // Sem localStorage (aba privada ou bloqueado): o quadro funciona só na memória.
    }
  },
});

/** Equivale a um fetch na API: devolve cópia e rejeita com a mensagem do erro. */
export async function localCall(method: string, path: string, body?: unknown) {
  try {
    return structuredClone(dispatch(store, method, path, body ?? {}));
  } catch (e) {
    throw new Error(e instanceof HttpError ? e.message : String(e));
  }
}

type Status = 'conectando' | 'online' | 'offline';

/** Mesma interface do BoardSocket. */
export class LocalSocket {
  constructor(
    private idBoard: string,
    private getIxLastUpdate: () => number,
    private onActions: (actions: Action[]) => void,
    private onStatus: (s: Status) => void,
  ) {}

  connect() {
    store.onAction((a) => {
      if (a.idBoard === this.idBoard) queueMicrotask(() => this.onActions([structuredClone(a)]));
    });
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY) return;
      store.reload();
      const missed = store.actionsSince(this.idBoard, this.getIxLastUpdate());
      if (missed.length) this.onActions(structuredClone(missed));
    });
    this.onStatus('online');
  }
}
