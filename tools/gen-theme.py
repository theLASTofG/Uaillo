"""Gera src/style.css do tema Medieval Pixel Art.

Todos os SVGs (cenário, pedra, molduras 9-slice, tochas, cursor, enfeites)
saem daqui como data-URI. Edite este arquivo e rode:

    python tools/gen-theme.py

Regras do tema: .claude/skills/medieval-pixel-art/SKILL.md
"""
import os, random
from pathlib import Path
from urllib.parse import quote
os.chdir(Path(__file__).resolve().parent.parent)


def pixels(rows, pal, w=None):
    """Grade de caracteres -> <rect> por trecho contínuo da mesma cor ('.' = transparente)."""
    out = []
    for y, row in enumerate(rows):
        x = 0
        while x < len(row):
            c = row[x]
            end = x + 1
            while end < len(row) and row[end] == c:
                end += 1
            if c in pal:
                out.append(f"<rect x='{x}' y='{y}' width='{end - x}' height='1' fill='{pal[c]}'/>")
            x = end
    return ''.join(out)


def sprite(rows, pal):
    w, h = max(len(r) for r in rows), len(rows)
    return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' width='{w}' height='{h}' shape-rendering='crispEdges'>{pixels(rows, pal)}</svg>"

def uri(svg):
    return 'url("data:image/svg+xml,' + quote(svg, safe=" =:/,;'()-.") + '")'

# ---------- cenário noturno (320x180 unidades) ----------
random.seed(7)
stars = ''.join(f"<rect x='{random.randrange(0,320)}' y='{random.randrange(0,95)}' width='1' height='1' fill='{random.choice(['#f4ecd0','#c9c3e8','#8f8ab8'])}'/>" for _ in range(90))
big = ''.join(f"<rect x='{x}' y='{y}' width='2' height='2' fill='#fff6d8'/><rect x='{x-1}' y='{y}' width='4' height='1' fill='#fff6d8' opacity='.35'/>" for x, y in [(40,18),(118,40),(196,12),(288,58),(70,66)])
# janelas acesas do castelo
wins = ''.join(f"<rect x='{x}' y='{y}' width='2' height='3' fill='#ffb347'/>" for x, y in
               [(214,92),(222,92),(214,102),(240,80),(240,90),(258,96),(266,96),(258,106),(232,108),(250,114)])
scene = f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180' preserveAspectRatio='xMidYMax slice' shape-rendering='crispEdges'>
<rect width='320' height='180' fill='#080714'/>
<rect y='50' width='320' height='40' fill='#0c0a20'/>
<rect y='90' width='320' height='30' fill='#120f2c'/>
<rect y='120' width='320' height='60' fill='#191536'/>
{stars}{big}
<rect x='262' y='20' width='14' height='14' fill='#e9e1bf'/><rect x='260' y='22' width='18' height='10' fill='#e9e1bf'/>
<rect x='268' y='24' width='3' height='3' fill='#c9c0a0'/><rect x='264' y='29' width='2' height='2' fill='#c9c0a0'/>
<polygon points='0,140 20,124 34,132 56,108 74,122 92,112 118,130 140,118 160,134 190,120 210,128 240,112 272,126 300,110 320,122 320,180 0,180' fill='#1d1838'/>
<polygon points='0,152 30,138 52,146 84,130 110,144 136,136 170,150 200,138 230,148 262,134 290,146 320,138 320,180 0,180' fill='#130f26'/>
<rect x='196' y='120' width='96' height='40' fill='#0d0a1a'/>
<rect x='206' y='86' width='26' height='40' fill='#0d0a1a'/><rect x='204' y='82' width='4' height='4' fill='#0d0a1a'/><rect x='212' y='82' width='4' height='4' fill='#0d0a1a'/><rect x='220' y='82' width='4' height='4' fill='#0d0a1a'/><rect x='228' y='82' width='4' height='4' fill='#0d0a1a'/>
<rect x='236' y='70' width='12' height='56' fill='#0d0a1a'/><rect x='238' y='62' width='8' height='8' fill='#0d0a1a'/><rect x='241' y='54' width='2' height='8' fill='#0d0a1a'/><rect x='243' y='54' width='6' height='3' fill='#7a2a2a'/>
<rect x='252' y='92' width='22' height='34' fill='#0d0a1a'/><rect x='250' y='88' width='4' height='4' fill='#0d0a1a'/><rect x='258' y='88' width='4' height='4' fill='#0d0a1a'/><rect x='266' y='88' width='4' height='4' fill='#0d0a1a'/><rect x='272' y='88' width='4' height='4' fill='#0d0a1a'/>
<rect x='228' y='104' width='30' height='20' fill='#0d0a1a'/>
{wins}
<polygon points='0,164 40,154 80,160 120,150 160,158 200,150 240,158 280,152 320,160 320,180 0,180' fill='#07050f'/>
</svg>"""

# ---------- pedra de masmorra (tile 32x32) ----------
stone = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' shape-rendering='crispEdges'>
<rect width='32' height='32' fill='#16131c'/>
<rect x='1' y='1' width='14' height='14' fill='#221d2a'/><rect x='17' y='1' width='14' height='14' fill='#1f1a27'/>
<rect x='-7' y='17' width='14' height='14' fill='#1f1a27'/><rect x='9' y='17' width='14' height='14' fill='#241f2c'/><rect x='25' y='17' width='14' height='14' fill='#221d2a'/>
<rect x='1' y='1' width='14' height='1' fill='#2e2838'/><rect x='17' y='1' width='14' height='1' fill='#2b2534'/>
<rect x='9' y='17' width='14' height='1' fill='#302a3a'/><rect x='0' y='17' width='7' height='1' fill='#2b2534'/><rect x='25' y='17' width='7' height='1' fill='#2e2838'/>
<rect x='5' y='6' width='2' height='1' fill='#16131c'/><rect x='22' y='9' width='1' height='2' fill='#16131c'/><rect x='14' y='24' width='3' height='1' fill='#16131c'/>
</svg>"""

# ---------- moldura 9-slice pixelada (9x9, slice 3) ----------
FRAME = ['.kkkkkkk.', 'kLLLLLLLk', 'kLMMMMMDk', 'kLM...MDk', 'kLM...MDk', 'kLM...MDk', 'kLMMMMMDk', 'kMDDDDDDk', '.kkkkkkk.']
def frame(L, M, D, k='#050406'):
    pal = {'k': k, 'L': L, 'M': M, 'D': D}
    rects = ''.join(f"<rect x='{x}' y='{y}' width='1' height='1' fill='{pal[c]}'/>" for y, row in enumerate(FRAME) for x, c in enumerate(row) if c in pal)
    return uri(f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'>{rects}</svg>")

# ---------- sprites extras ----------
SP = {'k': '#140c06', 'g': '#b8862b', 'G': '#f2d27a', 'w': '#efe6d2', 'i': '#c9c1b0', 'I': '#6b6f78',
      'b': '#6e4220', 'B': '#3a2210', 'r': '#9b2f2a', 'y': '#ffe07a', 'o': '#f0a830', 'R': '#e0502a'}

# tocha de parede em 2 quadros (12x24); a chama alterna entre eles com steps()
TORCH_BASE = [
    '....kkkk....', '...kbbbbk...', '...kbBBbk...', '....kbbk....', '....kbbk....', '....kbBk....',
    '....kbbk....', '..kkkiikkk..', '..kiiIIiik..', '...kkiikk...', '.....kk.....',
]
FLAME_A = ['.....k......', '....kyk.....', '...kyyok....', '...kyook.k..', '..kyyoRkkok.', '..kyooRRook.',
           '..koooRRok..', '...kooRRk...', '...kkRRkk...', '....kkkk....', '............', '............', '............']
FLAME_B = ['......k.....', '.....kyk....', '....koyyk...', '..k.kooyk...', '.kokRoyyk...', '.kooRRooyk..',
           '..koRRoook..', '...kRRook...', '...kkRRkk...', '....kkkk....', '............', '............', '............']
torch_a = sprite(FLAME_A[:10] + TORCH_BASE + ['............'] * 3, SP)
torch_b = sprite(FLAME_B[:10] + TORCH_BASE + ['............'] * 3, SP)

# brasão do logo (14x16)
crest = sprite([
    '..kkkkkkkkkk..', '.kGGGGGGGGGGk.', '.kGggggggggGk.', '.kGgrrrrrrgGk.', '.kGgrwrrwrgGk.', '.kGgrwrrwrgGk.',
    '.kGgrwrrwrgGk.', '.kGgrwwwwrgGk.', '..kGgrrrrgGk..', '..kGggggggGk..', '...kGgrrgGk...', '....kGggGk....',
    '.....kGGk.....', '......kk......', '..............', '..............',
], SP)

# cursor: espada (16x16, ponta em 1,1) e manopla para clicáveis
sword = sprite([
    'kk..............', 'kwk.............', '.kwk............', '..kwk...........', '...kwk..........', '....kwk.........',
    '.....kwk........', '......kwk.......', '.......kwk.kk...', '........kwkgk...', '.........kwgk...', '.......kkgbbk...',
    '.......kgkkbbk..', '........kk.kbbk.', '............kgk.', '.............kk.',
], SP)
gauntlet = sprite([
    '....kk..........', '...kiik.........', '...kiik.........', '...kiikkk.......', '...kiikiikkk....', '.kkkiikiikiik...',
    'kiikiiiiiiiiik..', 'kiiiiiiiiiiiik..', '.kiiiiiiiiiiik..', '.kiiiiiiiiiiik..', '..kiiiiiiiiik...', '..kIIIIIIIIIk...',
    '...kggggggggk...', '...kbbbbbbbbk...', '...kkkkkkkkkk...', '................',
], SP)

# estrelas que piscam (camada própria sobre o céu)
random.seed(11)
twinkle = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180' preserveAspectRatio='xMidYMax slice' shape-rendering='crispEdges'>" + ''.join(
    f"<rect x='{random.randrange(0,320)}' y='{random.randrange(0,90)}' width='1' height='1' fill='#fff6d8'/>" for _ in range(40)) + '</svg>'

# brasas subindo das tochas (tile 64x96)
embers = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 96' shape-rendering='crispEdges'>" + ''.join(
    f"<rect x='{x}' y='{y}' width='{s}' height='{s}' fill='{c}'/>" for x, y, s, c in
    [(6, 80, 1, '#f0a830'), (14, 52, 1, '#ffe07a'), (30, 70, 1, '#e0502a'), (44, 30, 1, '#f0a830'), (56, 88, 1, '#ffe07a'), (22, 12, 1, '#e0502a')]) + '</svg>'

# enfeite dourado dos cantos do modal (10x10, canto superior esquerdo)
FILIGREE = ['GGGGGG....', 'GggggGG...', 'Gg..kgG...', 'Gg.k.gG...', 'GgkGG.....', 'GG.G......', '.G........', '..........', '..........', '..........']
def corner(flip_x=False, flip_y=False):
    rows = [r[::-1] if flip_x else r for r in FILIGREE]
    return uri(sprite(rows[::-1] if flip_y else rows, SP))

# prego do cartão (4x4)
nail = sprite(['.kk.', 'kiik', 'kIIk', '.kk.'], SP)

iron = frame('#7d818b', '#454852', '#24262c')
slate = frame('#4c4656', '#2c2834', '#17141c')
gold = frame('#f6dc8a', '#c08f2e', '#6d4810')
wood = frame('#8a5a30', '#5a3618', '#2c180a')

css = f"""/* Tema Medieval Pixel Art: mural de guilda numa masmorra à noite.
   Molduras são border-image 9-slice em SVG (cantos em degrau, sem border-radius),
   sombras sólidas sem blur e nenhum filter nos cartões (o arrastar fica leve). */

:root {{
  --font-display: 'Silkscreen', monospace;
  --font-body: 'Pixelify Sans', monospace;
  --ink: #e9dcc0;
  --ink-muted: #a8977a;
  --gold: #e2b553;
  --gold-dark: #6d4810;
  --tablet: #15100b;
  --slate: #24202b;
  --slate-hover: #2e2836;
  --emerald: #3fbf73;
  --amber: #f0a830;
  --ruby: #d8434a;
  --frame-iron: {iron};
  --frame-slate: {slate};
  --frame-gold: {gold};
  --frame-wood: {wood};
}}
* {{ box-sizing: border-box; }}
body {{
  margin: 0; height: 100vh; display: flex; flex-direction: column;
  font: 18px/1.25 var(--font-body); color: var(--ink);
  background-color: #07050f;
  background-image:
    radial-gradient(ellipse 55% 65% at 50% 42%, #05040acc 0%, #05040a66 55%, transparent 80%),
    radial-gradient(ellipse 28% 55% at 0% 72%, #ff8a2a40, transparent 70%),
    radial-gradient(ellipse 28% 55% at 100% 72%, #ff8a2a40, transparent 70%),
    {uri(stone)},
    {uri(scene)};
  background-repeat: no-repeat, no-repeat, no-repeat, repeat-x, no-repeat;
  background-size: auto, auto, auto, 64px 64px, cover;
  background-position: center, left, right, bottom, center bottom;
  image-rendering: pixelated;
}}

/* ---- barra superior: viga de madeira com ferro forjado ---- */
.top {{
  display: flex; align-items: center; gap: 16px; padding: 10px 20px;
  background:
    repeating-linear-gradient(0deg, #00000022 0 2px, transparent 2px 6px),
    repeating-linear-gradient(90deg, #4a2c14 0 48px, #422612 48px 52px, #4a2c14 52px 120px),
    #4a2c14;
  border-top: 4px solid #2f3137; border-bottom: 4px solid #1c1d21;
  box-shadow: inset 0 2px 0 #6b4424, inset 0 -2px 0 #2a170a, 0 4px 0 #000;
  position: relative; z-index: 1;
}}
.top h1 {{ font: 16px var(--font-display); margin: 0; flex: 1; color: var(--ink); text-shadow: 2px 2px 0 #000; }}
.logo {{
  font: 700 20px var(--font-display); color: var(--gold); letter-spacing: 1px;
  text-shadow: 2px 2px 0 var(--gold-dark), 4px 4px 0 #000;
  padding: 2px 10px; border: 6px solid transparent; border-image: var(--frame-gold) 3 / 6px;
  background: #2a170a padding-box;
}}
#status {{
  display: inline-flex; align-items: center; gap: 8px;
  font: 11px var(--font-display); text-transform: uppercase; color: var(--ink-muted);
  --orb: var(--amber);
}}
#status::before {{
  content: ''; width: 12px; height: 12px; background: var(--orb);
  clip-path: polygon(0 3px, 3px 3px, 3px 0, 9px 0, 9px 3px, 100% 3px, 100% 9px, 9px 9px, 9px 100%, 3px 100%, 3px 9px, 0 9px);
  box-shadow: inset 3px 3px 0 #ffffff88, inset -3px -3px 0 #00000066;
}}
#status[data-state='online'] {{ --orb: var(--emerald); color: var(--emerald); }}
#status[data-state='conectando'] {{ --orb: var(--amber); color: var(--amber); }}
#status[data-state='offline'] {{ --orb: var(--ruby); color: var(--ruby); }}

/* ---- quadro ---- */
#board {{ flex: 1; overflow-x: auto; padding: 20px; }}
.lanes {{ display: flex; align-items: flex-start; gap: 16px; height: 100%; }}

/* Lista: placa de madeira queimada emoldurada em ferro batido */
.list {{
  width: 280px; flex-shrink: 0; max-height: 100%; display: flex; flex-direction: column; padding: 8px;
  border: 6px solid transparent; border-image: var(--frame-iron) 3 / 6px;
  background:
    repeating-linear-gradient(90deg, #00000026 0 2px, transparent 2px 14px),
    linear-gradient(#2b190d, #1f1209) padding-box;
  background-clip: padding-box;
  box-shadow: 6px 6px 0 #000;
}}
.list header {{
  position: relative; display: flex; align-items: center; padding: 6px 18px 10px; cursor: grab;
  border-bottom: 2px solid #120a05; box-shadow: 0 2px 0 #4a2c14; margin-bottom: 10px;
}}
/* rebites */
.list header::before, .list header::after {{
  content: ''; position: absolute; top: 10px; width: 4px; height: 4px; background: #b9b2a2;
  box-shadow: 1px 1px 0 #3a3a40, 0 -1px 0 #e6e0d2 inset;
}}
.list header::before {{ left: 4px; }}
.list header::after {{ right: 4px; }}
.list h2 {{ font: 13px var(--font-display); margin: 0; flex: 1; padding: 2px 4px; outline: none; color: var(--gold); text-shadow: 2px 2px 0 #000; }}
.list h2:focus {{ background: var(--tablet); box-shadow: inset 2px 2px 0 #000; }}
.cards {{ display: flex; flex-direction: column; gap: 10px; min-height: 8px; overflow-y: auto; padding: 0 4px 6px 0; }}

/* Cartão: placa de ardósia; a moldura acende em ouro no hover (sem filter) */
.card {{
  display: flex; flex-direction: column; gap: 6px; padding: 6px 8px; cursor: pointer;
  border: 6px solid transparent; border-image: var(--frame-slate) 3 / 6px;
  background: linear-gradient(var(--slate), #1d1a23) padding-box;
  box-shadow: 4px 4px 0 #000;
}}
.card:hover {{ border-image-source: var(--frame-gold); background: linear-gradient(var(--slate-hover), #231e2a) padding-box; }}
.card[hidden] {{ display: none; }}
.card span {{ flex: 1; word-break: break-word; }}
.dragging {{ opacity: 0.35; }}
.row {{ display: flex; align-items: center; gap: 8px; }}

/* ---- ícones pixel ---- */
.px-icon {{ display: inline-block; width: 16px; height: 16px; flex-shrink: 0; vertical-align: -3px; }}
.px-icon svg {{ display: block; width: 100%; height: 100%; }}
.icon {{ background: none; border: 0; cursor: pointer; padding: 2px; line-height: 0; visibility: hidden; }}
.card:hover .icon, .list header:hover .icon {{ visibility: visible; }}
.icon:hover {{ background: #ffffff1a; }}
.icon:active {{ transform: translateY(2px); }}
.icon.show {{ visibility: visible; }}

/* ---- etiquetas: fitas de estandarte em tons de gema ---- */
.label-green {{ --c: #2f9e5b; --c-hi: #6fdc95; }}
.label-yellow {{ --c: #d9a62e; --c-hi: #ffe07a; }}
.label-orange {{ --c: #c9662a; --c-hi: #f7a35c; }}
.label-red {{ --c: #b02f3a; --c-hi: #ef6b72; }}
.label-purple {{ --c: #7f45b5; --c-hi: #c08cf0; }}
.label-blue {{ --c: #2c66b8; --c-hi: #6fa7ff; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 4px; }}
.chip {{
  display: block; width: 40px; height: 10px; background: var(--c);
  clip-path: polygon(0 0, 100% 0, calc(100% - 5px) 50%, 100% 100%, 0 100%);
  box-shadow: inset 0 2px 0 var(--c-hi), inset 0 -2px 0 #00000066;
}}

/* ---- selos ---- */
.badges {{ display: flex; flex-wrap: wrap; gap: 6px; font: 15px var(--font-body); color: var(--ink-muted); }}
.badge {{ display: inline-flex; align-items: center; gap: 4px; padding: 1px 5px; }}
.badge.done {{ background: #1f6b3e; color: #eafff0; box-shadow: inset 2px 2px 0 #3fbf73, inset -2px -2px 0 #0f3a20; }}
.badge.late {{ background: #8a2026; color: #fff0f0; box-shadow: inset 2px 2px 0 #d8434a, inset -2px -2px 0 #4a0f12; }}
.badge.soon {{ background: #7a5208; color: #fff6dc; box-shadow: inset 2px 2px 0 #f0a830, inset -2px -2px 0 #3a2604; }}

/* ---- campos: tabuletas escuras ---- */
input, textarea {{
  width: 100%; font: 17px var(--font-body); color: var(--ink);
  background: var(--tablet); border: 0; padding: 8px; border-radius: 0;
  box-shadow: inset 2px 2px 0 #000, inset -2px -2px 0 #3a2c1e;
}}
input::placeholder, textarea::placeholder {{ color: #7a6a52; }}
input:focus, textarea:focus {{ outline: 2px solid var(--gold); outline-offset: 0; }}
textarea {{ resize: vertical; }}
.add-card {{ margin-top: 10px; }}
.add-card input {{ background: #00000040; box-shadow: none; }}
.add-card input:focus {{ background: var(--tablet); }}
.add-list {{
  width: 280px; flex-shrink: 0; padding: 4px;
  border: 6px solid transparent; border-image: var(--frame-wood) 3 / 6px;
  background: #1a0f07cc padding-box; box-shadow: 6px 6px 0 #000;
}}
.add-list input {{ font-family: var(--font-display); font-size: 12px; background: transparent; box-shadow: none; color: var(--gold); }}
#filter {{ width: 240px; padding: 6px 10px; font-size: 16px; }}
input[type='search']::-webkit-search-cancel-button {{ filter: invert(.8) sepia(1); }}

/* ---- verso do cartão: caixa de diálogo RPG 16-bit ---- */
.card-detail {{
  width: min(660px, calc(100vw - 32px)); max-height: calc(100vh - 64px); color: var(--ink); padding: 20px 26px;
  border: 9px solid transparent; border-image: var(--frame-gold) 3 / 9px;
  background:
    repeating-linear-gradient(0deg, #ffffff05 0 2px, transparent 2px 4px),
    linear-gradient(#1c1626, #120e19) padding-box;
  background-clip: padding-box;
  box-shadow: inset 0 0 0 3px #0a0710, inset 0 0 0 6px #5d616b, inset 0 0 0 8px #0a0710, 8px 8px 0 #000;
}}
.card-detail::backdrop {{ background: #03020899; }}
.card-detail header {{ display: flex; align-items: flex-start; gap: 12px; }}
.card-detail header > div {{ flex: 1; }}
.card-detail h2 {{ margin: 0; font: 18px var(--font-display); outline: none; padding: 4px 6px; color: var(--gold); text-shadow: 2px 2px 0 #000; }}
.card-detail h2:focus {{ background: var(--tablet); box-shadow: inset 2px 2px 0 #000; }}
.card-detail h3 {{ font: 12px var(--font-display); margin: 0 0 10px; flex: 1; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; text-shadow: 2px 2px 0 #000; }}
.muted {{ color: var(--ink-muted); margin: 4px 0 0 6px; font-size: 15px; }}
.block {{ margin-top: 22px; }}

/* botões com relevo pixelado e clique físico */
.card-detail button:not(.icon) {{
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  font: 11px var(--font-display); text-transform: uppercase; color: var(--ink);
  background: #4a2e18; border: 0; padding: 8px 12px;
  box-shadow: inset 2px 2px 0 #8a5a30, inset -2px -2px 0 #24140a, 0 0 0 2px #000, 3px 3px 0 2px #000;
}}
.card-detail button:not(.icon):hover {{ background: #5a3a1e; color: #fff4d6; }}
.card-detail button:not(.icon):active {{ transform: translateY(2px); box-shadow: inset 2px 2px 0 #24140a, 0 0 0 2px #000, 1px 1px 0 2px #000; }}
.card-detail .danger {{ background: #6a1c22; }}
.card-detail .danger:hover {{ background: #8a2229; }}
.labels {{ display: flex; flex-wrap: wrap; gap: 8px; }}
.card-detail button.label {{
  font-size: 10px; padding: 7px 18px 7px 10px; background: var(--c); color: #120c06; opacity: .45;
  clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%);
  box-shadow: inset 0 2px 0 var(--c-hi), inset 0 -3px 0 #00000066;
}}
.card-detail button.label:hover {{ background: var(--c); opacity: .75; }}
.card-detail button.label.on {{ opacity: 1; }}
input[type='datetime-local'] {{ width: auto; color-scheme: dark; }}
input[type='checkbox'] {{
  appearance: none; width: 16px; height: 16px; padding: 0; margin: 0; cursor: pointer; flex-shrink: 0;
  background: var(--tablet); box-shadow: inset 2px 2px 0 #000, inset -2px -2px 0 #3a2c1e, 0 0 0 2px #6b4a24;
}}
input[type='checkbox']:checked {{ background: var(--emerald); box-shadow: inset 2px 2px 0 #9cf0bd, inset -2px -2px 0 #1a5a34, 0 0 0 2px #0f3a20; }}
input[type='checkbox']:disabled {{ opacity: .4; cursor: default; }}
.check {{ display: flex; align-items: center; gap: 10px; flex: 1; cursor: pointer; }}

/* checklist como barra de XP segmentada */
.progress {{ display: flex; align-items: center; gap: 10px; font: 10px var(--font-display); color: var(--gold); }}
.progress span {{ min-width: 34px; }}
.progress div {{ flex: 1; height: 14px; background: #0c0805; box-shadow: inset 2px 2px 0 #000, 0 0 0 2px #000, 0 0 0 4px #5d616b; }}
.progress i {{
  display: block; height: 100%; transition: width .2s steps(6);
  background:
    repeating-linear-gradient(90deg, transparent 0 8px, #00000088 8px 10px),
    linear-gradient(#f2d27a 0 3px, #d9a43a 3px 9px, #8a5e16 9px);
}}
.progress.full {{ color: var(--emerald); }}
.progress.full div {{ box-shadow: inset 2px 2px 0 #000, 0 0 0 2px #000, 0 0 0 4px #3fbf73; }}
.progress.full i {{
  background:
    repeating-linear-gradient(90deg, transparent 0 8px, #00000088 8px 10px),
    linear-gradient(#b6ffd2 0 3px, #3fdc85 3px 9px, #1a7a44 9px);
}}
.checklist {{ list-style: none; padding: 0; margin: 10px 0; }}
.checklist li {{ display: flex; align-items: center; padding: 4px 6px; }}
.checklist li:hover {{ background: #ffffff0a; }}
.checklist li:hover .icon {{ visibility: visible; }}
.checklist li.complete .check {{ text-decoration: line-through; color: var(--ink-muted); }}
.inline-form input {{ background: #0000004d; }}
.comments {{ list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 12px; }}
.comments b {{ font: 11px var(--font-display); color: var(--gold); }}
.comments time {{ font-size: 14px; color: var(--ink-muted); margin-left: 8px; }}
.comments p {{
  margin: 6px 0 0; padding: 8px 10px; white-space: pre-wrap; background: #e3cc98; color: #2a1a0a;
  box-shadow: inset 2px 2px 0 #f6e6bd, inset -2px -2px 0 #9c7f4e, 3px 3px 0 #000;
}}
.card-detail footer {{ margin-top: 26px; display: flex; justify-content: flex-end; }}

/* barras de rolagem em pixel */
* {{ scrollbar-color: #6b4a24 #120a05; }}
::-webkit-scrollbar {{ width: 10px; height: 10px; }}
::-webkit-scrollbar-track {{ background: #120a05; }}
::-webkit-scrollbar-thumb {{ background: #6b4a24; box-shadow: inset 2px 2px 0 #8a5a30, inset -2px -2px 0 #2c180a; }}

/* =================== enriquecimento =================== */

/* cursores: espada no geral, manopla no que é clicável */
body {{ cursor: {uri(sword)} 1 1, auto; position: relative; }}
button, .card, .list header, label.check, input[type='checkbox'], a {{ cursor: {uri(gauntlet)} 5 1, pointer; }}
input:not([type='checkbox']), textarea, [contenteditable='true'] {{ cursor: text; }}
::selection {{ background: var(--gold); color: #1a1008; }}

/* camadas fixas do cenário: estrelas piscando, tochas na parede, brasas */
html::before, html::after, body::after {{ content: ''; position: fixed; inset: 0; pointer-events: none; }}
html::before {{
  z-index: 0; background: {uri(twinkle)} center bottom / cover no-repeat; opacity: .9;
}}
html::after {{
  z-index: 0;
  background-image: {uri(torch_a)}, {uri(torch_a)};
  background-repeat: no-repeat; background-size: 48px 96px;
  background-position: left 20px bottom 92px, right 20px bottom 92px;
}}
body::after {{
  z-index: 0; opacity: .8;
  background-image: {uri(embers)}, {uri(embers)};
  background-repeat: repeat-y; background-size: 64px 96px;
  background-position: left 12px bottom 0, right 12px bottom 0;
  -webkit-mask-image: linear-gradient(transparent 35%, #000 75%); mask-image: linear-gradient(transparent 35%, #000 75%);
}}
.top, #board {{ position: relative; z-index: 1; }}
@media (prefers-reduced-motion: no-preference) {{
  html::before {{ animation: twinkle 3.2s steps(1) infinite; }}
  html::after {{ animation: flame .5s steps(1) infinite; }}
  body::after {{ animation: embers 6s steps(24) infinite; }}
  #status[data-state='conectando']::before {{ animation: blink 1s steps(1) infinite; }}
}}
@keyframes twinkle {{ 0%, 100% {{ opacity: .9; }} 30% {{ opacity: .35; }} 60% {{ opacity: .7; }} }}
@keyframes flame {{ 0%, 100% {{ background-image: {uri(torch_a)}, {uri(torch_b)}; }} 50% {{ background-image: {uri(torch_b)}, {uri(torch_a)}; }} }}
@keyframes embers {{ to {{ background-position: left 12px bottom 96px, right 12px bottom 96px; }} }}
@keyframes blink {{ 50% {{ opacity: .3; }} }}

/* logo com brasão */
.logo {{ display: inline-flex; align-items: center; gap: 8px; }}
.logo::before {{ content: ''; width: 28px; height: 32px; background: {uri(crest)} center / 28px 32px no-repeat; flex-shrink: 0; }}

/* flâmula colorida pendurada no título de cada lista */
.list {{ --c: #2c66b8; --c-hi: #6fa7ff; }}
.list:nth-child(6n+1) {{ --c: #b02f3a; --c-hi: #ef6b72; }}
.list:nth-child(6n+2) {{ --c: #2c66b8; --c-hi: #6fa7ff; }}
.list:nth-child(6n+3) {{ --c: #2f9e5b; --c-hi: #6fdc95; }}
.list:nth-child(6n+4) {{ --c: #7f45b5; --c-hi: #c08cf0; }}
.list:nth-child(6n+5) {{ --c: #d9a62e; --c-hi: #ffe07a; }}
.list:nth-child(6n+6) {{ --c: #c9662a; --c-hi: #f7a35c; }}
.list h2 {{ display: flex; align-items: flex-start; gap: 8px; }}
.list h2::before {{
  content: ''; flex-shrink: 0; width: 10px; height: 16px; margin-top: -8px; background: var(--c);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 70%, 0 100%);
  box-shadow: inset 2px 0 0 var(--c-hi), inset -2px 0 0 #00000066;
}}

/* cartão pregado no mural */
.card {{ position: relative; }}
.card::before {{
  content: ''; position: absolute; top: -5px; left: 50%; width: 8px; height: 8px; margin-left: -4px;
  background: {uri(nail)} center / 8px 8px no-repeat;
}}

/* área de soltar enquanto arrasta */
.cards.drop-target {{ outline: 2px dashed var(--gold); outline-offset: 2px; background: #e2b5530f; }}

/* enfeites dourados nos cantos do modal */
.card-detail::before {{
  content: ''; position: absolute; inset: 10px; pointer-events: none;
  background:
    {corner()} left top / 20px 20px no-repeat,
    {corner(flip_x=True)} right top / 20px 20px no-repeat,
    {corner(flip_y=True)} left bottom / 20px 20px no-repeat,
    {corner(flip_x=True, flip_y=True)} right bottom / 20px 20px no-repeat;
}}
.card-detail[open] {{ position: fixed; }}

/* brilho que corre pela barra de XP */
.progress div {{ position: relative; overflow: hidden; }}
@media (prefers-reduced-motion: no-preference) {{
  .progress div::after {{
    content: ''; position: absolute; top: 2px; bottom: 2px; width: 6px; left: -10px; background: #fff6;
    animation: xp-shine 2.4s steps(30) infinite;
  }}
}}
@keyframes xp-shine {{ to {{ left: 110%; }} }}

/* estados vazios com cara de missão */
.cards:empty {{ min-height: 40px; }}
.cards:empty::before {{ content: '~ nenhuma missão ~'; display: block; text-align: center; padding: 10px 0; font: 10px var(--font-display); color: #6b5638; }}
"""
open('src/style.css', 'w', encoding='utf8').write(css)

p = 'index.html'; s = open(p, encoding='utf8').read()
link = """  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;700&family=Silkscreen:wght@400;700&display=swap" rel="stylesheet">
  <title>"""
if 'Silkscreen' not in s:
    s = s.replace('  <title>', link, 1)
open(p, 'w', encoding='utf8').write(s)
print('ok', len(css))
