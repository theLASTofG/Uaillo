import type { Board, Card, List } from '../shared/types.ts';
import { api } from './api.ts';
import { posBetween } from './state.ts';
import { h, icon, isEditing } from './dom.ts';
import { LABEL_NAMES, openCard } from './card-detail.ts';

// Renderização do quadro e arrastar-e-soltar com os eventos nativos
// dragstart/dragover/drop/dragend (o Trello também não usa biblioteca).

let dragging: { kind: 'card' | 'list'; id: string } | null = null;
let filter = '';

/** Último quadro pedido enquanto o render estava adiado. */
let deferred: { root: HTMLElement; board: Board } | null = null;

/**
 * Texto do filtro do topo; casa com nome do cartão ou etiqueta.
 * Só liga/desliga `hidden` nos cartões: todos ficam no DOM, então o
 * arrastar continua vendo os vizinhos reais (inclusive os ocultos).
 */
export function setFilter(root: HTMLElement, board: Board, text: string) {
  filter = text.trim().toLowerCase();
  for (const el of root.querySelectorAll<HTMLElement>('.card')) {
    const card = board.cards.find((c) => c.id === el.dataset.id);
    el.hidden = !!card && !matches(board, card);
  }
}

function matches(board: Board, card: Card) {
  if (!filter) return true;
  const labels = board.labels.filter((l) => card.idLabels.includes(l.id)).map((l) => `${l.name} ${LABEL_NAMES[l.color]}`);
  return [card.name, ...labels].join(' ').toLowerCase().includes(filter);
}

/**
 * Redesenha o quadro. Se houver arrasto em curso ou alguém digitando dentro
 * do quadro, adia até o `dragend`/`focusout` para não perder foco nem texto.
 */
export function renderBoard(root: HTMLElement, board: Board) {
  if (dragging || (root.contains(document.activeElement) && isEditing(document.activeElement))) {
    if (!deferred) root.addEventListener('focusout', flushSoon);
    deferred = { root, board };
    return;
  }
  deferred = null;
  draw(root, board);
}

function flushSoon() {
  // focusout dispara antes do novo foco; espera ele assentar.
  setTimeout(() => deferred && renderBoard(deferred.root, deferred.board));
}

function draw(root: HTMLElement, board: Board) {
  root.removeEventListener('focusout', flushSoon);
  const lists = board.lists.map((l) => renderList(board, l));
  const addList = h('form', { className: 'add-list', onsubmit: (e: SubmitEvent) => submitName(e, (n) => api.createList(board.id, n)) },
    h('input', { name: 'name', placeholder: '+ Adicionar lista', autocomplete: 'off' }));
  const lane = h('div', { className: 'lanes' }, ...lists, addList);
  lane.addEventListener('dragover', (e) => onListDragOver(e, lane));
  lane.addEventListener('drop', (e) => onListDrop(e, board, lane));
  root.replaceChildren(lane);
}

function renderList(board: Board, list: List) {
  const cards = board.cards.filter((c) => c.idList === list.id).map((c) => renderCard(board, c));
  const title = h('h2', { contentEditable: 'true', textContent: list.name });
  title.addEventListener('blur', () => title.textContent!.trim() && title.textContent !== list.name && api.updateList(list.id, { name: title.textContent!.trim() }));
  title.addEventListener('keydown', (e) => e.key === 'Enter' && (e.preventDefault(), title.blur()));

  const archive = h('button', { className: 'icon', title: 'Arquivar lista', onclick: () => confirm(`Arquivar "${list.name}"?`) && api.updateList(list.id, { closed: true }) }, icon('chest'));
  const body = h('div', { className: 'cards', dataset: { idList: list.id } }, ...cards);
  body.addEventListener('dragover', (e) => onCardDragOver(e, body));
  body.addEventListener('drop', (e) => onCardDrop(e, board, body));

  const add = h('form', { className: 'add-card', onsubmit: (e: SubmitEvent) => submitName(e, (n) => api.createCard(list.id, n)) },
    h('input', { name: 'name', placeholder: '+ Adicionar cartão', autocomplete: 'off' }));

  const el = h('section', { className: 'list', draggable: true, dataset: { id: list.id } }, h('header', {}, title, archive), body, add);
  el.addEventListener('dragstart', (e) => {
    if ((e.target as HTMLElement) !== el) return;
    dragging = { kind: 'list', id: list.id };
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', endDrag);
  return el;
}

function renderCard(board: Board, card: Card) {
  const del = h('button', { className: 'icon', title: 'Excluir', onclick: (e: MouseEvent) => (e.stopPropagation(), api.deleteCard(card.id)) }, icon('skull'));
  const labels = board.labels.filter((l) => card.idLabels.includes(l.id)).map((l) =>
    h('i', { className: `chip label-${l.color}`, title: l.name || LABEL_NAMES[l.color] }));
  const el = h('article', { className: 'card', draggable: true, hidden: !matches(board, card), dataset: { id: card.id } },
    labels.length ? h('div', { className: 'chips' }, ...labels) : '',
    h('div', { className: 'row' }, h('span', { textContent: card.name }), del),
    badges(card));
  el.addEventListener('click', () => openCard(board, card.id));
  el.addEventListener('dragstart', (e) => {
    e.stopPropagation();
    dragging = { kind: 'card', id: card.id };
    e.dataTransfer!.effectAllowed = 'move';
    requestAnimationFrame(() => el.classList.add('dragging'));
  });
  el.addEventListener('dragend', endDrag);
  return el;
}

/** Selos da frente do cartão: prazo, descrição, checklist e comentários. */
function badges(card: Card) {
  const out: HTMLElement[] = [];
  if (card.due) {
    const due = new Date(card.due);
    const state = card.dueComplete ? 'done' : due.getTime() < Date.now() ? 'late' : due.getTime() - Date.now() < 86_400_000 ? 'soon' : '';
    out.push(h('span', { className: `badge due ${state}`, title: 'Prazo' }, icon('hourglass'), due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })));
  }
  if (card.desc) out.push(h('span', { className: 'badge', title: 'Tem descrição' }, icon('scroll')));
  const items = card.checklists.flatMap((c) => c.checkItems);
  if (items.length) {
    const done = items.filter((i) => i.state === 'complete').length;
    out.push(h('span', { className: `badge${done === items.length ? ' done' : ''}`, title: 'Checklist' }, icon('shield'), `${done}/${items.length}`));
  }
  if (card.badges.comments) out.push(h('span', { className: 'badge', title: 'Comentários' }, icon('quill'), String(card.badges.comments)));
  return out.length ? h('div', { className: 'badges' }, ...out) : '';
}

function endDrag() {
  dragging = null;
  document.querySelectorAll('.dragging').forEach((n) => n.classList.remove('dragging'));
  // O drop já mandou o PUT; redesenha o que chegou pelo socket durante o arrasto.
  if (deferred) renderBoard(deferred.root, deferred.board);
}

// ---- cartões ----

function onCardDragOver(e: DragEvent, container: HTMLElement) {
  if (dragging?.kind !== 'card') return;
  e.preventDefault();
  const el = document.querySelector<HTMLElement>(`.card[data-id="${dragging.id}"]`);
  if (!el) return;
  const after = siblingAfter(container, '.card', e.clientY, 'y');
  after ? container.insertBefore(el, after) : container.append(el);
}

function onCardDrop(e: DragEvent, board: Board, container: HTMLElement) {
  if (dragging?.kind !== 'card') return;
  e.preventDefault();
  const id = dragging.id;
  const pos = newPos(board.cards, container, '.card', id);
  api.updateCard(id, { idList: container.dataset.idList, pos });
}

// ---- listas ----

function onListDragOver(e: DragEvent, lane: HTMLElement) {
  if (dragging?.kind !== 'list') return;
  e.preventDefault();
  const el = lane.querySelector<HTMLElement>(`.list[data-id="${dragging.id}"]`)!;
  const after = siblingAfter(lane, '.list', e.clientX, 'x');
  lane.insertBefore(el, after ?? lane.querySelector('.add-list'));
}

function onListDrop(e: DragEvent, board: Board, lane: HTMLElement) {
  if (dragging?.kind !== 'list') return;
  e.preventDefault();
  api.updateList(dragging.id, { pos: newPos(board.lists, lane, '.list', dragging.id) });
}

// ---- utilitários ----

/** Primeiro irmão cujo centro fica depois do ponteiro. */
function siblingAfter(container: HTMLElement, selector: string, coord: number, axis: 'x' | 'y') {
  return [...container.querySelectorAll<HTMLElement>(`${selector}:not(.dragging):not([hidden])`)].find((el) => {
    const r = el.getBoundingClientRect();
    return axis === 'y' ? coord < r.top + r.height / 2 : coord < r.left + r.width / 2;
  });
}

/** Calcula a nova `pos` a partir dos vizinhos no DOM depois de soltar (ocultos pelo filtro contam). */
function newPos(items: { id: string; pos: number }[], container: HTMLElement, selector: string, id: string) {
  const ids = [...container.querySelectorAll<HTMLElement>(selector)].map((n) => n.dataset.id!);
  const i = ids.indexOf(id);
  const posOf = (x?: string) => items.find((it) => it.id === x)?.pos;
  return posBetween(posOf(ids[i - 1]), posOf(ids[i + 1]));
}

function submitName(e: SubmitEvent, create: (name: string) => Promise<unknown>) {
  e.preventDefault();
  const input = (e.target as HTMLFormElement).elements.namedItem('name') as HTMLInputElement;
  const name = input.value.trim();
  if (!name) return;
  input.value = '';
  create(name).catch((err) => alert(err.message));
}
