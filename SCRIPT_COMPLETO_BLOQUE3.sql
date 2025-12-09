-- =====================================================
-- EJECUCIÓN COMPLETA BLOQUE 3 - UN SOLO SCRIPT
-- =====================================================
-- Copia ESTE SCRIPT COMPLETO y pégalo en el SQL Editor
-- Este script hace TODO automáticamente
-- =====================================================

-- PASO 1: Obtener y mostrar el UUID
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Obtener el UUID del usuario auth
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = 'cordedwinegsep@gmail.com';
    
    -- Mostrar el UUID para referencia
    RAISE NOTICE 'UUID del usuario: %', user_uuid;
    
    -- PASO 2: Insertar en tabla usuarios
    -- Primero eliminar si existe (para evitar duplicados)
    DELETE FROM usuarios WHERE email = 'admin@institutocajas.edu.pe';
    
    -- Insertar el nuevo admin
    INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
    VALUES ('Administrador', 'Sistema', 'admin@institutocajas.edu.pe', 'administrador', user_uuid);
    
    -- Confirmar
    RAISE NOTICE 'Usuario administrador vinculado exitosamente';
END $$;

-- PASO 3: Verificar que se creó correctamente
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.email,
    u.rol,
    u.auth_user_id,
    au.email as gmail_vinculado,
    CASE 
        WHEN u.auth_user_id IS NOT NULL THEN 'Usuario vinculado correctamente'
        ELSE 'ERROR: Usuario no vinculado'
    END as status
FROM usuarios u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'admin@institutocajas.edu.pe';

-- =====================================================
-- IMPORTANTE: Después de ejecutar este script
-- =====================================================
-- 1. Verifica que veas "Usuario vinculado correctamente" en la columna status
-- 2. Verifica que "gmail_vinculado" sea: cordedwinegsep@gmail.com
-- 3. Copia el valor de "auth_user_id" que aparece
-- 4. Ve a Authentication → Users → Click en cordedwinegsep@gmail.com
-- 5. Edita User Metadata y agrega:
--    {"rol":"administrador","nombre":"Administrador","apellido":"Sistema"}
-- 6. Prueba login con: admin / Admin@Cajas2025
-- =====================================================
