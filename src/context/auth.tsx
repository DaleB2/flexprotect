import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Ctx = {
  user: any | null;
  loading: boolean;
  userId: string | null;
  signIn: (email: string, pw: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, pw: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      loading,
      userId: user?.id ?? null,
      signIn: async (email, pw) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        return { error: error?.message };
      },
      signUp: async (name, email, pw) => {
        const { error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { data: { full_name: name } },
        });
        return { error: error?.message };
      },
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return { error: error?.message };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
