import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL não encontrada.");
if (!supabaseAnonKey) throw new Error("VITE_SUPABASE_ANON_KEY não encontrada.");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ essencial para SPA (Vite/React) com OAuth no mobile
    flowType: "pkce",

    // ✅ mantém sessão no dispositivo
    persistSession: true,
    autoRefreshToken: true,

    // ✅ permite o Supabase capturar o retorno do OAuth na URL
    detectSessionInUrl: true,

    // ✅ (recomendado) deixa explícito onde salvar
    storage: window?.localStorage,
    storageKey: "fitdeal-auth",
  },
});
