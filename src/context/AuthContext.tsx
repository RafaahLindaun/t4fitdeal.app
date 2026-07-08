import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { DietAccess, Profile } from "../lib/types";
import {
  canApproveStudents,
  canManageClasses,
  canManageDiet,
  canManageStaff,
  canManageStore,
  canManageStudents,
  canManageWorkouts,
  isStaffRole,
} from "../lib/permissions";

interface AuthValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  dietAccess: DietAccess | null;
  loading: boolean;
  profileError: string;
  isConfigured: boolean;
  isStaff: boolean;
  needsOnboarding: boolean;
  canManageStudents: boolean;
  canApproveStudents: boolean;
  canManageWorkouts: boolean;
  canManageDiet: boolean;
  canManageStore: boolean;
  canManageClasses: boolean;
  canManageStaff: boolean;
  refreshProfile: () => Promise<void>;
  refreshDietAccess: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function profileNeedsOnboarding(profile: Profile | null) {
  if (!profile) return false;
  if (profile.role !== "student") return false;
  return !profile.full_name || !profile.cpf || !profile.phone || !profile.emergency_phone;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dietAccess, setDietAccess] = useState<DietAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const mountedRef = useRef(true);

  const loadDietAccess = useCallback(async (userId?: string) => {
    const id = userId;
    if (!id || !isSupabaseConfigured) {
      setDietAccess(null);
      return;
    }
    const { data, error } = await supabase
      .from("diet_access")
      .select("user_id,status,source,starts_at,expires_at")
      .eq("user_id", id)
      .maybeSingle();
    if (!mountedRef.current) return;
    if (error) {
      setDietAccess(null);
      return;
    }
    setDietAccess(data as DietAccess | null);
  }, []);

  const loadProfile = useCallback(async (user?: User | null) => {
    const currentUser = user;
    if (!currentUser || !isSupabaseConfigured) {
      setProfile(null);
      setDietAccess(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (!mountedRef.current) return;

    if (error) {
      setProfileError(error.message);
      setProfile(null);
      return;
    }

    if (!data) {
      // O trigger do Supabase normalmente cria o perfil. Este upsert é uma proteção
      // para projetos antigos nos quais o trigger ainda não existia.
      const payload = {
        id: currentUser.id,
        email: currentUser.email,
        full_name:
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          "Aluno",
        avatar_url:
          currentUser.user_metadata?.avatar_url ||
          currentUser.user_metadata?.picture ||
          null,
        role: "student",
        status: "pending",
      };
      const created = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .single();
      if (!mountedRef.current) return;
      if (created.error) {
        setProfileError(created.error.message);
        return;
      }
      setProfile(created.data as Profile);
    } else {
      setProfile(data as Profile);
      setProfileError("");
    }
    await loadDietAccess(currentUser.id);
  }, [loadDietAccess]);

  useEffect(() => {
    mountedRef.current = true;
    const startedAt = Date.now();

    async function boot() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mountedRef.current) return;
      const nextSession = data.session || null;
      setSession(nextSession);
      if (nextSession?.user) await loadProfile(nextSession.user);
      const minLoading = Math.max(0, 1100 - (Date.now() - startedAt));
      window.setTimeout(() => mountedRef.current && setLoading(false), minLoading);
    }

    void boot();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mountedRef.current) return;
      setSession(nextSession);
      if (nextSession?.user) await loadProfile(nextSession.user);
      else {
        setProfile(null);
        setDietAccess(null);
      }
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const role = profile?.role;
  const value = useMemo<AuthValue>(() => ({
    session,
    user: session?.user || null,
    profile,
    dietAccess,
    loading,
    profileError,
    isConfigured: isSupabaseConfigured,
    isStaff: isStaffRole(role),
    needsOnboarding: profileNeedsOnboarding(profile),
    canManageStudents: canManageStudents(role),
    canApproveStudents: canApproveStudents(role),
    canManageWorkouts: canManageWorkouts(role),
    canManageDiet: canManageDiet(role),
    canManageStore: canManageStore(role),
    canManageClasses: canManageClasses(role),
    canManageStaff: canManageStaff(role),
    refreshProfile: async () => { await loadProfile(session?.user); },
    refreshDietAccess: async () => { if (session?.user?.id) await loadDietAccess(session.user.id); },
    signOut: async () => { await supabase.auth.signOut(); },
  }), [session, profile, dietAccess, loading, profileError, role, loadProfile, loadDietAccess]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return context;
}
