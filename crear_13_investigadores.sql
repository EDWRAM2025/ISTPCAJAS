-- =============================================
-- SCRIPT MASIVO: CREAR 13 INVESTIGADORES
-- Sistema: ISTCAJASCHAT - IESTP AACD
-- =============================================
-- 
-- PASO 1: Primero crear los usuarios en Authentication
-- Ve a: Authentication → Users → Add User (hacer esto 13 veces)
-- O usar el siguiente SQL si tienes acceso directo a auth
-- =============================================
-- LISTA DE USUARIOS A CREAR:
-- 1. lcardenasp@institutocajas.edu.pe - Lourdes Lidia Cardenas Perez
-- 2. lrodrigom@institutocajas.edu.pe - Lucia Rodrigo Moscoso
-- 3. lpuentey@institutocajas.edu.pe - Luis David Puente Yalopoma
-- 4. jmerlog@institutocajas.edu.pe - Juan Luis Merlo Galvez
-- 5. ccarhuachir@institutocajas.edu.pe - Ceferino Edwin Carhuachi Ramos
-- 6. fruizy@institutocajas.edu.pe - Fabian Vitaliano Ruiz Yachachi
-- 7. rsandovall@institutocajas.edu.pe - Ronald Gabriel Sandoval Lopez
-- 8. oporras@institutocajas.edu.pe - Omar Castro Porras
-- 9. lbaldeonb@institutocajas.edu.pe - Luz Agnes Baldeon Berrocal
-- 10. kmateoc@institutocajas.edu.pe - Kevin Rolando Mateo Condor
-- 11. lponcem@institutocajas.edu.pe - Luis Jose Ponce Meza
-- 12. jricaldio@institutocajas.edu.pe - Jisenia Paola Ricaldi Ore
-- 13. rmachad@institutocajas.edu.pe - Romario Ruben Macha Damian
-- =============================================
-- PASO 2: Actualizar metadatos de todos los usuarios
-- =============================================
-- Usuario 1: Lourdes Lidia Cardenas Perez
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Lourdes Lidia", "apellido": "Cardenas Perez"}'::jsonb
WHERE email = 'lcardenasp@institutocajas.edu.pe';
-- Usuario 2: Lucia Rodrigo Moscoso
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Lucia", "apellido": "Rodrigo Moscoso"}'::jsonb
WHERE email = 'lrodrigom@institutocajas.edu.pe';
-- Usuario 3: Luis David Puente Yalopoma
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Luis David", "apellido": "Puente Yalopoma"}'::jsonb
WHERE email = 'lpuentey@institutocajas.edu.pe';
-- Usuario 4: Juan Luis Merlo Galvez
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Juan Luis", "apellido": "Merlo Galvez"}'::jsonb
WHERE email = 'jmerlog@institutocajas.edu.pe';
-- Usuario 5: Ceferino Edwin Carhuachi Ramos
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Ceferino Edwin", "apellido": "Carhuachi Ramos"}'::jsonb
WHERE email = 'ccarhuachir@institutocajas.edu.pe';
-- Usuario 6: Fabian Vitaliano Ruiz Yachachi
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Fabian Vitaliano", "apellido": "Ruiz Yachachi"}'::jsonb
WHERE email = 'fruizy@institutocajas.edu.pe';
-- Usuario 7: Ronald Gabriel Sandoval Lopez
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Ronald Gabriel", "apellido": "Sandoval Lopez"}'::jsonb
WHERE email = 'rsandovall@institutocajas.edu.pe';
-- Usuario 8: Omar Castro Porras
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Omar", "apellido": "Castro Porras"}'::jsonb
WHERE email = 'oporras@institutocajas.edu.pe';
-- Usuario 9: Luz Agnes Baldeon Berrocal
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Luz Agnes", "apellido": "Baldeon Berrocal"}'::jsonb
WHERE email = 'lbaldeonb@institutocajas.edu.pe';
-- Usuario 10: Kevin Rolando Mateo Condor
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Kevin Rolando", "apellido": "Mateo Condor"}'::jsonb
WHERE email = 'kmateoc@institutocajas.edu.pe';
-- Usuario 11: Luis Jose Ponce Meza
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Luis Jose", "apellido": "Ponce Meza"}'::jsonb
WHERE email = 'lponcem@institutocajas.edu.pe';
-- Usuario 12: Jisenia Paola Ricaldi Ore
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Jisenia Paola", "apellido": "Ricaldi Ore"}'::jsonb
WHERE email = 'jricaldio@institutocajas.edu.pe';
-- Usuario 13: Romario Ruben Macha Damian
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Romario Ruben", "apellido": "Macha Damian"}'::jsonb
WHERE email = 'rmachad@institutocajas.edu.pe';
-- =============================================
-- PASO 3: Vincular todos en la tabla usuarios
-- =============================================
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
SELECT raw_user_meta_data->>'nombre' as nombre,
    raw_user_meta_data->>'apellido' as apellido,
    email,
    raw_user_meta_data->>'rol' as rol,
    id as auth_user_id
FROM auth.users
WHERE email IN (
        'lcardenasp@institutocajas.edu.pe',
        'lrodrigom@institutocajas.edu.pe',
        'lpuentey@institutocajas.edu.pe',
        'jmerlog@institutocajas.edu.pe',
        'ccarhuachir@institutocajas.edu.pe',
        'fruizy@institutocajas.edu.pe',
        'rsandovall@institutocajas.edu.pe',
        'oporras@institutocajas.edu.pe',
        'lbaldeonb@institutocajas.edu.pe',
        'kmateoc@institutocajas.edu.pe',
        'lponcem@institutocajas.edu.pe',
        'jricaldio@institutocajas.edu.pe',
        'rmachad@institutocajas.edu.pe'
    ) ON CONFLICT (email) DO
UPDATE
SET nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    rol = EXCLUDED.rol,
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = NOW();
-- =============================================
-- PASO 4: Verificar que se crearon correctamente
-- =============================================
SELECT nombre,
    apellido,
    email,
    rol,
    CASE
        WHEN auth_user_id IS NOT NULL THEN '✅'
        ELSE '❌'
    END as vinculado
FROM usuarios
WHERE email IN (
        'lcardenasp@institutocajas.edu.pe',
        'lrodrigom@institutocajas.edu.pe',
        'lpuentey@institutocajas.edu.pe',
        'jmerlog@institutocajas.edu.pe',
        'ccarhuachir@institutocajas.edu.pe',
        'fruizy@institutocajas.edu.pe',
        'rsandovall@institutocajas.edu.pe',
        'oporras@institutocajas.edu.pe',
        'lbaldeonb@institutocajas.edu.pe',
        'kmateoc@institutocajas.edu.pe',
        'lponcem@institutocajas.edu.pe',
        'jricaldio@institutocajas.edu.pe',
        'rmachad@institutocajas.edu.pe'
    )
ORDER BY apellido;
-- =============================================
-- RESUMEN
-- =============================================
-- Deberías ver 13 usuarios investigadores
-- Todos con auth_user_id vinculado (✅)
-- Password para todos: Invest@2025
-- =============================================