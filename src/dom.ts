/** Cria um elemento com propriedades, dataset e filhos. */
export const h = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, any> = {}, ...kids: (Node | string)[]) => {
  const { dataset, ...rest } = props;
  const el = Object.assign(document.createElement(tag), rest);
  if (dataset) Object.assign(el.dataset, dataset);
  el.append(...kids);
  return el;
};

/** Elemento onde a pessoa está digitando (campo de texto ou contentEditable). */
export function isEditing(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit'].includes(el.type);
}

// ---- ícones pixel art ----
// Cada ícone é uma grade 16×16 de caracteres; cada letra é uma cor da paleta
// e '.' é transparente. Linhas viram <rect> por trecho contínuo da mesma cor.

const PALETTE: Record<string, string> = {
  k: '#140c06', // contorno
  g: '#b8862b', // ouro velho
  G: '#f2d27a', // ouro claro
  p: '#e3cc98', // pergaminho
  P: '#9c7f4e', // pergaminho sombra
  w: '#efe6d2', // osso / pena
  i: '#c9c1b0', // ferro
  r: '#9b2f2a', // rubi
  e: '#3f9a5f', // esmeralda
  b: '#6e4220', // madeira
};

const ICONS = {
  hourglass: [
    '................', '..kkkkkkkkkkkk..', '..kGGGGGGGGGGk..', '...kppppppppk...', '...kpGGGGGGpk...', '....kpGGGGpk....',
    '.....kpGGpk.....', '......kGGk......', '......kppk......', '.....kppGpk.....', '....kpppGppk....', '...kppGGGGppk...',
    '...kpGGGGGGpk...', '..kGGGGGGGGGGk..', '..kkkkkkkkkkkk..', '................',
  ],
  scroll: [
    '................', '..kkkkkkkkkkk...', '.kPpppppppppPk..', '.kPPPPPPPPPPPk..', '..kpppppppppk...', '..kpPPPPPPPpk...',
    '..kpppppppppk...', '..kpPPPPPPppk...', '..kpppppppppk...', '..kpPPPPPPPpk...', '..kpppppppppk...', '..kpPPPPPppPk...',
    '.kPpppppppppPk..', '.kPPPPPPPPPPPk..', '..kkkkkkkkkkk...', '................',
  ],
  shield: [
    '................', '..kkkkkkkkkkkk..', '..keeeeeeeeeek..', '..keeeeeeeeeek..', '..keeeeeeewwek..', '..keeeeeewweek..',
    '..kewweewweeek..', '..keewwwweeeek..', '..keeewweeeeek..', '...keeeeeeeek...', '....keeeeeek....', '.....keeeek.....',
    '......kkkk......', '................', '................', '................',
  ],
  quill: [
    '................', '............kk..', '..........kkwwk.', '.........kwwwwk.', '........kwwwwk..', '.......kwwwwk...',
    '......kwwwwk....', '.....kwwwwk.....', '....kwwwk.......', '...kwwk.........', '...kgk..........', '..kgk...........',
    '..kk............', '.kk.......kkkk..', 'kk.......kbbbbk.', '.........kkkkkk.',
  ],
  x: [
    '................', '................', '..kk........kk..', '..kik......kik..', '...kik....kik...', '....kik..kik....',
    '.....kikkik.....', '......kiik......', '......kiik......', '.....kikkik.....', '....kik..kik....', '...kik....kik...',
    '..kik......kik..', '..kk........kk..', '................', '................',
  ],
  skull: [
    '................', '....kkkkkkkk....', '...kwwwwwwwwk...', '..kwwwwwwwwwwk..', '..kwwwwwwwwwwk..', '..kwkkkwwkkkwk..',
    '..kwkrkwwkrkwk..', '..kwkkkwwkkkwk..', '..kwwwwkkwwwwk..', '...kwwwwwwwwk...', '....kwkwkwwk....', '....kkkkkkkk....',
    '................', '................', '................', '................',
  ],
  chest: [
    '................', '................', '...kkkkkkkkkk...', '..kbbbbbbbbbbk..', '..kbggggggggbk..', '..kbbbbbbbbbbk..',
    '..kkkkkGGkkkkk..', '..kbbbbGGbbbbk..', '..kbbbbkkbbbbk..', '..kbbbbbbbbbbk..', '..kggggggggggk..', '..kbbbbbbbbbbk..',
    '..kkkkkkkkkkkk..', '................', '................', '................',
  ],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;

const svgCache = new Map<IconName, string>();

function iconSvg(name: IconName) {
  let svg = svgCache.get(name);
  if (svg) return svg;
  const rects: string[] = [];
  ICONS[name].forEach((row, y) => {
    const cells = row.padEnd(16, '.').slice(0, 16);
    for (let x = 0; x < 16; ) {
      const c = cells[x];
      let end = x + 1;
      while (end < 16 && cells[end] === c) end++;
      if (PALETTE[c]) rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${PALETTE[c]}"/>`);
      x = end;
    }
  });
  svg = `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
  svgCache.set(name, svg);
  return svg;
}

/** Ícone pixel art inline (16×16). */
export function icon(name: IconName) {
  const span = document.createElement('span');
  span.className = `px-icon px-${name}`;
  span.innerHTML = iconSvg(name);
  return span;
}
