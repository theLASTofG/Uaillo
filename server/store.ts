import type { Action, ActionType, Board, Card, CheckItem, Checklist, Label, LabelColor, List } from '../shared/types.ts';

// Estado em memória, salvo a cada mudança pelo `Persistence` recebido
// (arquivo JSON no servidor, localStorage no modo demo do GitHub Pages).
// Cada quadro guarda um contador `ixLastUpdate` e o histórico de ações,
// que o socket usa para ressincronizar clientes que caíram.

export interface Db {
  boards: Record<string, Omit<Board, 'labels' | 'lists' | 'cards'>>;
  labels: Record<string, Label>;
  lists: Record<string, List>;
  cards: Record<string, Card>;
  /** Buffer de sincronização: podado em MAX_ACTIONS, serve só para ressincronizar. */
  actions: Action[];
  /** Comentários por cartão. Persistentes; nunca são podados com `actions`. */
  comments: Record<string, Action[]>;
}

type CardPatch = Partial<Pick<Card, 'name' | 'desc' | 'idList' | 'pos' | 'closed' | 'idLabels' | 'due' | 'dueComplete'>>;

/** Espaçamento padrão entre posições, igual ao Trello (65535). */
export const POS_STEP = 65535;
const MAX_ACTIONS = 2000;

/** Id de 24 hex, no formato dos ObjectIds do Trello. Usa Web Crypto (Node e navegador). */
export const newId = () => [...globalThis.crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Onde o banco é lido e gravado. */
export interface Persistence {
  load(): Db | null;
  save(db: Db): void;
}

type Listener = (action: Action) => void;

export class Store {
  private db: Db;
  private listeners = new Set<Listener>();

  constructor(private persist: Persistence) {
    const saved = persist.load();
    this.db = saved ? migrate(saved) : seed();
    this.save();
  }

  /** Relê o banco (outra aba gravou no mesmo localStorage). */
  reload() {
    const saved = this.persist.load();
    if (saved) this.db = migrate(saved);
  }

  onAction(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  boardIds() {
    return Object.keys(this.db.boards);
  }

  getBoard(id: string): Board | undefined {
    const b = this.db.boards[id];
    if (!b) return;
    const byPos = <T extends { pos: number }>(a: T, z: T) => a.pos - z.pos;
    return {
      ...b,
      labels: Object.values(this.db.labels).filter((l) => l.idBoard === id),
      lists: Object.values(this.db.lists).filter((l) => l.idBoard === id && !l.closed).sort(byPos),
      cards: Object.values(this.db.cards).filter((c) => c.idBoard === id && !c.closed).sort(byPos),
    };
  }

  getCard(id: string) {
    return this.db.cards[id];
  }

  getList(id: string) {
    return this.db.lists[id];
  }

  /** Ações do quadro com ixUpdate maior que `since`, para ressincronizar. */
  actionsSince(idBoard: string, since: number) {
    return this.db.actions.filter((a) => a.idBoard === idBoard && a.ixUpdate > since);
  }

  createCard(idList: string, name: string, pos?: number): Card {
    const list = this.db.lists[idList];
    if (!list) throw new HttpError(404, 'list not found');
    const card: Card = {
      id: newId(),
      idBoard: list.idBoard,
      idList,
      name,
      desc: '',
      pos: pos ?? this.bottomPos(Object.values(this.db.cards).filter((c) => c.idList === idList)),
      ...cardDefaults(),
    };
    this.db.cards[card.id] = card;
    this.record('createCard', card.idBoard, { card });
    return card;
  }

  updateCard(id: string, raw: Record<string, unknown>): Card {
    const card = this.card(id);
    Object.assign(card, this.validCardPatch(card, raw));
    this.record('updateCard', card.idBoard, { card });
    return card;
  }

  /** Confere tipo de cada campo antes de tocar no cartão; erro vira HTTP 400. */
  private validCardPatch(card: Card, raw: Record<string, unknown>): CardPatch {
    const bad = (field: string): never => { throw new HttpError(400, `invalid ${field}`); };
    const patch: CardPatch = {};
    if (raw.name !== undefined) patch.name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : bad('name');
    if (raw.desc !== undefined) patch.desc = typeof raw.desc === 'string' ? raw.desc : bad('desc');
    if (raw.idList !== undefined) patch.idList = typeof raw.idList === 'string' && this.db.lists[raw.idList]?.idBoard === card.idBoard ? raw.idList : bad('idList');
    if (raw.pos !== undefined) patch.pos = typeof raw.pos === 'number' && Number.isFinite(raw.pos) ? raw.pos : bad('pos');
    if (raw.closed !== undefined) patch.closed = typeof raw.closed === 'boolean' ? raw.closed : bad('closed');
    if (raw.dueComplete !== undefined) patch.dueComplete = typeof raw.dueComplete === 'boolean' ? raw.dueComplete : bad('dueComplete');
    if (raw.due !== undefined) {
      patch.due = raw.due === null ? null : typeof raw.due === 'string' && !Number.isNaN(Date.parse(raw.due)) ? new Date(raw.due).toISOString() : bad('due');
    }
    if (raw.idLabels !== undefined) {
      if (!Array.isArray(raw.idLabels)) bad('idLabels');
      const ids = [...new Set(raw.idLabels as unknown[])];
      if (ids.some((l) => typeof l !== 'string' || this.db.labels[l]?.idBoard !== card.idBoard)) bad('idLabels');
      patch.idLabels = ids as string[];
    }
    return patch;
  }

  // ---- checklists (rotas /1/cards/:id/checklists e /1/checklists/:id/checkItems) ----

  createChecklist(idCard: string, name: string): Checklist {
    const card = this.card(idCard);
    const checklist: Checklist = { id: newId(), name, checkItems: [] };
    card.checklists.push(checklist);
    this.record('updateCard', card.idBoard, { card });
    return checklist;
  }

  deleteChecklist(idChecklist: string) {
    const { card } = this.checklist(idChecklist);
    card.checklists = card.checklists.filter((c) => c.id !== idChecklist);
    this.record('updateCard', card.idBoard, { card });
  }

  createCheckItem(idChecklist: string, name: string): CheckItem {
    const { card, checklist } = this.checklist(idChecklist);
    const item: CheckItem = { id: newId(), name, state: 'incomplete', pos: this.bottomPos(checklist.checkItems) };
    checklist.checkItems.push(item);
    this.record('updateCard', card.idBoard, { card });
    return item;
  }

  updateCheckItem(idCard: string, idCheckItem: string, patch: Partial<Pick<CheckItem, 'name' | 'state'>>): CheckItem {
    const card = this.card(idCard);
    const item = card.checklists.flatMap((c) => c.checkItems).find((i) => i.id === idCheckItem);
    if (!item) throw new HttpError(404, 'checkItem not found');
    if (patch.state && patch.state !== 'complete' && patch.state !== 'incomplete') throw new HttpError(400, 'invalid state');
    Object.assign(item, patch);
    this.record('updateCard', card.idBoard, { card });
    return item;
  }

  deleteCheckItem(idCard: string, idCheckItem: string) {
    const card = this.card(idCard);
    for (const c of card.checklists) c.checkItems = c.checkItems.filter((i) => i.id !== idCheckItem);
    this.record('updateCard', card.idBoard, { card });
  }

  // ---- comentários (ação commentCard, como no Trello) ----

  addComment(idCard: string, text: string): Action {
    const card = this.card(idCard);
    const list = (this.db.comments[idCard] ??= []);
    card.badges.comments = list.length + 1;
    // record() guarda a ação em `comments` antes de salvar e avisar o socket.
    return this.record('commentCard', card.idBoard, { card, text });
  }

  comments(idCard: string): Action[] {
    this.card(idCard);
    return [...(this.db.comments[idCard] ?? [])].reverse();
  }

  deleteCard(id: string) {
    const card = this.db.cards[id];
    if (!card) throw new HttpError(404, 'card not found');
    delete this.db.cards[id];
    delete this.db.comments[id];
    this.record('deleteCard', card.idBoard, { idDeleted: id });
  }

  createList(idBoard: string, name: string): List {
    if (!this.db.boards[idBoard]) throw new HttpError(404, 'board not found');
    const list: List = {
      id: newId(),
      idBoard,
      name,
      pos: this.bottomPos(Object.values(this.db.lists).filter((l) => l.idBoard === idBoard)),
      closed: false,
    };
    this.db.lists[list.id] = list;
    this.record('createList', idBoard, { list });
    return list;
  }

  updateList(id: string, patch: Partial<Pick<List, 'name' | 'pos' | 'closed'>>): List {
    const list = this.db.lists[id];
    if (!list) throw new HttpError(404, 'list not found');
    Object.assign(list, patch);
    this.record('updateList', list.idBoard, { list });
    return list;
  }

  private card(id: string) {
    const card = this.db.cards[id];
    if (!card) throw new HttpError(404, 'card not found');
    return card;
  }

  private checklist(id: string) {
    for (const card of Object.values(this.db.cards)) {
      const checklist = card.checklists.find((c) => c.id === id);
      if (checklist) return { card, checklist };
    }
    throw new HttpError(404, 'checklist not found');
  }

  private bottomPos(items: { pos: number }[]) {
    return items.reduce((m, i) => Math.max(m, i.pos), 0) + POS_STEP;
  }

  private record(type: ActionType, idBoard: string, data: Action['data']) {
    const board = this.db.boards[idBoard];
    board.ixLastUpdate++;
    const action: Action = {
      id: newId(),
      type,
      idBoard,
      ixUpdate: board.ixLastUpdate,
      date: new Date().toISOString(),
      data: structuredClone(data),
      ...(type === 'commentCard' ? { memberCreator: { fullName: 'Você' } } : {}),
    };
    if (type === 'commentCard') (this.db.comments[data.card!.id] ??= []).push(action);
    this.db.actions.push(action);
    if (this.db.actions.length > MAX_ACTIONS) this.db.actions.splice(0, this.db.actions.length - MAX_ACTIONS);
    this.save();
    for (const fn of this.listeners) fn(action);
    return action;
  }

  private save() {
    this.persist.save(this.db);
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** As seis cores padrão que o Trello cria em todo quadro novo. */
const DEFAULT_LABELS: LabelColor[] = ['green', 'yellow', 'orange', 'red', 'purple', 'blue'];

const cardDefaults = () => ({ closed: false, idLabels: [], due: null, dueComplete: false, checklists: [], badges: { comments: 0 } });

function defaultLabels(idBoard: string): Record<string, Label> {
  return Object.fromEntries(DEFAULT_LABELS.map((color) => {
    const id = newId();
    return [id, { id, idBoard, name: '', color }];
  }));
}

/** Completa um db.json salvo antes das etiquetas e checklists existirem. */
function migrate(db: Db): Db {
  db.labels ??= {};
  // Comentários antigos viviam só em `actions`; copia para a coleção própria.
  db.comments ??= {};
  for (const a of db.actions) {
    const id = a.type === 'commentCard' ? a.data.card?.id : undefined;
    if (id && !(db.comments[id] ??= []).some((c) => c.id === a.id)) db.comments[id].push(a);
  }
  for (const id of Object.keys(db.boards)) {
    if (!Object.values(db.labels).some((l) => l.idBoard === id)) Object.assign(db.labels, defaultLabels(id));
  }
  for (const c of Object.values(db.cards)) {
    Object.assign(c, { ...cardDefaults(), ...c });
    c.badges = { ...c.badges, comments: db.comments[c.id]?.length ?? 0 };
  }
  return db;
}

function seed(): Db {
  const idBoard = newId();
  const db: Db = { boards: { [idBoard]: { id: idBoard, name: 'Quadro Uaillo', ixLastUpdate: 0 } }, labels: defaultLabels(idBoard), lists: {}, cards: {}, actions: [], comments: {} };
  const lists = { 'A fazer': ['Ler o resumo da engenharia reversa', 'Testar o arrastar'], Fazendo: ['Montar o socket'], Feito: [] as string[] };
  Object.entries(lists).forEach(([name, cards], i) => {
    const id = newId();
    db.lists[id] = { id, idBoard, name, pos: (i + 1) * POS_STEP, closed: false };
    cards.forEach((cardName, j) => {
      const idCard = newId();
      db.cards[idCard] = { id: idCard, idBoard, idList: id, name: cardName, desc: '', pos: (j + 1) * POS_STEP, ...cardDefaults() };
    });
  });
  return db;
}
