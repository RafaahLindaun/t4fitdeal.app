// ✅ COLE EM: src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

// “banco local”
const USERS_KEY = "fitdeal_users_v1";      // guarda todos os usuários
const SESSION_KEY = "fitdeal_session_v1";  // guarda qual email está logado

function readJSON(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // ✅ importante

  // ✅ Rehidrata sessão ao abrir o app
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const sessionEmail = localStorage.getItem(SESSION_KEY);
      if (!sessionEmail) {
        setReady(true);
        return;
      }

      const users = readJSON(USERS_KEY, {});
      const found = users[String(sessionEmail).toLowerCase()];
      if (found) setUser(found);
      setReady(true);
    } catch {
      setReady(true);
    }
  }, []);

  function signup(form) {
    const nome = String(form?.nome || "").trim();
    const email = String(form?.email || "").trim().toLowerCase();
    const senha = String(form?.senha || "").trim();
    const altura = String(form?.altura || "").trim();
    const peso = String(form?.peso || "").trim();

    if (!nome) return { ok: false, msg: "Nome é obrigatório." };
    if (!email || !email.includes("@")) return { ok: false, msg: "Email inválido." };
    if (!senha || senha.length < 4) return { ok: false, msg: "Senha muito curta." };

    const users = readJSON(USERS_KEY, {});
    if (users[email]) return { ok: false, msg: "Esse email já tem conta. Use Log in." };

    const newUser = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      nome,
      email,
      senha, // ⚠️ depois troca por auth real
      altura,
      peso,
      objetivo: "hipertrofia",
      frequencia: 4,
      photoUrl: "",
      plano: "basic", // basic | nutri+
      createdAt: Date.now(),
    };

    users[email] = newUser;
    writeJSON(USERS_KEY, users);
    localStorage.setItem(SESSION_KEY, email);

    setUser(newUser);
    setReady(true);
    return { ok: true };
  }

  function loginWithEmail(emailInput, senhaInput) {
    const email = String(emailInput || "").trim().toLowerCase();
    const senha = String(senhaInput || "").trim();

    const users = readJSON(USERS_KEY, {});
    const found = users[email];
    if (!found) return { ok: false, msg: "Conta não encontrada. Use Sign up." };
    if (found.senha !== senha) return { ok: false, msg: "Senha incorreta." };

    localStorage.setItem(SESSION_KEY, email);
    setUser(found);
    setReady(true);
    return { ok: true };
  }

  function updateUser(patch) {
    setUser((prev) => {
      if (!prev) return prev;

      const next = { ...prev, ...patch };
      const users = readJSON(USERS_KEY, {});
      users[next.email.toLowerCase()] = next;
      writeJSON(USERS_KEY, users);

      localStorage.setItem(SESSION_KEY, next.email.toLowerCase());
      return next;
    });
  }

  function logout() {
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, ready, signup, loginWithEmail, updateUser, logout }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
