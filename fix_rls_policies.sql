-- =============================================
-- FIX: Políticas RLS Corregidas para ISTPCAJAS
-- =============================================
-- Este script corrige el error de recursión infinita
-- Ejecuta este script en el SQL Editor de Supabase

-- Primero, eliminar todas las políticas existentes en la tabla usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden insertar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden actualizar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden eliminar usuarios" ON usuarios;

-- =============================================
-- SOLUCIÓN: Usar auth.jwt() para evitar recursión
-- =============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
    ON usuarios FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Los administradores pueden ver todos los usuarios
-- SOLUCIÓN: Guardamos el rol en los metadatos del usuario de auth
CREATE POLICY "Administradores pueden ver todos los usuarios"
    ON usuarios FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador'
    );

-- Los administradores pueden insertar usuarios
CREATE POLICY "Administradores pueden insertar usuarios"
    ON usuarios FOR INSERT
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador'
    );

-- Los administradores pueden actualizar usuarios
CREATE POLICY "Administradores pueden actualizar usuarios"
    ON usuarios FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador'
    );

-- Los administradores pueden eliminar usuarios (excepto a sí mismos)
CREATE POLICY "Administradores pueden eliminar usuarios"
    ON usuarios FOR DELETE
    USING (
        auth.uid() != auth_user_id
        AND (auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador'
    );

-- =============================================
-- IMPORTANTE: Actualizar el usuario administrador existente
-- =============================================
-- Necesitamos asegurarnos de que el usuario administrador tenga
-- el rol en sus metadatos de auth

-- Primero, obtener el auth_user_id del administrador
-- Ejecuta esto y copia el resultado:
SELECT auth_user_id FROM usuarios WHERE email = 'admin@institutocajas.edu.pe';

-- Luego, actualiza los metadatos del usuario en auth.users
-- REEMPLAZA 'UUID_DEL_ADMIN' con el valor obtenido arriba
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{rol}',
    '"administrador"'
)
WHERE id = (
    SELECT auth_user_id 
    FROM usuarios 
    WHERE email = 'admin@institutocajas.edu.pe'
);

-- Verificar que se haya actualizado correctamente
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@institutocajas.edu.pe';
