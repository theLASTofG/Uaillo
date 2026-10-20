import type { Action, Board, Card, LabelColor } from '../shared/types.ts';
import { api } from './api.ts';
import { h, icon, isEditing } from './dom.ts';

// Verso do cartão (o "card back" do Trello): etiquetas, prazo, descrição,
// checklists e comentários. Como o resto do app, não aplica a resposta do REST;
// espera o eco do socket e redesenha por `refreshCard`.

export const LABEL_NAMES: Record<LabelColor, string> = {
  green: 'verde', yellow: 'amarelo', orange: 'laranja', red: 'vermelho', purple: 'roxo', blue: 'azul',
};

const dialog = h('dialog', { className: 'card-detail' });
document.body.append(dialog);
dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());

let openId: string | null = null;
let comments: Action[] = [];
/** Quadro mais recente que chegou enquanto o render estava adiado. */
let pending: Board | null = null;

dialog.addEventListener('focusout', () => setTimeout(() => pending && refreshCard(pending, [])));
dialog.addEventListener('close', () => (pending = null));

export async function openCard(board: Board, id: string) {
  openId = id;
  comments = [];
  render(board);
  if (!dialog.open) dialog.showModal();
  const fetched = await api.comments(id);
  if (openId !== id) return;
  // Mescla com o que chegou pelo socket durante o GET, sem duplicar.
  addComments(fetched);
  rerender(board);
}

/** Chamado a cada lote de ações do socket. */
export function refreshCard(board: Board, actions: Action[]) {
  if (!openId || !dialog.open) return;
  const card = board.cards.find((c) => c.id === openId);
  if (!card) return dialog.close();
  addComments(actions.filter((a) => a.type === 'commentCard' && a.data.card?.id === openId));
  rerender(board);
}

/** Não apaga o que a pessoa está digitando: adia até o foco sair do campo. */
function rerender(board: Board) {
  if (dialog.contains(document.activeElement) && isEditing(document.activeElement)) {
    pending = board;
    return;
  }
  pending = null;
  render(board);
}

function addComments(list: Action[]) {
  const byId = new Map(comments.map((c) => [c.id, c]));
  for (const c of list) byId.set(c.id, c);
  comments = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function render(board: Board) {
  const card = board.cards.find((c) => c.id === openId);
  if (!card) return;
  const list = board.lists.find((l) => l.id === card.idList);

  const title = h('h2', { contentEditable: 'true', textContent: card.name });
  title.addEventListener('blur', () => {
    const name = title.textContent!.trim();
    if (name && name !== card.name) api.updateCard(card.id, { name });
  });
  title.addEventListener('keydown', (e) => e.key === 'Enter' && (e.preventDefault(), title.blur()));

  dialog.replaceChildren(
    h('header', {},
      h('div', {}, title, h('p', { className: 'muted', textContent: `na lista ${list?.name ?? '?'}` })),
      h('button', { className: 'icon show', title: 'Fechar', autofocus: true, onclick: () => dialog.close() }, icon('x'))),
    labelsSection(board, card),
    dueSection(card),
    descSection(card),
    ...card.checklists.map((cl) => checklistSection(card, cl)),
    nameForm('+ Adicionar checklist', (n) => api.createChecklist(card.id, n)),
    commentsSection(card),
    h('footer', {},
      h('button', { className: 'danger', onclick: () => (api.updateCard(card.id, { closed: true }), dialog.close()) }, icon('chest'), 'Arquivar cartão')),
  );
}

function labelsSection(board: Board, card: Card) {
  const toggle = (id: string) => {
    const idLabels = card.idLabels.includes(id) ? card.idLabels.filter((l) => l !== id) : [...card.idLabels, id];
    api.updateCard(card.id, { idLabels });
  };
  return section('Etiquetas', h('div', { className: 'labels' }, ...board.labels.map((l) =>
    h('button', {
      className: `label label-${l.color}${card.idLabels.includes(l.id) ? ' on' : ''}`,
      title: l.name || LABEL_NAMES[l.color],
      textContent: l.name || LABEL_NAMES[l.color],
      onclick: () => toggle(l.id),
    }))));
}

function dueSection(card: Card) {
  const input = h('input', { type: 'datetime-local', value: card.due ? toLocalInput(card.due) : '' });
  input.addEventListener('change', () => api.updateCard(card.id, { due: input.value ? new Date(input.value).toISOString() : null, dueComplete: false }));
  const done = h('input', { type: 'checkbox', checked: card.dueComplete, disabled: !card.due });
  done.addEventListener('change', () => api.updateCard(card.id, { dueComplete: done.checked }));
  return section('Prazo', h('div', { className: 'row' },
    h('label', { className: 'check' }, done, 'Concluído'),
    input,
    card.due ? h('button', { onclick: () => api.updateCard(card.id, { due: null, dueComplete: false }) }, icon('x'), 'Remover') : ''));
}

function descSection(card: Card) {
  const ta = h('textarea', { value: card.desc, placeholder: 'Adicione uma descrição mais detalhada…', rows: 4 });
  ta.addEventListener('blur', () => ta.value !== card.desc && api.updateCard(card.id, { desc: ta.value }));
  return section('Descrição', ta);
}

function checklistSection(card: Card, cl: Card['checklists'][number]) {
  const done = cl.checkItems.filter((i) => i.state === 'complete').length;
  const pct = cl.checkItems.length ? Math.round((done / cl.checkItems.length) * 100) : 0;
  const items = [...cl.checkItems].sort((a, b) => a.pos - b.pos).map((item) => {
    const box = h('input', { type: 'checkbox', checked: item.state === 'complete' });
    box.addEventListener('change', () => api.updateCheckItem(card.id, item.id, { state: box.checked ? 'complete' : 'incomplete' }));
    return h('li', { className: item.state },
      h('label', { className: 'check' }, box, item.name),
      h('button', { className: 'icon', title: 'Excluir item', onclick: () => api.deleteCheckItem(card.id, item.id) }, icon('skull')));
  });
  return h('section', { className: 'block' },
    h('div', { className: 'row' }, h('h3', { textContent: cl.name }),
      h('button', { onclick: () => confirm(`Excluir "${cl.name}"?`) && api.deleteChecklist(cl.id) }, icon('skull'), 'Excluir')),
    h('div', { className: `progress${pct === 100 ? ' full' : ''}` }, h('span', { textContent: `${pct}%` }), h('div', {}, h('i', { style: `width:${pct}%` }))),
    h('ul', { className: 'checklist' }, ...items),
    nameForm('+ Adicionar item', (n) => api.createCheckItem(cl.id, n)));
}

function commentsSection(card: Card) {
  const list = comments.map((c) => h('li', {},
    h('b', { textContent: c.memberCreator?.fullName ?? 'Alguém' }),
    h('time', { textContent: new Date(c.date).toLocaleString('pt-BR') }),
    h('p', { textContent: c.data.text ?? '' })));
  return section('Comentários',
    nameForm('Escrever um comentário…', (t) => api.addComment(card.id, t)),
    h('ul', { className: 'comments' }, ...list));
}

// ---- utilitários ----

function section(title: string, ...kids: (Node | string)[]) {
  return h('section', { className: 'block' }, h('h3', { textContent: title }), ...kids);
}

function nameForm(placeholder: string, submit: (v: string) => Promise<unknown>, initial = '') {
  const input = h('input', { placeholder, value: initial, autocomplete: 'off' });
  return h('form', {
    className: 'inline-form',
    onsubmit: (e: SubmitEvent) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      input.value = '';
      input.blur();
      submit(v).catch((err) => alert(err.message));
    },
  }, input);
}

/** ISO -> valor aceito por <input type="datetime-local"> no fuso local. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
