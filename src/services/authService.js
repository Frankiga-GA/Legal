import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut as amplifySignOut, fetchAuthSession, resetPassword } from 'aws-amplify/auth';
import { supabase } from '../utils/supabase';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_c9cyZqxAY',
      userPoolClientId: '36phgsf9kjtlhehqvs339hmu45',
      identityPoolId: '', 
      loginWith: {
        email: true,
      },
    }
  }
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

async function performTokenExchange(cognitoToken) {
  const res = await fetch(`${BACKEND_URL}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: cognitoToken })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Error validando sesión');
  }
  const data = await res.json();
  
  // Set the session in Supabase so RLS works!
  await supabase.auth.setSession({
    access_token: data.supabase_token,
    refresh_token: data.supabase_token,
  });
  
  return { user: { id: data.user_id }, access_token: data.supabase_token };
}

export const getCurrentSession = async () => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) return null;
    
    // Exchange Cognito token for Supabase token
    const cognitoIdToken = session.tokens.idToken.toString();
    const supabaseSession = await performTokenExchange(cognitoIdToken);
    return supabaseSession;
  } catch (error) {
    // Si falla (ej. expiró en Cognito), deslogueamos de Supabase también
    if (supabase) await supabase.auth.signOut();
    return null;
  }
};

export const signInWithEmail = async ({ email, password }) => {
  try {
    const { isSignedIn, nextStep } = await signIn({ username: email, password });
    if (!isSignedIn) {
      if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        throw new Error('Debes confirmar tu correo electrónico antes de iniciar sesión.');
      }
      throw new Error('Credenciales inválidas o paso adicional requerido');
    }
    
    return await getCurrentSession();
  } catch (err) {
    throw new Error(err.message || 'Error al iniciar sesión');
  }
};

export const signInWithGoogle = async () => {
  throw new Error('Inicio de sesión con Google no soportado con Cognito.');
};

export const signInWithMagicLink = async () => {
  throw new Error('Inicio de sesión con Magic Link no soportado con Cognito.');
};

export const signUpWithEmail = async ({ email, password, fullName, dni, company }) => {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        }
      }
    });
    // Note: fullName, dni, company are skipped here.
    // LUSTI currently saves them in Supabase after successful login.
    return { id: userId };
  } catch (err) {
    throw new Error(err.message || 'Error al registrarse');
  }
};

export const signOut = async () => {
  try {
    await amplifySignOut();
  } catch (e) {
    console.warn('Error signing out of Cognito', e);
  }
  if (supabase) {
    await supabase.auth.signOut();
  }
};

export const sendPasswordReset = async ({ email }) => {
  try {
    await resetPassword({ username: email });
  } catch (err) {
    throw new Error(err.message || 'Error al resetear contraseña');
  }
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
