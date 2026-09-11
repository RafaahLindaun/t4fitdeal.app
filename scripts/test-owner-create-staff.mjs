import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { transform } from 'esbuild';

// Exercise the deployed handler with an in-memory Auth/database double.
// No requests, accounts, credentials or database writes leave this process.
const source = await readFile(new URL('../supabase/functions/owner-create-staff-v1655/index.ts', import.meta.url), 'utf8');
const { code } = await transform(source.replace(/^import .*supabase-js.*;\r?\n/m, ''), { loader: 'ts', target: 'es2022' });
const ownerEmail = 'rafaalexandrowitch@professor.com';
const payload = { action: 'create', fullName: 'Pessoa de teste', email: 'pessoa@gmail.com', role: 'professor', password: 'local-fixture-only' };

function fixture({ caller = ownerEmail, canonical = ownerEmail, duplicate = false, failTable = '' } = {}) {
  const events = [];
  const admin = {
    auth: { admin: {
      getUserById: async () => ({ data: { user: { id: 'owner-id', email: canonical } }, error: null }),
      createUser: async (input) => {
        events.push({ kind: 'create', input });
        return duplicate ? { data: {}, error: { message: 'User already registered' } } : { data: { user: { id: 'new-user-id' } }, error: null };
      },
      deleteUser: async (id) => { events.push({ kind: 'delete', id }); return { error: null }; },
      updateUserById: async () => { throw new Error('Metadata must be set before profile provisioning to avoid rerunning legacy triggers.'); },
    } },
    from: (table) => ({
      upsert: async (input) => { events.push({ kind: 'upsert', table, input }); return { error: table === failTable ? new Error('fixture failure') : null }; },
      insert: async (input) => { events.push({ kind: 'insert', table, input }); return { error: table === failTable ? new Error('fixture failure') : null }; },
      select: () => ({ in: () => ({ order: async () => ({ data: [], error: null }) }) }),
    }),
  };
  let handler;
  vm.runInNewContext(code, {
    Request, Response, Date,
    console: { error() {} },
    Deno: { env: { get: (name) => name }, serve: (fn) => { handler = fn; } },
    createClient: (_url, key) => key === 'SUPABASE_SERVICE_ROLE_KEY' ? admin : {
      auth: { getUser: async () => ({ data: { user: caller ? { id: 'owner-id', email: caller } : null }, error: null }) },
    },
  });
  return {
    events,
    call: async (body = payload) => {
      const response = await handler(new Request('https://local.invalid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
      return { status: response.status, body: await response.json() };
    },
  };
}

for (const [name, options, expected] of [
  ['anonymous', { caller: null }, 401],
  ['ordinary staff', { caller: 'someone@professor.com' }, 403],
  ['changed canonical owner record', { canonical: 'someone@gmail.com' }, 403],
]) test(`rejects ${name} without creating or modifying an account`, async () => {
  const f = fixture(options);
  assert.equal((await f.call()).status, expected);
  assert.equal(f.events.length, 0);
});

for (const role of ['professor', 'admin', 'reception']) test(`custom email uses the owner's selected ${role} role`, async () => {
  const f = fixture();
  const email = role === 'admin' ? 'name+team@custom.example.com' : 'pessoa@gmail.com';
  const result = await f.call({ ...payload, role, email: ` ${email.toUpperCase()} ` });
  assert.equal(result.status, 201);
  assert.equal(result.body.staff.email, email);
  assert.equal(result.body.staff.role, role);
  assert.equal(f.events[0].input.app_metadata.role, role);
  const profile = f.events.find((event) => event.table === 'profiles');
  assert.equal(profile.input.role, role);
  assert.equal(profile.input.status, 'active');
  assert.equal(f.events.at(-1).table, 'accqua_staff_account_audit');
});

test('legacy username clients keep working during rollout', async () => {
  const f = fixture();
  const { email, ...legacy } = payload;
  const result = await f.call({ ...legacy, username: 'mariana', role: 'reception' });
  assert.equal(result.status, 201);
  assert.equal(result.body.staff.email, 'mariana@recepcao.com');
});

for (const email of ['', 'name', 'a@@gmail.com', 'a b@gmail.com', '.name@gmail.com', 'a..b@gmail.com', 'name@-bad.com', 'name@gmail..com', 'x'.repeat(65) + '@gmail.com', ['a@gmail.com']]) {
  test(`rejects malformed email ${JSON.stringify(email).slice(0, 48)} before any writes`, async () => {
    const f = fixture();
    assert.equal((await f.call({ ...payload, email })).body.error, 'invalid_email');
    assert.equal(f.events.length, 0);
  });
}

test('rejects arbitrary roles and weak passwords before writes', async () => {
  const f = fixture();
  assert.equal((await f.call({ ...payload, role: 'owner' })).status, 400);
  assert.equal((await f.call({ ...payload, password: 'short' })).status, 400);
  assert.equal(f.events.length, 0);
});

test('duplicate email never changes the existing account', async () => {
  const f = fixture({ duplicate: true });
  assert.equal((await f.call()).status, 409);
  assert.deepEqual(f.events.map((event) => event.kind), ['create']);
});

test('provisioning failure compensates only the newly created account', async () => {
  const f = fixture({ failTable: 'accqua_app_approval' });
  assert.equal((await f.call()).status, 500);
  assert.equal(f.events.at(-1).kind, 'delete');
  assert.equal(f.events.at(-1).id, 'new-user-id');
});
