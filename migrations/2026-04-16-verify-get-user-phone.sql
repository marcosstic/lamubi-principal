-- Verificar si la función get_user_phone existe
SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_user_phone';
