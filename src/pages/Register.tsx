import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import { InputField, SelectField, TextareaField } from "../components/Field";
import { supabase } from "../lib/supabase";
import { onlyDigits } from "../lib/format";

interface FormState {
  full_name: string; cpf: string; birth_date: string; email: string; phone: string;
  emergency_phone: string; password: string; confirm_password: string; gender: string;
  weight_kg: string; height_cm: string; activity_level: string; objective: string;
  dietary_restrictions: string; food_preferences: string; address: string; city: string;
}

const initial: FormState = {
  full_name: "", cpf: "", birth_date: "", email: "", phone: "", emergency_phone: "",
  password: "", confirm_password: "", gender: "", weight_kg: "", height_cm: "",
  activity_level: "moderado", objective: "", dietary_restrictions: "", food_preferences: "",
  address: "", city: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const professorAccount = useMemo(() => form.email.toLowerCase().endsWith("@professor.com"), [form.email]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!form.full_name.trim() || onlyDigits(form.cpf).length !== 11 || !form.phone || !form.emergency_phone) {
      setMessage("Preencha nome, CPF, telefone e contato de emergência corretamente.");
      return;
    }
    if (!form.email.includes("@") || form.password.length < 8 || form.password !== form.confirm_password) {
      setMessage("Confira o e-mail. A senha deve ter 8 caracteres e as duas senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    const metadata = {
      full_name: form.full_name.trim(), cpf: onlyDigits(form.cpf), birth_date: form.birth_date || null,
      phone: form.phone.trim(), emergency_phone: form.emergency_phone.trim(), gender: form.gender || null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      activity_level: form.activity_level, objective: form.objective.trim(),
      dietary_restrictions: form.dietary_restrictions.trim(), food_preferences: form.food_preferences.trim(),
      address: form.address.trim(), city: form.city.trim(),
    };
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(), password: form.password,
      options: { data: metadata, emailRedirectTo: `${window.location.origin}/aguardando` },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) setMessage("Esse e-mail já possui cadastro. Volte para entrar.");
      else setMessage(error.message);
      return;
    }
    if (data.session) navigate(professorAccount ? "/home" : "/aguardando", { replace: true });
    else navigate("/cadastro-enviado", { replace: true, state: { professorAccount } });
  }

  return (
    <div className="auth-page register-page">
      <div className="status-bar"><strong>9:41</strong><span>▮▮▮  Wi‑Fi  ▱</span></div>
      <section className="register-panel">
        <header><Link className="icon-button" to="/login"><Icon name="back"/></Link><Logo compact/><span/></header>
        <div className="page-title"><h1>Primeiro acesso</h1><p>Preencha seus dados. A recepção confirmará sua matrícula antes de liberar o aplicativo.</p></div>
        {professorAccount && <div className="notice info"><Icon name="dumbbell"/><span>Conta de professor detectada. O acesso só será liberado se o domínio e o e-mail estiverem autorizados no Supabase.</span></div>}
        <form className="form-grid register-form" onSubmit={submit}>
          <InputField label="Nome completo" required value={form.full_name} onChange={(e) => update("full_name", e.target.value)}/>
          <InputField label="CPF" required inputMode="numeric" value={form.cpf} onChange={(e) => update("cpf", e.target.value)}/>
          <InputField label="Data de nascimento" type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)}/>
          <SelectField label="Sexo" value={form.gender} onChange={(e) => update("gender", e.target.value)}><option value="">Prefiro não informar</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="outro">Outro</option></SelectField>
          <InputField label="E-mail" required type="email" value={form.email} onChange={(e) => update("email", e.target.value)}/>
          <InputField label="Telefone" required value={form.phone} onChange={(e) => update("phone", e.target.value)}/>
          <InputField label="Telefone de emergência" required value={form.emergency_phone} onChange={(e) => update("emergency_phone", e.target.value)}/>
          <InputField label="Cidade" value={form.city} onChange={(e) => update("city", e.target.value)}/>
          <InputField label="Endereço" value={form.address} onChange={(e) => update("address", e.target.value)}/>
          <InputField label="Peso atual (kg)" type="number" min="20" max="350" step="0.1" value={form.weight_kg} onChange={(e) => update("weight_kg", e.target.value)}/>
          <InputField label="Altura (cm)" type="number" min="100" max="240" value={form.height_cm} onChange={(e) => update("height_cm", e.target.value)}/>
          <SelectField label="Nível de atividade" value={form.activity_level} onChange={(e) => update("activity_level", e.target.value)}><option value="baixo">Baixo</option><option value="moderado">Moderado</option><option value="alto">Alto</option></SelectField>
          <TextareaField label="Seu objetivo" placeholder="Emagrecimento, hipertrofia, condicionamento..." value={form.objective} onChange={(e) => update("objective", e.target.value)}/>
          <TextareaField label="Restrições alimentares" placeholder="Alergias, intolerâncias ou restrições" value={form.dietary_restrictions} onChange={(e) => update("dietary_restrictions", e.target.value)}/>
          <TextareaField label="Preferências alimentares" placeholder="Alimentos de que gosta ou deseja evitar" value={form.food_preferences} onChange={(e) => update("food_preferences", e.target.value)}/>
          <InputField label="Crie sua senha" required type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)}/>
          <InputField label="Confirme a senha" required type="password" minLength={8} value={form.confirm_password} onChange={(e) => update("confirm_password", e.target.value)}/>
          {message && <div className="form-message error span-2">{message}</div>}
          <button className="button primary large span-2" disabled={busy}>{busy ? "Enviando cadastro..." : "Enviar cadastro"}</button>
        </form>
        <p className="disclaimer">Ao continuar, você confirma que os dados são verdadeiros. Informações nutricionais são estimativas e não substituem acompanhamento profissional.</p>
      </section>
    </div>
  );
}
