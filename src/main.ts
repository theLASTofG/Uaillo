import './style.css';
import type { Board } from '../shared/types.ts';
import { api, DEMO } from './api.ts';
import { renderBoard, setFilter } from './board.ts';
import { refreshCard } from './card-detail.ts';
import { BoardSocket } from './socket.ts';
import { applyActions } from './state.ts';

// Fluxo igual ao do Trello: carga inicial por REST, depois tudo chega pelo socket.
// O cliente não aplica a resposta do REST direto; espera o eco do socket,
// então todas as abas ficam iguais pelo mesmo caminho.

const root = document.getElementById('board')!;
const statusEl = document.getElementById('status')!;
const titleEl = document.getElementById('title')!;
const filterEl = document.getElementById('filter') as HTMLInputElement;

async function start() {
  const [first] = await api.myBoards();
  const board: Board = await api.board(first.id);
  titleEl.textContent = board.name;
  document.title = `${board.name} | Uaillo`;
  renderBoard(root, board);
  filterEl.addEventListener('input', () => setFilter(root, board, filterEl.value));

  const Socket = DEMO ? (await import('./local-backend.ts')).LocalSocket : BoardSocket;
  new Socket(
    board.id,
    () => board.ixLastUpdate,
    (actions) => {
      if (!applyActions(board, actions)) return;
      renderBoard(root, board);
      refreshCard(board, actions);
    },
    (s) => {
      statusEl.textContent = s;
      statusEl.dataset.state = s;
    },
  ).connect();
}

start().catch((e) => (root.textContent = `Erro ao carregar: ${e.message}`));
