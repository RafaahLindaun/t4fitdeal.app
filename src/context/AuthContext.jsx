import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

// “banco local”
const USERS_KEY = "fitdeal_users_v1";
const SESSION_KEY = "fitdeal_session_v1";

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function readJSON(key, fallback) {
  try {
    const raw = safeGetItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    safeSetItem(key, JSON.stringify(value));
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // ✅ Rehidrata sessão ao abrir o app
  useEffect(() => {
    const sessionEmail = safeGetItem(SESSION_KEY);
    if (!sessionEmail) return;

    const users = readJSON(USERS_KEY, {});
    const found = users[String(sessionEmail).toLowerCase()];
    if (found) setUser(found);
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
      senha,
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
    safeSetItem(SESSION_KEY, email);

    setUser(newUser);
    return { ok: true };
  }

  function loginWithEmail(emailInput, senhaInput) {
    const email = String(emailInput || "").trim().toLowerCase();
    const senha = String(senhaInput || "").trim();

    const users = readJSON(USERS_KEY, {});
    const found = users[email];
    if (!found) return { ok: false, msg: "Conta não encontrada. Use Sign up." };
    if (found.senha !== senha) return { ok: false, msg: "Senha incorreta." };

    safeSetItem(SESSION_KEY, email);
    setUser(found);
    return { ok: true };
  }

  function updateUser(patch) {
    setUser((prev) => {
      if (!prev) return prev;

      const next = { ...prev, ...patch };
      const users = readJSON(USERS_KEY, {});
      users[next.email.toLowerCase()] = next;
      writeJSON(USERS_KEY, users);

      safeSetItem(SESSION_KEY, next.email.toLowerCase());
      return next;
    });
  }

  function logout() {
    safeRemoveItem(SESSION_KEY);
    setUser(null);
  }

  const value = useMemo(() => ({ user, signup, loginWithEmail, updateUser, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
