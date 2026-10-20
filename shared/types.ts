// Modelos e mensagens compartilhados entre cliente e servidor.
// Os nomes seguem o que foi observado no Trello (idList, pos, ixLastUpdate, reqid).

export interface Card {
  id: string;
  idBoard: string;
  idList: string;
  name: string;
  desc: string;
  pos: number;
  closed: boolean;
  /** Ids das etiquetas do quadro aplicadas ao cartão. */
  idLabels: string[];
  /** Prazo em ISO 8601, ou null. */
  due: string | null;
  dueComplete: boolean;
  checklists: Checklist[];
  /** Contadores mostrados na frente do cartão, como `badges` do Trello. */
  badges: { comments: number };
}

export interface CheckItem {
  id: string;
  name: string;
  state: 'complete' | 'incomplete';
  pos: number;
}

export interface Checklist {
  id: string;
  name: string;
  checkItems: CheckItem[];
}

export type LabelColor = 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue';

export interface Label {
  id: string;
  idBoard: string;
  name: string;
  color: LabelColor;
}

export interface List {
  id: string;
  idBoard: string;
  name: string;
  pos: number;
  closed: boolean;
}

export interface Board {
  id: string;
  name: string;
  ixLastUpdate: number;
  labels: Label[];
  lists: List[];
  cards: Card[];
}

export type ActionType = 'createCard' | 'updateCard' | 'deleteCard' | 'createList' | 'updateList' | 'commentCard';

/** Registro de uma mudança. Equivale às "actions" do Trello. */
export interface Action {
  id: string;
  type: ActionType;
  idBoard: string;
  ixUpdate: number;
  date: string;
  data: { card?: Card; list?: List; idDeleted?: string; text?: string };
  /** Autor (fixo enquanto não há login). */
  memberCreator?: { fullName: string };
}

// ---- Protocolo do socket (/1/Session/socket) ----

export type ClientMessage =
  | { type: 'ping'; reqid: number }
  | { type: 'subscribe'; modelType: 'Board'; idModel: string; tags: string[]; ixLastUpdate?: number; reqid: number }
  | { type: 'unsubscribe'; modelType: 'Board'; idModel: string; reqid: number };

export type ServerMessage =
  | { reqid: number; result: unknown }
  | { reqid: number; error: string }
  | { notify: { event: 'updateModels'; typeName: 'Board'; idModel: string; actions: Action[] } };

/** Códigos de fechamento próprios, como os vistos no cliente do Trello. */
export const CloseCode = {
  /** Assinatura inválida (quadro inexistente). */
  InvalidModel: 4001,
  /** Cliente ficou sem responder ao ping. */
  PingTimeout: 4002,
} as const;
