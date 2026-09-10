-- Run with an administrative connection after applying the matching migration.
-- Read-only assertions: never read actual profile values or change application data.
-- Intended for a database containing the ACCQUA schema, not the classes-only fixture.
begin;

do $verify$
declare
  function_signature text;
begin
  foreach function_signature in array array[
    'public.accqua_profile_email_v8(uuid)',
    'public.accqua_profile_name_v8(uuid)'
  ] loop
    if has_function_privilege('anon', function_signature, 'EXECUTE')
       or has_function_privilege('authenticated', function_signature, 'EXECUTE') then
      raise exception 'Client can still execute internal helper: %', function_signature;
    end if;
    if not has_function_privilege('service_role', function_signature, 'EXECUTE') then
      raise exception 'Internal service access was removed: %', function_signature;
    end if;
  end loop;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'accqua_ranking_v8_5'
      and c.relkind = 'v'
      and 'security_invoker=true' = any(c.reloptions)
  ) then
    raise exception 'Legacy ranking view must use caller RLS';
  end if;
end;
$verify$;

set local role anon;
do $verify$
begin
  begin
    perform public.accqua_profile_email_v8('00000000-0000-0000-0000-000000000000'::uuid);
    raise exception 'Anonymous email helper call was not rejected';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public.accqua_profile_name_v8('00000000-0000-0000-0000-000000000000'::uuid);
    raise exception 'Anonymous name helper call was not rejected';
  exception when insufficient_privilege then
    null;
  end;
end;
$verify$;
reset role;

select 'PASS: internal helpers blocked for clients; service access retained; ranking uses caller RLS' as result;
rollback;
