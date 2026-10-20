import type { Action, Board, Card, CheckItem, Checklist, List } from '../shared/types.ts';

// Cliente REST fino sobre /1/.

/** Build do GitHub Pages: sem servidor, a API roda no próprio navegador. */
export const DEMO = import.meta.env.VITE_DEMO === '1';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (DEMO) return (await import('./local-backend.ts')).localCall(method, path, body) as T;
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

export const api = {
  myBoards: () => call<Omit<Board, 'lists' | 'cards'>[]>('GET', '/1/members/me/boards'),
  board: (id: string) => call<Board>('GET', `/1/boards/${id}`),
  createCard: (idList: string, name: string) => call<Card>('POST', '/1/cards', { idList, name }),
  updateCard: (id: string, patch: Partial<Card>) => call<Card>('PUT', `/1/cards/${id}`, patch),
  deleteCard: (id: string) => call<{}>('DELETE', `/1/cards/${id}`),
  createList: (idBoard: string, name: string) => call<List>('POST', '/1/lists', { idBoard, name }),
  updateList: (id: string, patch: Partial<List>) => call<List>('PUT', `/1/lists/${id}`, patch),
  createChecklist: (idCard: string, name: string) => call<Checklist>('POST', `/1/cards/${idCard}/checklists`, { name }),
  deleteChecklist: (id: string) => call<{}>('DELETE', `/1/checklists/${id}`),
  createCheckItem: (idChecklist: string, name: string) => call<CheckItem>('POST', `/1/checklists/${idChecklist}/checkItems`, { name }),
  updateCheckItem: (idCard: string, id: string, patch: Partial<CheckItem>) => call<CheckItem>('PUT', `/1/cards/${idCard}/checkItem/${id}`, patch),
  deleteCheckItem: (idCard: string, id: string) => call<{}>('DELETE', `/1/cards/${idCard}/checkItem/${id}`),
  comments: (idCard: string) => call<Action[]>('GET', `/1/cards/${idCard}/actions`),
  addComment: (idCard: string, text: string) => call<Action>('POST', `/1/cards/${idCard}/actions/comments`, { text }),
};
