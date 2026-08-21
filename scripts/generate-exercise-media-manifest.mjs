import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mediaDir = path.join(root, 'public', 'gifs');
const outputFile = path.join(root, 'public', 'exercise-media-manifest.json');

async function walk(dir, relative = '') {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await walk(path.join(dir, entry.name), nextRelative)));
    } else if (entry.isFile()) {
      files.push(nextRelative.replaceAll('\\', '/'));
    }
  }
  return files;
}

const files = (await walk(mediaDir))
  .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
  .map((file) => `/gifs/${file.split('/').map(encodeURIComponent).join('/')}`);

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  count: files.length,
  files,
};

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`[ACCQUA] Biblioteca de mídia: ${files.length} arquivo(s) indexado(s).`);
