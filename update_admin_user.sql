-- =============================================
-- ISTPCAJAS - Actualización Usuario Administrador
-- =============================================
-- IMPORTANTE: Ejecutar este script en Supabase Dashboard → SQL Editor
-- Este script elimina el usuario administrador actual

-- Paso 1: Eliminar registro de la tabla usuarios
DELETE FROM usuarios 
WHERE email = 'admin@institutocajas.edu.pe';

-- Paso 2: El usuario en auth.users se eliminará automáticamente por CASCADE
-- debido a la relación ON DELETE CASCADE en la tabla usuarios

-- =============================================
-- CREACIÓN DEL NUEVO USUARIO
-- =============================================
-- IMPORTANTE: Después de ejecutar este script, crear el nuevo usuario
-- manualmente en Supabase Dashboard → Authentication → Add User

-- Datos del nuevo usuario:
-- Email: cordedwinegsep@gmail.com
-- Password: Admin@Cajas2025
-- User Metadata (agregar en la sección "User Metadata"):
-- {
--   "rol": "administrador",
--   "nombre": "Administrador",
--   "apellido": "Sistema"
-- }

-- =============================================
-- IMPORTANTE: Después de crear el usuario en Authentication,
-- ejecutar este INSERT con el UUID del nuevo usuario
-- =============================================

-- Reemplazar 'NUEVO_AUTH_UUID_AQUI' con el ID del usuario que acabas de crear
-- Lo encuentras en Authentication → Users → Click en el usuario → Copiar el UUID

/*
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
VALUES (
    'Administrador',
    'Sistema',
    'admin@institutocajas.edu.pe',
    'administrador',
    'NUEVO_AUTH_UUID_AQUI'  -- Reemplazar con el UUID real
);
*/

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================
-- 1. El email en Authentication será: cordedwinegsep@gmail.com
-- 2. El email en la tabla usuarios será: admin@institutocajas.edu.pe
-- 3. Los emails de recuperación se enviarán a: cordedwinegsep@gmail.com
-- 4. Para login usar: admin@institutocajas.edu.pe
