-- Función RPC para obtener email de auth.users dado un user_id
-- Mantiene 3FN (no duplica email en profiles)
-- SECURITY DEFINER permite acceso desde frontend con anon key

CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text AS $$
SELECT email FROM auth.users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant ejecución a anon y authenticated
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;
