# Engenharia reversa do Trello (web) — resumo

Ferramentas: REA CLI 6.5.0 (`analyze-javascript-application`) + REA MCP (`list_browser_targets`, `capture_browser_scenario`) conectado a um Chrome com perfil separado e CDP em 127.0.0.1:9222. Alvo: quadro modelo público "Kanban Quadro Modelo" com a conta do usuário logada. Nenhum dado foi alterado.

## Observado (captura ao vivo, 12 s, build `build-242085`)
- Dois WebSockets abrem ao entrar no quadro:
  1. `wss://trello.com/1/Session/socket?clientVersion=…&x-b3-traceid=…&x-b3-spanid=…`
  2. `wss://trello.com/gateway/api/graphql/subscriptions?x-b3-traceid=…&x-b3-spanid=…`
- Socket legado (RPC próprio, com `reqid`):
  - `{"type":"ping","reqid":0}` -> `{"reqid":0,"result":true}`
  - `{"type":"subscribe","modelType":"Member","idModel":<oid>,"tags":["updates"],"invitationTokens":[],"reqid":1}`
  - o mesmo para `Board` (tag `clientActions`) e `Organization` (tag `allActions`)
  - resposta: `{"reqid":N,"result":<número>}` (o número é a marca de última atualização do modelo, usada para ressincronizar)
- Socket GraphQL (protocolo graphql-ws): `connection_init` -> `connection_ack`, depois `subscribe` com `operationName` e `extensions.trello.traceId`. Operações vistas: `TrelloMemberUpdated`, `TrelloBoardUpdated`, `TrelloBoardPlannerEventCards`, `TrelloInboxUpdated`. Respostas `next` trazem `extensions.tags` (`self_updates`, `public_updates`) e metadados `agg` (canal, id de operação, `schema: "central"`).
- Carga inicial do quadro por REST: `GET /1/board/{id}` com listas de campos e expansões (`cards=visible`, `lists=open`, `labels`, `members`, `customFields`, `pluginData`) e `GET /1/batch`, mais `POST /gateway/api/graphql`.

## Inferido (análise estática dos bundles)
- SPA em React com Apollo e Immer; divisão por rota (`board-route`, `board-list-view`, `card-composer`, `inbox-container`).
- Cliente de socket com reconexão limitada (limite diário de 200 falhas), timeout de ping de 24 s, ressincronização por `ixLastUpdate`, códigos de fechamento próprios (4001, 4002, 4501, 4502, 4509).
- Há também subscribe GraphQL via HTTP (`/subscribe?token=`).
- Drag-and-drop: nenhuma biblioteca conhecida encontrada; há uso intenso dos eventos nativos `dragstart`/`dragover`/`dragend`. Mecanismo exato não confirmado.

## Documentação pública (confiável)
- API REST `https://api.trello.com/1/`; OAuth 2.0 (Bearer) ou chave + token.
- Limites: 300 req/10 s por chave, 100 req/10 s por token, `/1/members` 100 req/900 s. HTTP 429 com `API_TOKEN_LIMIT_EXCEEDED` ou `API_KEY_LIMIT_EXCEEDED`.
- Webhooks: criação com `callbackURL` + `idModel`, assinatura HMAC-SHA1 em `X-Trello-Webhook`, 3 retentativas (30, 60, 120 s).
- Power-Ups: 18 capacidades (`card-buttons`, `card-badges`, `board-buttons`, `attachment-sections`, …), conector via `TrelloPowerUp.initialize()`.

## Lacunas
- Não capturei mensagens `next` com ações reais de edição (mover/criar cartão), porque o REA não tem ação de arrastar e eu não alterei dados.
- Cobertura do grafo estático é parcial (limite de orçamento do REA em vários arquivos).
- Evidência da captura: `ev_…` retornada pelo REA; arquivo bruto em `tool-results/mcp-rea-capture_browser_scenario-1792249988513.txt` (contém dados do quadro modelo; não compartilhe sem revisar).

## Rodada 2 (19/10): funcionalidades a partir da documentação pública
Fonte: documentação pública da API REST do Trello (grupo Cards) e referências de terceiros. Não houve nova captura com o REA nesta rodada; a evidência da rodada 1 não estava mais retida na sessão.

Implementado no Uaillo, com os nomes de campo e rotas da API pública:
- Etiquetas: `Board.labels` com as 6 cores padrão; `Card.idLabels` via `PUT /1/cards/:id`.
- Prazo: `due` + `dueComplete`; selo na frente do cartão (vencido, vence em 24 h, concluído).
- Checklists: `POST /1/cards/:id/checklists`, `POST /1/checklists/:id/checkItems`, `PUT|DELETE /1/cards/:id/checkItem/:idItem` (`state: complete|incomplete`).
- Comentários: ação `commentCard`, `POST /1/cards/:id/actions/comments`, `GET /1/cards/:id/actions`; contador em `badges.comments`.
- Verso do cartão (modal) com descrição, etiquetas, prazo, checklists, comentários e arquivar.
- Filtro de cartões no topo (nome ou etiqueta), feito só no cliente.

Decisões próprias (não observadas no Trello): checklists ficam embutidas no cartão e cada mudança sai como `updateCard`; autor dos comentários é fixo ("Você") porque não há login.

Lacunas: formato real das mensagens do socket para checklist e comentário continua não observado; criar/renomear etiquetas, membros, anexos e capas ainda não existem.
