-- ACCQUA Sports — Build 1.5.4
-- Corrige referência ambígua de matricula_observacao no fluxo
-- "Marcar como pendente" sem alterar o contrato público do RPC.

create or replace function public.update_accqua_student_membership_v1_4_1(
  p_student_id uuid,
  p_payment_day integer default null::integer,
  p_last_payment date default null::date,
  p_valid_until date default null::date,
  p_notes text default null::text,
  p_confirmed boolean default true
)
returns table(
  id uuid,
  numero_gympass text,
  matricula_valida_ate date,
  matricula_dia_pagamento smallint,
  matricula_ultimo_pagamento date,
  matricula_confirmada_em timestamptz,
  matricula_observacao text
)
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_catalog'
as $function$
declare
  v_payment_day smallint;
  v_valid_until date;
begin
  if not public.accqua_classes_is_staff() then
    raise exception using message = 'ACCQUA_STAFF_REQUIRED';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_student_id) then
    raise exception using message = 'ACCQUA_STUDENT_NOT_FOUND';
  end if;

  if p_confirmed then
    if p_last_payment is null then
      raise exception using message = 'ACCQUA_MEMBERSHIP_PAYMENT_DATE_REQUIRED';
    end if;

    v_payment_day := coalesce(nullif(p_payment_day, 0), extract(day from p_last_payment)::integer)::smallint;
    if v_payment_day < 1 or v_payment_day > 31 then
      raise exception using message = 'ACCQUA_MEMBERSHIP_PAYMENT_DAY_INVALID';
    end if;

    v_valid_until := coalesce(p_valid_until, (p_last_payment + interval '1 month')::date);
    if v_valid_until < p_last_payment then
      raise exception using message = 'ACCQUA_MEMBERSHIP_VALIDITY_INVALID';
    end if;

    update public.profiles as prof
       set matricula_dia_pagamento = v_payment_day,
           matricula_ultimo_pagamento = p_last_payment,
           matricula_valida_ate = v_valid_until,
           matricula_confirmada_em = now(),
           matricula_confirmada_por = auth.uid(),
           matricula_observacao = nullif(trim(coalesce(p_notes, '')), '')
     where prof.id = p_student_id;
  else
    update public.profiles as prof
       set matricula_valida_ate = null,
           matricula_confirmada_em = null,
           matricula_confirmada_por = null,
           matricula_observacao = nullif(trim(coalesce(p_notes, prof.matricula_observacao, '')), '')
     where prof.id = p_student_id;
  end if;

  return query
  select
    p.id,
    coalesce(p.numero_gympass, ''),
    p.matricula_valida_ate,
    p.matricula_dia_pagamento,
    p.matricula_ultimo_pagamento,
    p.matricula_confirmada_em,
    coalesce(p.matricula_observacao, '')
  from public.profiles p
  where p.id = p_student_id;
end;
$function$;
