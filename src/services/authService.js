import { supabase } from '../utils/supabase';

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session;
};

export const signInWithEmail = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.session;
  } catch (err) {
    throw new Error(err.message || 'Error al iniciar sesión');
  }
};

export const signInWithGoogle = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (err) {
    throw new Error(err.message || 'Error con Google');
  }
};

export const signInWithMagicLink = async ({ email }) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (err) {
    throw new Error(err.message || 'Error al enviar magic link');
  }
};

export const signUpWithEmail = async ({ email, password, fullName, dni, company }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          dni,
          company,
        }
      }
    });
    if (error) throw error;
    return data.user;
  } catch (err) {
    throw new Error(err.message || 'Error al registrarse');
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    try {
      window.sessionStorage.removeItem('lusti_self_auth');
    } catch {
      // ignore
    }
  } catch (err) {
    console.error('Error al cerrar sesión', err);
  }
};

export const sendPasswordReset = async ({ email }) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) throw error;
  } catch (err) {
    throw new Error(err.message || 'Error al resetear contraseña');
  }
};

export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session, event);
  });
  return subscription;
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
