-- =============================================
-- SCRIPT PARA CREAR USUARIOS BASE DEL SISTEMA
-- Sistema: ISTCAJASCHAT - IESTP AACD
-- =============================================
-- 
-- IMPORTANTE: Este script asume que YA creaste los usuarios en Authentication
-- Sigue estos pasos:
--
-- PASO 1: Crear usuarios en Supabase Authentication
-- =============================================
-- Ve a: Supabase Dashboard → Authentication → Users → Add User
-- 
-- Crear estos 3 usuarios:
--
-- 1. ADMINISTRADOR
--    Email: admin@institutocajas.edu.pe
--    Password: Admin@Cajas2025
--    Auto Confirm User: ✅ (activar)
--    User Metadata: 
--    {
--      "rol": "administrador",
--      "nombre": "Administrador",
--      "apellido": "Sistema"
--    }
--
-- 2. INVESTIGADOR
--    Email: investigador@institutocajas.edu.pe
--    Password: Invest@2025
--    Auto Confirm User: ✅ (activar)
--    User Metadata:
--    {
--      "rol": "investigador",
--      "nombre": "Juan",
--      "apellido": "Pérez"
--    }
--
-- 3. EVALUADOR
--    Email: evaluador@institutocajas.edu.pe
--    Password: Evalua@2025
--    Auto Confirm User: ✅ (activar)
--    User Metadata:
--    {
--      "rol": "evaluador",
--      "nombre": "María",
--      "apellido": "García"
--    }
--
-- =============================================
-- PASO 2: Ejecutar este script SQL
-- =============================================
-- Este script vinculará automáticamente los usuarios de Authentication
-- con la tabla usuarios
--
-- Limpiar usuarios existentes (OPCIONAL - solo si quieres empezar de cero)
-- DELETE FROM usuarios WHERE email IN (
--     'admin@institutocajas.edu.pe',
--     'investigador@institutocajas.edu.pe',
--     'evaluador@institutocajas.edu.pe'
-- );
-- Vincular usuarios de Authentication con tabla usuarios
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
SELECT raw_user_meta_data->>'nombre' as nombre,
    raw_user_meta_data->>'apellido' as apellido,
    email,
    raw_user_meta_data->>'rol' as rol,
    id as auth_user_id
FROM auth.users
WHERE email IN (
        'admin@institutocajas.edu.pe',
        'investigador@institutocajas.edu.pe',
        'evaluador@institutocajas.edu.pe'
    ) ON CONFLICT (email) DO
UPDATE
SET nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    rol = EXCLUDED.rol,
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = NOW();
-- Verificar que se crearon correctamente
SELECT '=== USUARIOS CREADOS ===' AS resultado;
SELECT u.nombre,
    u.apellido,
    u.email,
    u.rol,
    CASE
        WHEN u.auth_user_id IS NOT NULL THEN '✅ Vinculado'
        ELSE '❌ Sin vincular'
    END as estado,
    u.created_at
FROM usuarios u
WHERE u.email IN (
        'admin@institutocajas.edu.pe',
        'investigador@institutocajas.edu.pe',
        'evaluador@institutocajas.edu.pe'
    )
ORDER BY CASE
        u.rol
        WHEN 'administrador' THEN 1
        WHEN 'investigador' THEN 2
        WHEN 'evaluador' THEN 3
    END;
-- =============================================
-- INFORMACIÓN ADICIONAL
-- =============================================
SELECT '=== INFORMACIÓN DE AUTHENTICATION ===' AS info;
SELECT email,
    raw_user_meta_data->>'rol' as rol,
    raw_user_meta_data->>'nombre' as nombre,
    raw_user_meta_data->>'apellido' as apellido,
    email_confirmed_at,
    CASE
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
        ELSE '⚠️ No confirmado'
    END as estado_email
FROM auth.users
WHERE email IN (
        'admin@institutocajas.edu.pe',
        'investigador@institutocajas.edu.pe',
        'evaluador@institutocajas.edu.pe'
    )
ORDER BY email;
-- =============================================
-- SI RECIBES ERROR: "usuario no existe en auth"
-- =============================================
-- Significa que olvidaste crear el usuario en Authentication primero.
-- Ve al PASO 1 arriba y crea los usuarios desde el dashboard.
--
-- =============================================
-- SI RECIBES ERROR: "duplicate key value"
-- =============================================
-- Significa que el usuario ya existe en la tabla usuarios.
-- Puedes descomentar el DELETE al inicio de este script y ejecutar de nuevo.
-- =============================================