import { supabase } from './client.js';

export async function getAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user || null;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session || null;
}

export async function signInWithPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email, password, data) {
  return supabase.auth.signUp({
    email,
    password,
    options: data ? { data } : undefined
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getProfile(userId) {
  if (!userId) return { data: null, error: new Error('userId required') };
  return supabase
    .from('profiles')
    .select('id, full_name, phone, role, edad, sexo')
    .eq('id', userId)
    .maybeSingle();
}

export async function upsertProfile(profile) {
  return supabase.from('profiles').upsert(profile, { onConflict: 'id' }).select().single();
}
