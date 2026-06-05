import { supabase } from '../utils/supabase';

export const getCurrentSession = async () => {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const signInWithEmail = async ({ email, password }) => {
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session;
};

export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) throw error;
  return data;
};

export const signUpWithEmail = async ({ email, password }) => {
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const signInWithMagicLink = async ({ email }) => {
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  if (error) throw error;
  return data;
};

export const sendPasswordReset = async ({ email }) => {
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
  return data;
};

const ONBOARDING_KEY = 'lusti-onboarding-completed';

export const hasCompletedOnboarding = (userId) => {
  if (!userId) return true;
  try {
    return window.localStorage.getItem(`${ONBOARDING_KEY}:${userId}`) === '1';
  } catch {
    return true;
  }
};

export const markOnboardingComplete = (userId) => {
  if (!userId) return;
  try {
    window.localStorage.setItem(`${ONBOARDING_KEY}:${userId}`, '1');
  } catch {
    /* noop */
  }
};

export const onAuthStateChange = (callback) => {
  if (!supabase) return { unsubscribe: () => {} };

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return data.subscription;
};
