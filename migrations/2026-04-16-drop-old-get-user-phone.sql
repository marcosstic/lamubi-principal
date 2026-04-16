-- Eliminar función RPC anterior de forma segura
-- Prepara para crear nueva versión que usa user_metadata

DROP FUNCTION IF EXISTS get_user_phone(uuid);
