#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const bucket = 'exercicios-gifs';
const gifsDir = path.resolve(process.cwd(), process.argv[2] || 'public/gifs');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const files = (await readdir(gifsDir)).filter((name) => /\.(gif|png|jpe?g|webp)$/i.test(name));
const fileSet = new Set(files.map((name) => name.toLowerCase()));
const byLower = new Map(files.map((name) => [name.toLowerCase(), name]));
const uploaded = [];
const failures = [];

function mime(name) {
  if (/\.gif$/i.test(name)) return 'image/gif';
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.webp$/i.test(name)) return 'image/webp';
  return 'image/jpeg';
}
function localBasename(value) {
  const raw = String(value || '').trim();
  if (!raw || /^https?:\/\//i.test(raw)) return '';
  try { return decodeURIComponent(raw).replace(/\\/g, '/').split('/').pop() || ''; } catch { return raw.replace(/\\/g, '/').split('/').pop() || ''; }
}
function slug(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

for (const file of files) {
  const body = await readFile(path.join(gifsDir, file));
  const storagePath = `library/${file}`;
  const { error } = await supabase.storage.from(bucket).upload(storagePath, body, { contentType: mime(file), cacheControl: '31536000', upsert: true });
  if (error) failures.push({ file, error: error.message });
  else uploaded.push(file);
}

if (failures.length) {
  console.error('Falha ao enviar arquivos. Banco NÃO será atualizado.');
  console.error(failures);
  process.exit(2);
}

const { data: exercises, error: exerciseError } = await supabase.from('exercise_library').select('id,name,slug,media_url,is_active');
if (exerciseError) throw exerciseError;
const unresolved = [];
const updated = [];

for (const exercise of exercises || []) {
  const current = localBasename(exercise.media_url);
  const candidates = [current, `${slug(exercise.slug || exercise.name)}.gif`].filter(Boolean).map((x) => x.toLowerCase());
  const foundKey = candidates.find((candidate) => fileSet.has(candidate));
  if (!foundKey) {
    if (exercise.is_active) unresolved.push({ id: exercise.id, name: exercise.name, media_url: exercise.media_url });
    continue;
  }
  const file = byLower.get(foundKey);
  const storagePath = `library/${file}`;
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
  const { error } = await supabase.from('exercise_library').update({ media_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', exercise.id);
  if (error) throw error;
  await supabase.from('workout_exercises').update({ media_url: publicUrl }).eq('exercise_library_id', exercise.id);
  await supabase.from('workout_template_exercises').update({ media_url: publicUrl }).eq('exercise_library_id', exercise.id);
  updated.push({ id: exercise.id, name: exercise.name, file, publicUrl });
}

const report = { bucket, uploaded: uploaded.length, updated: updated.length, unresolved };
await writeFile(path.resolve(process.cwd(), 'gif-storage-migration-report.json'), JSON.stringify(report, null, 2));
console.log(`Uploads: ${uploaded.length}; exercícios atualizados: ${updated.length}; ativos sem mídia resolvida: ${unresolved.length}`);
if (unresolved.length) {
  console.error('Existem exercícios ativos sem arquivo correspondente. Não remova public/gifs ainda.');
  process.exitCode = 3;
} else {
  await mkdir(gifsDir, { recursive: true });
  await writeFile(path.join(gifsDir, '.storage-only'), 'Build 1.3.6: novos GIFs devem ser enviados pelo app ao Supabase Storage.\n');
  console.log('Migração completa. Rode check-exercise-gifs.mjs antes de remover os GIFs locais.');
}
