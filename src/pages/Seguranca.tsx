import { useState } from "react";
import AppShell from "../components/AppShell";
import { Panel } from "../components/ui";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Seguranca() {
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const save = async () => {
    if (!password) return;
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Senha atualizada.");
  };
  return (
    <AppShell title="Segurança" subtitle="Ajuste sua senha e sua sessão.">
      <Panel>
        <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" />
        <button className="primary-btn full-width top-space" onClick={save}>Atualizar senha</button>
        {message ? <div className="notice soft top-space">{message}</div> : null}
        <button className="ghost-btn full-width top-space" onClick={() => signOut()}>Sair da conta</button>
      </Panel>
    </AppShell>
  );
}
