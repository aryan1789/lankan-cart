/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { User } from '../types';
import { supabase } from '../utils/supabase';
import { fetchProfile, upsertProfileFromAuth } from '../lib/profiles';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  /** True only until the first session is read from storage (avoid redirect flash on checkout, etc.). */
  isBootstrapping: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_ACTION_TIMEOUT_MS = 25_000;

async function withAuthTimeout<T>(label: string, promise: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out — check your network and Supabase URL.`)),
      AUTH_ACTION_TIMEOUT_MS
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

function mapToAppUser(
  authUser: SupabaseUser,
  profileName?: string | null,
  profilePhone?: string | null
): User {
  const meta = authUser.user_metadata as Record<string, unknown> | undefined;
  const metaName =
    profileName ||
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    authUser.email?.split('@')[0] ||
    'Customer';
  const metaPhone =
    profilePhone || (typeof meta?.phone === 'string' ? meta.phone : undefined);
  const avatar =
    (typeof meta?.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta?.picture === 'string' && meta.picture) ||
    undefined;

  return {
    id: authUser.id,
    name: metaName,
    email: authUser.email ?? '',
    phone: metaPhone,
    avatarUrl: avatar,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const hydrateUser = useCallback(async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    const profile = await fetchProfile(authUser.id);
    setUser(
      mapToAppUser(
        authUser,
        profile?.full_name ?? profile?.name ?? null,
        profile?.phone ?? null
      )
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    let authEventVersion = 0;

    const applySessionState = async (nextSession: Session | null, versionAtSchedule: number) => {
      if (!mounted || versionAtSchedule !== authEventVersion) return;
      setSession(nextSession);
      if (nextSession?.user) {
        await upsertProfileFromAuth(nextSession.user);
        if (!mounted || versionAtSchedule !== authEventVersion) return;
        await hydrateUser(nextSession.user);
      } else {
        setUser(null);
      }
    };

    const init = async () => {
      try {
        const {
          data: { session: initial },
        } = await supabase.auth.getSession();

        authEventVersion += 1;
        await applySessionState(initial, authEventVersion);
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventVersion += 1;
      const versionAtSchedule = authEventVersion;
      setSession(nextSession);
      setTimeout(() => {
        void applySessionState(nextSession, versionAtSchedule).catch((err) => {
          console.error('applySessionState', err);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser]);

  const refreshUser = useCallback(async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (u) await hydrateUser(u);
  }, [hydrateUser]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await withAuthTimeout(
        'Sign in',
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
      );
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign in failed.';
      return { ok: false, error: msg };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const { data, error } = await withAuthTimeout(
        'Create account',
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone?.trim() || null,
            },
          },
        })
      );

      if (error) return { ok: false, error: error.message };

      if (!data.user) return { ok: false, error: 'Could not create account.' };

      const needsEmailConfirmation = !data.session;

      try {
        await withAuthTimeout(
          'Saving profile',
          upsertProfileFromAuth(data.user, {
            full_name: name.trim(),
            phone: phone?.trim() || null,
          })
        );
      } catch {
        void upsertProfileFromAuth(data.user, {
          full_name: name.trim(),
          phone: phone?.trim() || null,
        });
      }

      if (data.session) {
        try {
          await withAuthTimeout('Loading profile', hydrateUser(data.user));
        } catch {
          void hydrateUser(data.user);
        }
      } else {
        setUser(null);
      }

      return { ok: true, needsEmailConfirmation };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create account.';
      return { ok: false, error: msg };
    }
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    try {
      const { error } = await withAuthTimeout(
        'Google sign-in',
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        })
      );
      if (error) return { error: error.message };
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Google sign-in failed.' };
    }
  };

  const logout = async () => {
    try {
      await withAuthTimeout('Sign out', supabase.auth.signOut({ scope: 'local' }));
    } catch (err) {
      console.error('signOut', err);
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        register,
        signInWithGoogle,
        logout,
        isBootstrapping,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
