-- =============================================
-- SCRIPT PARA CREAR USUARIOS DE PRUEBA
-- Ejecutar DESPUÉS de init_supabase_complete.sql
-- =============================================
-- IMPORTANTE: Este script asume que ya creaste los usuarios en Authentication
-- Debes reemplazar los UUIDs con los reales de tu dashboard
-- =============================================
-- PASO 1: CREAR USUARIOS EN AUTHENTICATION
-- =============================================
-- Ve a: Authentication → Users → Add User
-- Crear estos 3 usuarios:
-- ADMINISTRADOR:
-- Email: admin@institutocajas.edu.pe
-- Password: Admin@Cajas2025
-- Metadata: {"rol": "administrador", "nombre": "Administrador", "apellido": "Sistema"}
-- INVESTIGADOR:
-- Email: investigador@institutocajas.edu.pe  
-- Password: Invest@2025
-- Metadata: {"rol": "investigador", "nombre": "Juan", "apellido": "Pérez"}
-- EVALUADOR:
-- Email: evaluador@institutocajas.edu.pe
-- Password: Evalua@2025
-- Metadata: {"rol": "evaluador", "nombre": "María", "apellido": "García"}
-- =============================================
-- PASO 2: VINCULAR CON TABLA USUARIOS
-- =============================================
-- Después de crear los usuarios en Authentication, copia sus UUIDs
-- y ejecuta estos INSERTs reemplazando 'UUID_AQUI'
-- Ejemplo con UUIDs fictici os (REEMPLAZAR con los reales):
/*
 INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
 VALUES 
 ('Administrador', 'Sistema', 'admin@institutocajas.edu.pe', 'administrador', 'UUID_DEL_ADMIN_AQUI'),
 ('Juan', 'Pérez', 'investigador@institutocajas.edu.pe', 'investigador', 'UUID_DEL_INVESTIGADOR_AQUI'),
 ('María', 'García', 'evaluador@institutocajas.edu.pe', 'evaluador', 'UUID_DEL_EVALUADOR_AQUI');
 */
-- =============================================
-- ALTERNATIVA: USAR FUNCIÓN para crear usuarios automáticamente
-- =============================================
-- Esta función crea el usuario en Auth Y en la tabla usuarios
CREATE OR REPLACE FUNCTION create_user_with_auth(
        p_email TEXT,
        p_password TEXT,
        p_nombre TEXT,
        p_apellido TEXT,
        p_rol TEXT
    ) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID;
BEGIN -- Nota: Esta función requiere extensión supabase_auth que no siempre está disponible
-- Es mejor crear usuarios manualmente desde el dashboard
RAISE NOTICE 'Crear usuario manualmente en Authentication → Users';
RETURN 'OK';
END;
$$;