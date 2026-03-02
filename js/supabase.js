// ──────────────────────────────────────────────
// SUPABASE CLIENT + AUTH
// ──────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// These are safe to expose: Row Level Security (RLS) protects data.
// Each user can only read/write their own row.
const SUPABASE_URL = 'https://csknmqrbkcghaebsqhdd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4GMsBlzdXHadSl3NPdzC4Q_EY36MdtR';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) console.warn('Sign in failed:', error.message);
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // If user doesn't exist, sign up
    if (error.message.includes('Invalid login')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + window.location.pathname }
      });
      if (signUpError) return { error: signUpError.message };
      return { needsConfirmation: true };
    }
    return { error: error.message };
  }
  return { user: data.user };
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.reload();
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthChange(cb) {
  supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null);
  });
}
