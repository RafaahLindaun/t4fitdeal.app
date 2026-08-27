#!/usr/bin/env node
import { readdir, rename, unlink, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(process.cwd(), process.argv[2] || 'public/gifs');
const reportPath = path.resolve(process.cwd(), 'gif-normalization-report.json');
const dryRun = process.argv.includes('--dry-run');

function normalizeName(name) {
  const parsed = path.parse(name.trim());
  const stem = parsed.name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const ext = parsed.ext.toLowerCase();
  return `${stem}${ext === '.gif' ? '.gif' : ext}`;
}

async function sha256(file) {
  const body = await readFile(file);
  return createHash('sha256').update(body).digest('hex');
}

const names = (await readdir(root)).filter((name) => !name.startsWith('.'));
const groups = new Map();
for (const name of names) {
  const normalized = normalizeName(name);
  const key = normalized.toLowerCase();
  groups.set(key, [...(groups.get(key) || []), { name, normalized }]);
}

const report = { root, dryRun, renamed: [], removedIdenticalDuplicates: [], conflicts: [], unchanged: [] };

for (const entries of groups.values()) {
  const targetName = entries[0].normalized;
  if (entries.length > 1) {
    const hashes = [];
    for (const entry of entries) hashes.push({ ...entry, hash: await sha256(path.join(root, entry.name)) });
    const uniqueHashes = new Set(hashes.map((item) => item.hash));
    if (uniqueHashes.size > 1) {
      report.conflicts.push({ target: targetName, files: hashes.map(({ name, hash }) => ({ name, hash })) });
      continue;
    }
    // Conteúdo idêntico: mantém um único arquivo no nome canônico.
    const keeper = hashes.find((item) => item.name === targetName) || hashes[0];
    if (!dryRun && keeper.name !== targetName) await rename(path.join(root, keeper.name), path.join(root, targetName));
    if (keeper.name !== targetName) report.renamed.push({ from: keeper.name, to: targetName });
    for (const duplicate of hashes) {
      if (duplicate.name === keeper.name) continue;
      if (!dryRun) await unlink(path.join(root, duplicate.name));
      report.removedIdenticalDuplicates.push({ file: duplicate.name, kept: targetName });
    }
    continue;
  }

  const [{ name, normalized }] = entries;
  if (name === normalized) {
    report.unchanged.push(name);
    continue;
  }
  if (!dryRun) await rename(path.join(root, name), path.join(root, normalized));
  report.renamed.push({ from: name, to: normalized });
}

await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(`Relatório: ${reportPath}`);
console.log(`Renomeados: ${report.renamed.length}`);
console.log(`Duplicatas idênticas removidas: ${report.removedIdenticalDuplicates.length}`);
console.log(`Conflitos manuais: ${report.conflicts.length}`);
if (report.conflicts.length) {
  console.error('\nCONFLITOS: arquivos diferentes convergem para o mesmo nome. Escolha manualmente qual manter e rode novamente.');
  for (const conflict of report.conflicts) console.error(`- ${conflict.target}: ${conflict.files.map((f) => f.name).join(' | ')}`);
  process.exitCode = 2;
}
