-- ==============================================
-- SOLUCIÓN FINAL: Deshabilitar RLS en tabla usuarios
-- Ejecuta esto en Supabase SQL Editor
-- ==============================================

-- 1. Deshabilitar RLS
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden insertar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden actualizar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden eliminar usuarios" ON usuarios;

-- 3. Verificar que NO hay políticas
SELECT policyname FROM pg_policies WHERE tablename = 'usuarios';
-- Debe retornar resultado vacío

-- 4. Verificar que RLS está deshabilitado
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'usuarios';
-- rowsecurity debe ser FALSE

-- ==============================================
-- AHORA PRUEBA EL LOGIN
-- ==============================================
