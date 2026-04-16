-- Función RPC para obtener teléfono de auth.users.user_metadata dado un user_id
-- Mantiene 3FN (no duplica teléfono en profiles)
-- SECURITY DEFINER permite acceso desde frontend con anon key

CREATE OR REPLACE FUNCTION get_user_phone(user_id uuid)
RETURNS text AS $$
SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant ejecución a anon y authenticated
GRANT EXECUTE ON FUNCTION get_user_phone(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_user_phone(uuid) TO authenticated;
