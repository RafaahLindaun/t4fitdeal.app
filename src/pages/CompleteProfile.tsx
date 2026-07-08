import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { InputField, SelectField, TextareaField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { onlyDigits } from "../lib/format";
import { supabase } from "../lib/supabase";

export default function CompleteProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: profile?.full_name || user?.user_metadata?.full_name || "", cpf: profile?.cpf || "",
    phone: profile?.phone || "", emergency_phone: profile?.emergency_phone || "",
    birth_date: profile?.birth_date || "", gender: profile?.gender || "", objective: profile?.objective || "",
    weight_kg: profile?.weight_kg?.toString() || "", height_cm: profile?.height_cm?.toString() || "",
    activity_level: profile?.activity_level || "moderado", dietary_restrictions: profile?.dietary_restrictions || "",
    food_preferences: profile?.food_preferences || "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user || onlyDigits(form.cpf).length !== 11 || !form.phone || !form.emergency_phone) {
      setMessage("Preencha CPF, telefone e contato de emergência."); return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      ...form, cpf: onlyDigits(form.cpf), weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    await refreshProfile();
    navigate("/aguardando", { replace: true });
  }

  return <AppShell title="Complete seu cadastro" subtitle="Precisamos destes dados para a recepção confirmar sua matrícula." back hideNav>
    <form className="form-grid" onSubmit={save}>
      <InputField label="Nome completo" value={form.full_name} onChange={(e)=>update("full_name",e.target.value)} required/>
      <InputField label="CPF" value={form.cpf} onChange={(e)=>update("cpf",e.target.value)} required/>
      <InputField label="Telefone" value={form.phone} onChange={(e)=>update("phone",e.target.value)} required/>
      <InputField label="Telefone de emergência" value={form.emergency_phone} onChange={(e)=>update("emergency_phone",e.target.value)} required/>
      <InputField label="Nascimento" type="date" value={form.birth_date} onChange={(e)=>update("birth_date",e.target.value)}/>
      <SelectField label="Sexo" value={form.gender} onChange={(e)=>update("gender",e.target.value)}><option value="">Não informar</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="outro">Outro</option></SelectField>
      <InputField label="Peso (kg)" type="number" value={form.weight_kg} onChange={(e)=>update("weight_kg",e.target.value)}/>
      <InputField label="Altura (cm)" type="number" value={form.height_cm} onChange={(e)=>update("height_cm",e.target.value)}/>
      <TextareaField label="Objetivo" value={form.objective} onChange={(e)=>update("objective",e.target.value)}/>
      <TextareaField label="Restrições alimentares" value={form.dietary_restrictions} onChange={(e)=>update("dietary_restrictions",e.target.value)}/>
      {message && <div className="form-message error span-2">{message}</div>}
      <button className="button primary span-2" disabled={busy}>{busy ? "Salvando..." : "Salvar e enviar para análise"}</button>
    </form>
  </AppShell>;
}
