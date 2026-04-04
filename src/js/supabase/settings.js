import { supabase } from './client.js';

const EXCHANGE_RATES_TABLE = 'exchange_rates';
const APP_SETTINGS_TABLE = 'app_settings';

// ============================================================
// Exchange Rates
// ============================================================

export async function getCurrentExchangeRate() {
  const { data, error } = await supabase
    .from(EXCHANGE_RATES_TABLE)
    .select('id, rate, is_current, created_at')
    .eq('is_current', true)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data: data?.rate || null, error: null, row: data };
}

export async function updateExchangeRate(rate, userId) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n <= 0) {
    return { data: null, error: { message: 'Tasa debe ser un número mayor a 0' } };
  }

  // First, mark all existing rates as not current
  await supabase
    .from(EXCHANGE_RATES_TABLE)
    .update({ is_current: false, updated_at: new Date().toISOString() })
    .eq('is_current', true);

  // Then insert the new current rate
  return supabase
    .from(EXCHANGE_RATES_TABLE)
    .insert({ rate: n, is_current: true, created_by: userId || null })
    .select('id, rate, is_current, created_at')
    .single();
}

export async function getExchangeRateHistory() {
  return supabase
    .from(EXCHANGE_RATES_TABLE)
    .select('id, rate, is_current, created_by, created_at')
    .order('created_at', { ascending: false });
}

// ============================================================
// App Settings
// ============================================================

export async function getAppSetting(key) {
  const { data, error } = await supabase
    .from(APP_SETTINGS_TABLE)
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data: data?.value || null, error: null };
}

export async function updateAppSetting(key, value) {
  return supabase
    .from(APP_SETTINGS_TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single();
}

export async function getAllAppSettings() {
  const { data, error } = await supabase
    .from(APP_SETTINGS_TABLE)
    .select('key, value');

  if (error) return { data: null, error };

  // Convert to a simple object for easy access
  const settings = {};
  for (const row of (data || [])) {
    settings[row.key] = row.value;
  }
  return { data: settings, error: null };
}
