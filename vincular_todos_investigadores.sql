-- =====================================================
-- VINCULAR TODOS LOS INVESTIGADORES  A LA TABLA USUARIOS
-- =====================================================
-- PROBLEMA: Los investigadores existen en Authentication 
-- pero NO en la tabla usuarios, por eso no pueden login
-- =====================================================
-- PASO 1: Actualizar metadatos de TODOS los investigadores existentes
-- =====================================================
-- Investigador 1 (genérico)
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Investigador", "apellido": "Generico"}'::jsonb
WHERE email = 'investigador@institutocajas.edu.pe';
-- Investigador 2: Omar Castro Porras
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Omar", "apellido": "Castro Porras"}'::jsonb
WHERE email = 'oporras@institutocajas.edu.pe';
-- Investigador 3: Luz Agnes Baldeon Berrocal
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Luz Agnes", "apellido": "Baldeon Berrocal"}'::jsonb
WHERE email = 'lbaldeonb@institutocajas.edu.pe';
-- Investigador 4: Kevin Rolando Mateo Condor
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Kevin Rolando", "apellido": "Mateo Condor"}'::jsonb
WHERE email = 'kmateoc@institutocajas.edu.pe';
-- Investigador 5: Luis Jose Ponce Meza
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Luis Jose", "apellido": "Ponce Meza"}'::jsonb
WHERE email = 'lponcem@institutocajas.edu.pe';
-- Investigador 6: Jisenia Paola Ricaldi Ore
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Jisenia Paola", "apellido": "Ricaldi Ore"}'::jsonb
WHERE email = 'jricaldio@institutocajas.edu.pe';
-- Investigador 7: Romario Ruben Macha Damian
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Romario Ruben", "apellido": "Macha Damian"}'::jsonb
WHERE email = 'rmachad@institutocajas.edu.pe';
-- Los usuarios incorrectos (si quieres mantenerlos)
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Ceferino Edwin", "apellido": "Carhuachi Ramos"}'::jsonb
WHERE email = 'ccarhuachir@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Fabian Vitaliano", "apellido": "Ruiz Yachachi"}'::jsonb
WHERE email = 'fruizy@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Juan Luis", "apellido": "Merlo Galvez"}'::jsonb
WHERE email = 'jmerlog@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Lourdes Lidia", "apellido": "Cardenas Perez"}'::jsonb
WHERE email = 'lcardenasp@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Luis David", "apellido": "Puente Yalopoma"}'::jsonb
WHERE email = 'lpuentey@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Lucia", "apellido": "Rodrigo Moscoso"}'::jsonb
WHERE email = 'lrodrigom@institutocajas.edu.pe';
UPDATE auth.users
SET raw_user_meta_data = '{"rol": "investigador", "nombre": "Ronald Gabriel", "apellido": "Sandoval Lopez"}'::jsonb
WHERE email = 'rsandovall@institutocajas.edu.pe';
-- =====================================================
-- PASO 2: Vincular TODOS en la tabla usuarios
-- =====================================================
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
SELECT raw_user_meta_data->>'nombre' as nombre,
    raw_user_meta_data->>'apellido' as apellido,
    email,
    raw_user_meta_data->>'rol' as rol,
    id as auth_user_id
FROM auth.users
WHERE email IN (
        'investigador@institutocajas.edu.pe',
        'oporras@institutocajas.edu.pe',
        'lbaldeonb@institutocajas.edu.pe',
        'kmateoc@institutocajas.edu.pe',
        'lponcem@institutocajas.edu.pe',
        'jricaldio@institutocajas.edu.pe',
        'rmachad@institutocajas.edu.pe',
        'ccarhuachir@institutocajas.edu.pe',
        'fruizy@institutocajas.edu.pe',
        'jmerlog@institutocajas.edu.pe',
        'lcardenasp@institutocajas.edu.pe',
        'lpuentey@institutocajas.edu.pe',
        'lrodrigom@institutocajas.edu.pe',
        'rsandovall@institutocajas.edu.pe'
    ) ON CONFLICT (email) DO
UPDATE
SET nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    rol = EXCLUDED.rol,
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = NOW();
-- =====================================================
-- PASO 3: Verificar que se vincularon correctamente
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
WHERE rol = 'investigador'
ORDER BY apellido;
-- =====================================================
-- RESUMEN
-- =====================================================
-- Deberías ver 14 investigadores con estado "✅ Vinculado"
-- Ahora podrán iniciar sesión sin problemas
-- =====================================================