-- ACCQUA 1.7.0 security hotfix, carried forward into 1.7.1.
-- Internal helpers must not be public RPC endpoints.
-- Callers in the database are SECURITY DEFINER functions owned by postgres.
revoke execute on function public.accqua_profile_email_v8(uuid) from public, anon, authenticated;
revoke execute on function public.accqua_profile_name_v8(uuid) from public, anon, authenticated;
grant execute on function public.accqua_profile_email_v8(uuid) to service_role;
grant execute on function public.accqua_profile_name_v8(uuid) to service_role;

-- Keep the legacy self-profile fallback, but enforce the caller's table RLS.
alter view public.accqua_ranking_v8_5 set (security_invoker = true);
