import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import {
  ENABLE_GOOGLE_AUTH,
  getSupabaseClient,
  isSupabaseConfigured,
  SITE_URL,
} from '@/lib/supabaseClient';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  googleEnabled: boolean;
  signInAsGuest: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  upgradeGuestWithEmail: (input: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  upgradeGuestWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const user = session?.user ?? null;
  const isGuest = configured
    ? Boolean((user as unknown as { is_anonymous?: boolean } | null)?.is_anonymous)
    : true;

  const signInAsGuest = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(error.message);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Demo preview mode: connect Supabase to sign in with an account.');
      }

      // If currently a guest with items in cart, capture items to merge after signing into an existing account
      let guestItemsToMerge: Array<{
        productId: string;
        variantId: string;
        quantity: number;
        personalization?: { text: string; foilColor?: string; fontStyle?: string; note?: string } | null;
      }> = [];

      if (session?.user && isGuest) {
        try {
          const guestCart = await apiClient.getCart();
          guestItemsToMerge = guestCart.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            personalization: i.personalization,
          }));
        } catch {
          guestItemsToMerge = [];
        }
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);

      if (guestItemsToMerge.length > 0) {
        await apiClient.mergeGuestCart(guestItemsToMerge);
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    },
    [isGuest, queryClient, session?.user],
  );

  const registerWithEmail = useCallback(
    async (input: { email: string; password: string; fullName: string; phone?: string }) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Demo preview mode: connect Supabase to register a real account.');
      }

      // If already signed in as an anonymous guest, upgrade in place to preserve cart & wishlist
      if (session?.user && isGuest) {
        const { data, error } = await supabase.auth.updateUser(
          {
            email: input.email,
            password: input.password,
            data: { full_name: input.fullName, phone: input.phone ?? '' },
          },
          { emailRedirectTo: `${SITE_URL}/auth/callback` },
        );
        if (error) throw new Error(error.message);
        await apiClient.updateProfile({ fullName: input.fullName, phone: input.phone ?? '' }).catch(() => {});
        return { needsEmailConfirmation: !data.user?.email_confirmed_at };
      }

      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.fullName, phone: input.phone ?? '' },
          emailRedirectTo: `${SITE_URL}/auth/callback`,
        },
      });
      if (error) throw new Error(error.message);
      return { needsEmailConfirmation: !data.session };
    },
    [isGuest, session?.user],
  );

  const upgradeGuestWithEmail = useCallback(
    async (input: { email: string; password: string; fullName: string }) => {
      return registerWithEmail(input);
    },
    [registerWithEmail],
  );

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !ENABLE_GOOGLE_AUTH) {
      throw new Error('Google login is not enabled.');
    }

    if (session?.user && isGuest) {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: `${SITE_URL}/auth/callback` },
      });
      if (error) throw new Error(error.message);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${SITE_URL}/auth/callback` },
    });
    if (error) throw new Error(error.message);
  }, [isGuest, session?.user]);

  const upgradeGuestWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Demo preview mode: password reset requires Supabase.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Demo preview mode: password updates require Supabase.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemoMode: !configured,
        isGuest,
        isAuthenticated: Boolean(user),
        googleEnabled: configured && ENABLE_GOOGLE_AUTH,
        signInAsGuest,
        signInWithEmail,
        registerWithEmail,
        upgradeGuestWithEmail,
        signInWithGoogle,
        upgradeGuestWithGoogle,
        sendPasswordReset,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
