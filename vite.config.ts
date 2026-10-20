import { defineConfig } from 'vite';
import { uailloServer } from './server/plugin.ts';

// O backend (REST + socket) roda dentro do próprio dev server do Vite,
// então `npm run dev` sobe tudo num processo só.
// `--mode pages` gera o site estático do GitHub Pages (ver .env.pages):
// caminhos relativos e backend rodando no navegador.
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? './' : '/',
  plugins: [uailloServer()],
  server: { port: 5180 },
}));
