\set ON_ERROR_STOP on

DO $verify$
DECLARE
  resolved_status text;
  definition text;
BEGIN
  SELECT r.status INTO resolved_status
  FROM public.reserve_accqua_class() AS r
  LIMIT 1;

  IF resolved_status IS DISTINCT FROM 'reservado' THEN
    RAISE EXCEPTION 'ACCQUA 1.4.6 SQL test: expected reservado, got %', resolved_status;
  END IF;

  SELECT pg_get_functiondef(p.oid)
    INTO definition
  FROM pg_proc AS p
  JOIN pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'reserve_accqua_class'
  LIMIT 1;

  IF position('#variable_conflict use_column' IN coalesce(definition, '')) = 0 THEN
    RAISE EXCEPTION 'ACCQUA 1.4.6 SQL test: function was not recompiled with use_column';
  END IF;
END
$verify$;

SELECT 'ACCQUA Build 1.4.6 classes SQL: OK' AS result;
