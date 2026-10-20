import type { Action, Board } from '../shared/types.ts';

// Aplica ações recebidas pelo socket sobre o quadro local.
// Ações com ixUpdate já visto são ignoradas, então aplicar a mesma
// ação duas vezes (resposta REST + eco do socket) é inofensivo.

export function applyActions(board: Board, actions: Action[]): boolean {
  let changed = false;
  for (const a of actions.sort((x, y) => x.ixUpdate - y.ixUpdate)) {
    if (a.ixUpdate <= board.ixLastUpdate) continue;
    const { card, list, idDeleted } = a.data;
    if (card) upsert(board.cards, card);
    if (list) upsert(board.lists, list);
    if (idDeleted) board.cards = board.cards.filter((c) => c.id !== idDeleted);
    board.ixLastUpdate = a.ixUpdate;
    changed = true;
  }
  if (changed) {
    board.cards = board.cards.filter((c) => !c.closed).sort((a, b) => a.pos - b.pos);
    board.lists = board.lists.filter((l) => !l.closed).sort((a, b) => a.pos - b.pos);
  }
  return changed;
}

function upsert<T extends { id: string }>(items: T[], item: T) {
  const i = items.findIndex((x) => x.id === item.id);
  i >= 0 ? (items[i] = item) : items.push(item);
}

/** Posição entre dois vizinhos (técnica de posições fracionárias do Trello). */
export function posBetween(before?: number, after?: number) {
  if (before === undefined && after === undefined) return 65535;
  if (before === undefined) return after! / 2;
  if (after === undefined) return before + 65535;
  return (before + after) / 2;
}
