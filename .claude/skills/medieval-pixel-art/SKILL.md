---
name: medieval-pixel-art
description: Direção de arte e regras técnicas do tema Medieval Pixel Art (Dark Dungeon / Mural de Guilda Noturna) do Uaillo. Use ao criar ou alterar qualquer visual do app — CSS, ícones, molduras, cenário, animações, novos componentes — ou quando pedirem "pixel art", "medieval", "RPG 16-bit", "masmorra", "taverna" ou para "enriquecer o visual".
---

# Medieval Pixel Art (Uaillo)

Tema: um **mural de guilda pendurado numa masmorra à noite**. As listas são placas de madeira queimada presas por ferro, os cartões são tabuletas de ardósia, o verso do cartão é uma caixa de diálogo de RPG 16-bit, e ao fundo há um céu estrelado com um castelo de janelas acesas. Tudo é pixelado, com sombra sólida e luz quente de tocha.

A lógica do app (REST, socket, drag-and-drop, guarda de foco) **nunca** muda por causa do tema. Mudanças visuais ficam em `src/style.css`, `tools/gen-theme.py`, nos ícones de `src/dom.ts` e, no máximo, em classes/atributos extras no DOM.

## Onde as coisas moram

| Arquivo | O que tem |
|---|---|
| `tools/gen-theme.py` | **Fonte do tema.** Gera `src/style.css` com os SVGs em data-URI (cenário, pedra, molduras 9-slice, cursor, enfeites). Edite aqui e rode `python tools/gen-theme.py`. Nunca edite os data-URIs do CSS gerado à mão. |
| `src/style.css` | Saída gerada. Pode ser lida, não editada. |
| `src/dom.ts` | `icon(name)`: ícones 16×16 desenhados como grade de caracteres + `PALETTE`. |
| `index.html` | Fontes do Google Fonts (`Silkscreen` + `Pixelify Sans`). |

## Regras de pixel (não negociáveis)

1. **Grade inteira.** Desenhe em unidades e escale por inteiros: ícones 16×16 exibidos a 16px ou 32px (nunca 24px), molduras de 3 unidades a 6px ou 9px (2× ou 3×). Escala fracionária borra os pixels.
2. **`shape-rendering="crispEdges"`** em todo SVG e `image-rendering: pixelated` no `body`.
3. **Sem `border-radius`.** Cantos são em degrau: moldura 9-slice (`border-image`) com o pixel do canto transparente, ou `clip-path` em degraus (só onde não há sombra externa, porque `clip-path` corta `box-shadow`).
4. **Sombra sólida, sem blur:** `box-shadow: 4px 4px 0 #000` (cartões), `6px 6px 0 #000` (listas), `8px 8px 0 #000` (modal). Blur só existe na luz difusa de tocha do fundo (gradientes radiais), nunca em objetos.
5. **Relevo por `inset`:** luz em cima/esquerda (`inset 2px 2px 0 <claro>`), sombra embaixo/direita (`inset -2px -2px 0 <escuro>`). Pressionado inverte e desce `translateY(2px)`.
6. **Nada de `filter` em `.card` ou ancestrais dos cartões** (inclui `drop-shadow`, `blur`). Deixa o arrastar lento. Hover dos cartões troca `border-image-source`, não aplica filtro.
7. **Animação em degraus:** `steps(n)` ou keyframes com poucos quadros (2–4). Nada de easing suave em objetos pixelados. Toda animação dentro de `@media (prefers-reduced-motion: no-preference)`.
8. **Gradiente só em luz** (tochas, vinheta, céu em faixas). Superfícies usam faixas chapadas (`linear-gradient` com paradas duras: `#a 0 3px, #b 3px 9px`).

## Paleta

Use os tokens de `:root`; cores novas entram como token, não soltas.

| Papel | Token | Hex |
|---|---|---|
| Texto (pergaminho claro) | `--ink` | `#e9dcc0` |
| Texto secundário | `--ink-muted` | `#a8977a` |
| Ouro velho (títulos, foco, hover) | `--gold` / `--gold-dark` | `#e2b553` / `#6d4810` |
| Tabuleta (campos) | `--tablet` | `#15100b` |
| Ardósia (cartão) | `--slate` / `--slate-hover` | `#24202b` / `#2e2836` |
| Esmeralda (ok, online, 100%) | `--emerald` | `#3fbf73` |
| Âmbar (atenção, conectando, janelas) | `--amber` | `#f0a830` |
| Rubi (erro, offline, vencido) | `--ruby` | `#d8434a` |
| Madeira | — | `#2b190d` → `#4a2c14` → `#8a5a30` |
| Ferro | — | `#24262c` / `#454852` / `#7d818b` |
| Noite (céu) | — | `#080714` → `#191536` |

**Gemas das etiquetas** (`--c` base, `--c-hi` brilho): green `#2f9e5b/#6fdc95`, yellow `#d9a62e/#ffe07a`, orange `#c9662a/#f7a35c`, red `#b02f3a/#ef6b72`, purple `#7f45b5/#c08cf0`, blue `#2c66b8/#6fa7ff`.

**Contraste:** texto de leitura sempre `--ink` sobre fundo ≤ `#2e2836`, ou `#2a1a0a` sobre pergaminho (`#e3cc98`). O centro do cenário é escurecido por vinheta justamente para os cartões lerem bem; não clareie o meio da tela.

## Tipografia

- **Display** `var(--font-display)` = `Silkscreen`: logo, títulos de lista, `h2/h3` do modal, botões, selos de estado, porcentagens. Tamanhos 10–20px, sempre `text-shadow: 2px 2px 0 #000` (sólido). Caixa alta só em botões e rótulos pequenos.
- **Leitura** `var(--font-body)` = `Pixelify Sans`: cartões, campos, descrição, comentários. 15–18px.
- Nunca use pesos intermediários sintéticos; Silkscreen tem 400/700, Pixelify 400–700.

## Componentes

| Componente | Material | Como |
|---|---|---|
| `.top` | Viga de madeira com cintas de ferro | faixas de madeira + `border-top/bottom` de ferro + tochas animadas nas pontas |
| `.logo` | Placa de ouro com brasão | moldura 9-slice dourada + ícone de escudo |
| `#status` | Orbe/cristal | `::before` com `clip-path` em degrau; esmeralda/âmbar/rubi por `data-state` |
| `.list` | Madeira queimada + ferro batido | moldura `--frame-iron`, veios por `repeating-linear-gradient`, rebites no header, flâmula da cor da lista |
| `.card` | Ardósia com prego | moldura `--frame-slate`, hover `--frame-gold`, prego pixel no topo |
| `.cards.drop-target` | Área de soltar | contorno tracejado dourado em pixel |
| `.card-detail` | Caixa de diálogo RPG | moldura dupla (ouro 9-slice + anel de ferro inset), enfeites dourados nos cantos |
| botões | Madeira em relevo | `inset` claro/escuro + contorno preto + clique `translateY(2px)` |
| `input/textarea` | Tabuleta escura | `inset 2px 2px 0 #000`, foco `outline: 2px solid var(--gold)` |
| `.chip` / `.label` | Fita de estandarte | `clip-path` com V na ponta, cor de gema |
| `.progress` | Barra de XP | trilho de ferro, preenchimento ouro segmentado (`repeating-linear-gradient`), esmeralda em 100% |
| comentários | Pergaminho | fundo `#e3cc98`, texto `#2a1a0a`, relevo inset |

## Ícones

Grade 16×16 em `src/dom.ts`, uma string por linha, uma letra por cor de `PALETTE`, `.` transparente:

```ts
skull: [
  '................',
  '....kkkkkkkk....',
  '...kwwwwwwwwk...',
  // ...16 linhas
],
```

- Contorno `k` (quase preto) em volta de tudo; 1 tom claro + 1 escuro por material, no máximo.
- Luz vem de cima à esquerda: ponha o tom claro nesses lados.
- Silhueta legível a 16px: teste olhando o ícone pequeno antes de detalhar.
- Use `icon('nome')` como filho de `h(...)`; nunca emoji ou caractere Unicode como ícone.
- Ícones atuais: `hourglass` (prazo), `scroll` (descrição), `shield` (checklist), `quill` (comentários), `x` (fechar), `skull` (excluir), `chest` (arquivar).
- Sprites decorativos que vivem só no CSS (desenhados com a mesma grade de caracteres pela função `sprite()` do gerador): brasão do logo, tochas em 2 quadros, cursores espada/manopla, prego do cartão, filigrana dos cantos do modal, brasas.

## Cenário (gerado em `tools/gen-theme.py`)

Camadas do `body`, de trás para frente:
1. Céu noturno em faixas chapadas (`viewBox 320×180`, `preserveAspectRatio xMidYMax slice`), lua, montanhas em dois planos, castelo com janelas âmbar.
2. Estrelas cintilando (camada fixa `html::before`, opacidade em `steps`).
3. Faixa de pedra de masmorra na base (`repeat-x`, tile 32 unidades a 64px).
4. Luz de tocha nas laterais (`radial-gradient` âmbar ~25%), tochas de parede animadas (`html::after`, troca de quadro com `steps(1)`) e brasas subindo (`body::after`, com máscara para sumirem no alto). `.top` e `#board` ficam em `z-index: 1` acima dessas camadas, e todas têm `pointer-events: none`.
5. Vinheta escura no centro para contraste.

Para adicionar um elemento ao cenário, desenhe com `<rect>` inteiros no `scene` do gerador; prefira poucos retângulos grandes a muitos pequenos.

## Checklist antes de entregar

- [ ] Nenhum `border-radius`, `filter` em cartões ou sombra com blur em objeto.
- [ ] Ícones e molduras em escala inteira (16/32px, 6/9px).
- [ ] Animações em `steps()` e dentro de `prefers-reduced-motion: no-preference`.
- [ ] Texto de leitura legível sobre o fundo (centro escuro preservado).
- [ ] `python tools/gen-theme.py` rodado, `npx tsc --noEmit` ok.
- [ ] Testado no navegador: quadro, hover de cartão, arrastar, modal, checklist 0%/50%/100%, filtro.
