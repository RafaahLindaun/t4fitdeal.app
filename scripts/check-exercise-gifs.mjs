#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await supabase.from('exercise_library').select('id,name,media_url').eq('is_active', true).order('name');
if (error) throw error;
const results = [];
for (const row of data || []) {
  const url = String(row.media_url || '').trim();
  if (!url) { results.push({ ...row, ok: false, status: 0, reason: 'sem media_url' }); continue; }
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (response.status === 405) response = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, redirect: 'follow' });
    results.push({ ...row, ok: response.ok, status: response.status, url });
  } catch (err) {
    results.push({ ...row, ok: false, status: 0, url, reason: err instanceof Error ? err.message : String(err) });
  }
}
const broken = results.filter((item) => !item.ok);
await writeFile(path.resolve(process.cwd(), 'gif-http-check-report.json'), JSON.stringify({ checked: results.length, broken }, null, 2));
console.log(`GIFs verificados: ${results.length}; falhas: ${broken.length}`);
if (broken.length) {
  for (const item of broken) console.error(`${item.status || 'ERR'} — ${item.name}: ${item.url || item.reason}`);
  process.exitCode = 2;
}
