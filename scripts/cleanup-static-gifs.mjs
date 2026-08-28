#!/usr/bin/env node
import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

if (!process.argv.includes('--yes')) {
  console.error('Use --yes somente depois de npm run media:check retornar 0 falhas.');
  process.exit(1);
}
const root = process.cwd();
const reportPath = path.resolve(root, 'gif-http-check-report.json');
let report;
try { report = JSON.parse(await readFile(reportPath, 'utf8')); }
catch { console.error('gif-http-check-report.json não encontrado. Rode npm run media:check primeiro.'); process.exit(1); }
if (!report || !Array.isArray(report.broken) || report.broken.length) {
  console.error('O relatório ainda contém falhas. public/gifs NÃO será removido.');
  process.exit(2);
}
const dir = path.resolve(root, 'public/gifs');
const files = (await readdir(dir)).filter((name) => /\.(gif|png|jpe?g|webp)$/i.test(name));
for (const file of files) await unlink(path.join(dir, file));
await writeFile(path.join(dir, '.storage-only'), 'Build 1.3.6: mídias de exercício vivem no Supabase Storage. Não adicionar arquivos aqui.\n');
console.log(`Removidos ${files.length} arquivos estáticos. Mantido public/gifs/.storage-only.`);
