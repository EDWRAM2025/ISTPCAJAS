-- =====================================================
-- CREAR 7 INVESTIGADORES FALTANTES EN SUPABASE
-- =====================================================
-- IMPORTANTE: Este script actualiza los metadatos de usuarios
-- que YA DEBES HABER CREADO en Authentication → Users
-- =====================================================
-- LISTA DE INVESTIGADORES FALTANTES:
-- 1. pcajusolis@institutocajas.edu.pe
-- 2. mfigueroacb@institutocajas.edu.pe
-- 3. dvargasr@institutocajas.edu.pe
-- 4. eacturizcetam@institutocajas.edu.pe
-- 5. dbegazoa@institutocajas.edu.pe
-- 6. mrojass@institutocajas.edu.pe
-- 7. rarevalom@institutocajas.edu.pe
-- =====================================================
-- PASO 1: Actualizar metadatos de usuarios
-- (Solo funciona después de crear los usuarios en Auth)
-- =====================================================
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Pedro", "apellido": "Caju Solis"}'::jsonb
WHERE email = 'pcajusolis@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Maria", "apellido": "Figueroa CB"}'::jsonb
WHERE email = 'mfigueroacb@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Daniel", "apellido": "Vargas R"}'::jsonb
WHERE email = 'dvargasr@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Eduardo", "apellido": "Acturizce Tam"}'::jsonb
WHERE email = 'eacturizcetam@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Diana", "apellido": "Begazo A"}'::jsonb
WHERE email = 'dbegazoa@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Miguel", "apellido": "Rojas S"}'::jsonb
WHERE email = 'mrojass@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Ricardo", "apellido": "Arevalo M"}'::jsonb
WHERE email = 'rarevalom@institutocajas.edu.pe';
-- =====================================================
-- PASO 2: Vincular en la tabla usuarios
-- =====================================================
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
SELECT raw_user_meta_data->>'nombre' as nombre,
    raw_user_meta_data->>'apellido' as apellido,
    email,
    raw_user_meta_data->>'rol' as rol,
    id as auth_user_id
FROM auth.users
WHERE email IN (
        'pcajusolis@institutocajas.edu.pe',
        'mfigueroacb@institutocajas.edu.pe',
        'dvargasr@institutocajas.edu.pe',
        'eacturizcetam@institutocajas.edu.pe',
        'dbegazoa@institutocajas.edu.pe',
        'mrojass@institutocajas.edu.pe',
        'rarevalom@institutocajas.edu.pe'
    ) ON CONFLICT (email) DO
UPDATE
SET nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    rol = EXCLUDED.rol,
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = NOW();
-- =====================================================
-- PASO 3: Verificar que se crearon correctamente
-- =====================================================
SELECT nombre,
    apellido,
    email,
    rol,
    CASE
        WHEN auth_user_id IS NOT NULL THEN '✅ Vinculado'
        ELSE '❌ NO Vinculado'
    END as estado
FROM usuarios
WHERE email IN (
        'pcajusolis@institutocajas.edu.pe',
        'mfigueroacb@institutocajas.edu.pe',
        'dvargasr@institutocajas.edu.pe',
        'eacturizcetam@institutocajas.edu.pe',
        'dbegazoa@institutocajas.edu.pe',
        'mrojass@institutocajas.edu.pe',
        'rarevalom@institutocajas.edu.pe'
    )
ORDER BY apellido;
-- =====================================================
-- RESUMEN
-- =====================================================
-- Deberías ver 7 usuarios con estado "✅ Vinculado"
-- Si ves "❌ NO Vinculado", es porque no creaste el
-- usuario en Authentication primero
-- =====================================================