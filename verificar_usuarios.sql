-- =============================================
-- SCRIPT DE VERIFICACIÓN DE USUARIOS
-- Sistema: ISTCAJASCHAT - IESTP AACD
-- =============================================
-- =============================================
-- PARTE 1: Usuarios en Authentication
-- =============================================
SELECT '=== USUARIOS EN AUTH.USERS ===' AS seccion;
SELECT id as auth_user_id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'rol' as rol_metadata,
    raw_user_meta_data->>'nombre' as nombre_metadata,
    raw_user_meta_data->>'apellido' as apellido_metadata,
    CASE
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
        ELSE '⚠️ No confirmado'
    END as estado_email
FROM auth.users
ORDER BY created_at DESC;
-- =============================================
-- PARTE 2: Usuarios en Tabla USUARIOS
-- =============================================
SELECT '=== USUARIOS EN TABLA USUARIOS ===' AS seccion;
SELECT id,
    nombre,
    apellido,
    email,
    rol,
    auth_user_id,
    created_at,
    CASE
        WHEN auth_user_id IS NOT NULL THEN '✅ Vinculado'
        ELSE '❌ Sin vincular'
    END as estado_vinculo
FROM usuarios
ORDER BY created_at DESC;
-- =============================================
-- PARTE 3: Verificación de Vínculos
-- =============================================
SELECT '=== VERIFICACIÓN DE VÍNCULOS AUTH ↔ USUARIOS ===' AS seccion;
SELECT u.email as email_tabla,
    u.nombre,
    u.apellido,
    u.rol,
    u.auth_user_id,
    a.email as email_auth,
    a.email_confirmed_at,
    CASE
        WHEN a.id IS NOT NULL THEN '✅ Vínculo OK'
        ELSE '❌ Vínculo ROTO'
    END as estado_vinculo
FROM usuarios u
    LEFT JOIN auth.users a ON u.auth_user_id = a.id
ORDER BY u.created_at DESC;
-- =============================================
-- PARTE 4: Usuarios en AUTH sin vincular a TABLA
-- =============================================
SELECT '=== USUARIOS EN AUTH SIN REGISTRO EN TABLA ===' AS seccion;
SELECT a.id as auth_user_id,
    a.email,
    a.raw_user_meta_data->>'rol' as rol,
    a.raw_user_meta_data->>'nombre' as nombre,
    a.raw_user_meta_data->>'apellido' as apellido,
    a.created_at
FROM auth.users a
    LEFT JOIN usuarios u ON a.id = u.auth_user_id
WHERE u.id IS NULL
ORDER BY a.created_at DESC;
-- =============================================
-- PARTE 5: Resumen por Rol
-- =============================================
SELECT '=== RESUMEN POR ROL ===' AS seccion;
SELECT rol,
    COUNT(*) as total,
    COUNT(
        CASE
            WHEN auth_user_id IS NOT NULL THEN 1
        END
    ) as vinculados,
    COUNT(
        CASE
            WHEN auth_user_id IS NULL THEN 1
        END
    ) as sin_vincular
FROM usuarios
GROUP BY rol
ORDER BY rol;
-- =============================================
-- PARTE 6: Usuarios Esperados del Sistema
-- =============================================
SELECT '=== VERIFICACIÓN DE USUARIOS BASE ===' AS seccion;
WITH usuarios_esperados AS (
    SELECT 'admin@institutocajas.edu.pe' as email,
        'administrador' as rol
    UNION ALL
    SELECT 'investigador@institutocajas.edu.pe',
        'investigador'
    UNION ALL
    SELECT 'evaluador@institutocajas.edu.pe',
        'evaluador'
)
SELECT e.email,
    e.rol,
    CASE
        WHEN a.id IS NOT NULL THEN '✅'
        ELSE '❌'
    END as existe_auth,
    CASE
        WHEN u.id IS NOT NULL THEN '✅'
        ELSE '❌'
    END as existe_tabla,
    CASE
        WHEN a.id IS NOT NULL
        AND u.id IS NOT NULL
        AND u.auth_user_id = a.id THEN '✅ COMPLETO'
        WHEN a.id IS NOT NULL
        AND u.id IS NULL THEN '⚠️ FALTA TABLA'
        WHEN a.id IS NULL
        AND u.id IS NOT NULL THEN '⚠️ FALTA AUTH'
        ELSE '❌ NO EXISTE'
    END as estado
FROM usuarios_esperados e
    LEFT JOIN auth.users a ON e.email = a.email
    LEFT JOIN usuarios u ON e.email = u.email;
-- =============================================
-- FIN DEL SCRIPT
-- =============================================
-- 
-- INSTRUCCIONES:
-- 1. Copia este script completo
-- 2. Ve a Supabase → SQL Editor → New Query
-- 3. Pega y ejecuta
-- 4. Revisa cada sección para identificar problemas
-- =============================================