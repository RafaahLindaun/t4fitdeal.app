#!/usr/bin/env node
import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
const dir = path.resolve(process.cwd(), 'public/gifs');
try { await access(path.join(dir, '.storage-only')); } catch { process.exit(0); }
const files = (await readdir(dir)).filter((name) => /\.(gif|png|jpe?g|webp)$/i.test(name));
if (files.length) {
  console.error(`Build 1.3.6: public/gifs está em modo Storage-only, mas contém ${files.length} mídia(s). Envie pelo painel da Biblioteca e remova do Git.`);
  process.exit(2);
}
