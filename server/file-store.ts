import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Persistence } from './store.ts';

/** Banco num arquivo JSON (dev server e servidor standalone). */
export function fileStore(file: string): Persistence {
  return {
    load: () => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null),
    save: (db) => {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(db, null, 2));
    },
  };
}
