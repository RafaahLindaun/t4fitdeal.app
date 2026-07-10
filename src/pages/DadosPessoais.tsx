import { useState } from "react";
import AppShell from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { upsertProfile } from "../lib/data";

export default function DadosPessoais() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    cpf: profile?.cpf || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    emergency_phone: profile?.emergency_phone || "",
    goal: profile?.goal || "",
  });

  const save = async () => {
    if (!profile) return;
    await upsertProfile({ id: profile.id, email: form.email, ...form });
    await refreshProfile();
    alert("Dados salvos.");
  };

  return (
    <AppShell title="Dados pessoais" subtitle="Aqui entram as informações principais do aluno.">
      <Panel>
        <SectionTitle title="Informações completas" />
        <div className="stack-10">
          <input className="field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nome completo" />
          <input className="field" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="CPF" />
          <input className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" />
          <input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefone" />
          <input className="field" value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} placeholder="Telefone de emergência" />
          <input className="field" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Objetivo" />
        </div>
        <button className="primary-btn full-width top-space" onClick={save}>Salvar alterações</button>
      </Panel>
    </AppShell>
  );
}
