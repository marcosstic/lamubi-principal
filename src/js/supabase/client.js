import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://dnulviqrlosuiixgxljo.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_ixq_AqGF_91ojDLjJ2VD8w_8jmCebi0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
