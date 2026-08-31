-- ACCQUA Sports — Build 1.4.6
-- Corrige RPCs de Aulas que falham com:
--   column reference "status" is ambiguous
--
-- O erro ocorre em PL/pgSQL quando um nome de coluna (ex.: status) também é
-- exposto como variável/parâmetro de saída da função. Em vez de recriar a
-- lógica de reserva sem conhecer o estado do banco de produção, recompilamos
-- as funções existentes com a diretiva oficial do PL/pgSQL para preferir a
-- coluna SQL nesses conflitos. A lógica, grants, SECURITY DEFINER e assinatura
-- de cada função permanecem exatamente os mesmos.

DO $migration$
DECLARE
  fn record;
  definition text;
  body_tag text;
  tag_position integer;
  patched_definition text;
  reserve_function_found boolean := false;
BEGIN
  FOR fn IN
    SELECT p.oid, p.proname
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    JOIN pg_language AS l ON l.oid = p.prolang
    WHERE n.nspname = 'public'
      AND l.lanname = 'plpgsql'
      AND p.proname = ANY (ARRAY[
        'reserve_accqua_class',
        'cancel_my_accqua_class',
        'get_accqua_classes_agenda',
        'get_my_accqua_classes',
        'list_accqua_class_reservations'
      ])
  LOOP
    IF fn.proname = 'reserve_accqua_class' THEN
      reserve_function_found := true;
    END IF;

    definition := pg_get_functiondef(fn.oid);

    -- Migração idempotente: não altera uma função já recompilada.
    IF position('#variable_conflict use_column' IN definition) > 0 THEN
      CONTINUE;
    END IF;

    -- pg_get_functiondef usa um delimitador dollar-quoted ($function$ ou $$).
    -- Inserimos a diretiva como primeira instrução do corpo PL/pgSQL.
    body_tag := substring(definition FROM '\$[A-Za-z0-9_]*\$');
    IF body_tag IS NULL OR body_tag = '' THEN
      RAISE EXCEPTION 'ACCQUA 1.4.6: não foi possível localizar o corpo da função %', fn.proname;
    END IF;

    tag_position := strpos(definition, body_tag);
    IF tag_position <= 0 THEN
      RAISE EXCEPTION 'ACCQUA 1.4.6: delimitador inválido na função %', fn.proname;
    END IF;

    patched_definition := overlay(
      definition
      placing body_tag || E'\n#variable_conflict use_column'
      from tag_position
      for char_length(body_tag)
    );

    EXECUTE patched_definition;
  END LOOP;

  IF NOT reserve_function_found THEN
    RAISE EXCEPTION 'ACCQUA 1.4.6: RPC public.reserve_accqua_class não encontrada; revise o schema antes do deploy';
  END IF;
END
$migration$;

-- Verificação pós-migração. Falha o deploy se a RPC de reserva não tiver sido
-- recompilada conforme esperado.
DO $verify$
DECLARE
  valid_count integer;
BEGIN
  SELECT count(*)
    INTO valid_count
  FROM pg_proc AS p
  JOIN pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'reserve_accqua_class'
    AND position('#variable_conflict use_column' IN pg_get_functiondef(p.oid)) > 0;

  IF valid_count = 0 THEN
    RAISE EXCEPTION 'ACCQUA 1.4.6: validação da reserve_accqua_class falhou';
  END IF;
END
$verify$;
