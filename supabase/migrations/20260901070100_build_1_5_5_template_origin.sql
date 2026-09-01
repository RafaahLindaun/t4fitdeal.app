create or replace function public.accqua_template_origin_v1_5_5()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.origin is null or new.origin = 'manual' then
    if coalesce(new.payload->>'notes','') ilike '%Sugestão da IA%' then
      new.origin := 'ia_descricao';
    elsif coalesce(new.payload->>'notes','') ilike '%assistente guiado%' then
      new.origin := 'assistente_guiado';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_accqua_template_origin_v1_5_5 on public.workout_program_templates;
create trigger trg_accqua_template_origin_v1_5_5
before insert or update of payload, origin on public.workout_program_templates
for each row execute function public.accqua_template_origin_v1_5_5();
