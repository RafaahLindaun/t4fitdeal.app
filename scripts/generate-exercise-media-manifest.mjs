import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const gifsDir = path.join(publicDir, 'gifs');
const output = path.join(publicDir, 'exercise-media-manifest.json');

await fs.mkdir(publicDir, { recursive: true });
let entries = [];
try {
  const dirEntries = await fs.readdir(gifsDir, { withFileTypes: true });
  entries = dirEntries
    .filter((entry) => entry.isFile() && /\.(gif|png|jpe?g|webp|avif)$/i.test(entry.name))
    .map((entry) => `/gifs/${encodeURIComponent(entry.name).replace(/%2F/gi, '/')}`)
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

await fs.writeFile(output, JSON.stringify({ version: 2, generatedAt: new Date().toISOString(), count: entries.length, files: entries }, null, 2) + '\n');
console.log(`exercise-media-manifest.json: ${entries.length} mídia(s) indexada(s).`);
