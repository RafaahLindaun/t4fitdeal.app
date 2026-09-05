-- Build 1.6.5.5 — harden privilege guard.
-- SECURITY DEFINER changes current_user, so service access must be identified
-- from the signed request JWT role, never from the function execution owner.

create or replace function public.accqua_guard_profile_privileges_v1_6_5_5()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_is_service boolean := (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
  );
  actor_is_owner boolean := public.is_accqua_owner_v1_6_5_5();
  target_is_owner boolean := false;
begin
  if tg_op = 'INSERT' then
    if new.role <> 'student'::public.app_role and not actor_is_service and not actor_is_owner then
      raise exception 'staff_role_change_forbidden' using errcode = '42501';
    end if;
    return new;
  end if;

  select exists (
    select 1 from auth.users u
    where u.id = old.id
      and lower(coalesce(u.email, '')) = 'rafaalexandrowitch@professor.com'
  ) into target_is_owner;

  if new.role is distinct from old.role and not actor_is_service and not actor_is_owner then
    raise exception 'staff_role_change_forbidden' using errcode = '42501';
  end if;

  if target_is_owner
     and (
       new.role is distinct from old.role
       or new.status is distinct from old.status
       or new.email is distinct from old.email
     )
     and not actor_is_service
     and not actor_is_owner then
    raise exception 'owner_account_protected' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.accqua_guard_profile_privileges_v1_6_5_5() from public, anon, authenticated;
