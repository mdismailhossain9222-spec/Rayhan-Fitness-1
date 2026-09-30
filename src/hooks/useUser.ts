"use client";

/**
 * useUser() — real-time Supabase auth state for Client Components.
 * Subscribes to `supabase.auth.onAuthStateChange()` so the UI stays in
 * sync across tabs (login/logout/token refresh) without a page reload.
 *
 * Returns: { user, profile, role, loading, configured,
 *            signOut, signOutEverywhere, refreshProfile }
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/supabase/types";

interface UseUserResult {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (mounted.current) setProfile((data as Profile | null) ?? null);
    } catch {
      if (mounted.current) setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    const {
      data: { user: current },
    } = await supabase.auth.getUser();
    if (current) {
      if (mounted.current) setUser(current);
      await fetchProfile(current.id);
    }
  }, [fetchProfile]);

  useEffect(() => {
    mounted.current = true;
    // Intentional: initialize Supabase auth state on mount
    if (!isSupabaseConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    const supabase = createClient();

    // Initial session check.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted.current) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          void fetchProfile(session.user.id).finally(() => {
            if (mounted.current) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted.current) setLoading(false);
      });

    // Real-time subscription (login/logout/refresh, cross-tab).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted.current) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await createClient().auth.signOut(); // this device only
  }, []);

  const signOutEverywhere = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await createClient().auth.signOut({ scope: "global" }); // all devices
  }, []);

  return {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    configured: isSupabaseConfigured,
    signOut,
    signOutEverywhere,
    refreshProfile,
  };
}
