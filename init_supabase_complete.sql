-- =============================================
-- SCRIPT SQL COMPLETO PARA ISTCAJASCHAT
-- Sistema de Gestión de Investigación - IESTP AACD
-- =============================================
-- PASO 1: CREAR TABLAS
-- =============================================
-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL CHECK (
        rol IN ('administrador', 'investigador', 'evaluador')
    ),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Tabla: proyectos
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL CHECK (
        categoria IN (
            'investigacion-aplicada',
            'innovacion-tecnologica',
            'innovacion-pedagogica'
        )
    ),
    objetivos TEXT,
    metodologia TEXT,
    investigador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'borrador' CHECK (
        estado IN ('borrador', 'pendiente', 'aprobado', 'rechazado')
    ),
    archivo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Tabla: evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
    evaluador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    -- Criterios de evaluación (20 items)
    criterio_1 BOOLEAN DEFAULT FALSE,
    criterio_2 BOOLEAN DEFAULT FALSE,
    criterio_3 BOOLEAN DEFAULT FALSE,
    criterio_4 BOOLEAN DEFAULT FALSE,
    criterio_5 BOOLEAN DEFAULT FALSE,
    criterio_6 BOOLEAN DEFAULT FALSE,
    criterio_7 BOOLEAN DEFAULT FALSE,
    criterio_8 BOOLEAN DEFAULT FALSE,
    criterio_9 BOOLEAN DEFAULT FALSE,
    criterio_10 BOOLEAN DEFAULT FALSE,
    criterio_11 BOOLEAN DEFAULT FALSE,
    criterio_12 BOOLEAN DEFAULT FALSE,
    criterio_13 BOOLEAN DEFAULT FALSE,
    criterio_14 BOOLEAN DEFAULT FALSE,
    criterio_15 BOOLEAN DEFAULT FALSE,
    criterio_16 BOOLEAN DEFAULT FALSE,
    criterio_17 BOOLEAN DEFAULT FALSE,
    criterio_18 BOOLEAN DEFAULT FALSE,
    criterio_19 BOOLEAN DEFAULT FALSE,
    criterio_20 BOOLEAN DEFAULT FALSE,
    calificacion_final NUMERIC(5, 2),
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Tabla: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- PASO 2: CREAR VISTAS SQL
-- =============================================
-- Vista: proyectos_completos (con información del investigador)
CREATE OR REPLACE VIEW proyectos_completos AS
SELECT p.*,
    u.nombre AS investigador_nombre,
    u.apellido AS investigador_apellido,
    u.email AS investigador_email
FROM proyectos p
    LEFT JOIN usuarios u ON p.investigador_id = u.id;
-- Vista: evaluaciones_completas (con información del evaluador y proyecto)
CREATE OR REPLACE VIEW evaluaciones_completas AS
SELECT e.*,
    u.nombre AS evaluador_nombre,
    u.apellido AS evaluador_apellido,
    p.titulo AS proyecto_titulo,
    p.categoria AS proyecto_categoria
FROM evaluaciones e
    LEFT JOIN usuarios u ON e.evaluador_id = u.id
    LEFT JOIN proyectos p ON e.proyecto_id = p.id;
-- PASO 3: HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
-- PASO 4: CREAR POLÍTICAS RLS
-- =============================================
-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver todos los usuarios" ON usuarios FOR
SELECT USING (true);
CREATE POLICY "Solo administradores pueden insertar usuarios" ON usuarios FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_user_id = auth.uid()
                AND rol = 'administrador'
        )
    );
CREATE POLICY "Solo administradores pueden actualizar usuarios" ON usuarios FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_user_id = auth.uid()
                AND rol = 'administrador'
        )
    );
CREATE POLICY "Solo administradores pueden eliminar usuarios" ON usuarios FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE auth_user_id = auth.uid()
            AND rol = 'administrador'
    )
);
-- Políticas para proyectos
CREATE POLICY "Usuarios pueden ver todos los proyectos" ON proyectos FOR
SELECT USING (true);
CREATE POLICY "Investigadores pueden crear proyectos" ON proyectos FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_user_id = auth.uid()
                AND (
                    rol = 'investigador'
                    OR rol = 'administrador'
                )
        )
    );
CREATE POLICY "Investigadores pueden actualizar sus propios proyectos" ON proyectos FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_user_id = auth.uid()
                AND (
                    id = proyectos.investigador_id
                    OR rol = 'administrador'
                )
        )
    );
CREATE POLICY "Solo administradores pueden eliminar proyectos" ON proyectos FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE auth_user_id = auth.uid()
            AND rol = 'administrador'
    )
);
-- Políticas para evaluaciones
CREATE POLICY "Usuarios autenticados pueden ver evaluaciones" ON evaluaciones FOR
SELECT USING (true);
CREATE POLICY "Evaluadores pueden crear evaluaciones" ON evaluaciones FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_user_id = auth.uid()
                AND (
                    rol = 'evaluador'
                    OR rol = 'administrador'
                )
        )
    );
CREATE POLICY "Evaluadores pueden actualizar sus evaluaciones" ON evaluaciones FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_user_id = auth.uid()
                AND (
                    id = evaluaciones.evaluador_id
                    OR rol = 'administrador'
                )
        )
    );
-- Políticas para configuración
CREATE POLICY "Todos pueden ver configuración" ON configuracion FOR
SELECT USING (true);
CREATE POLICY "Solo administradores pueden modificar configuración" ON configuracion FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE auth_user_id = auth.uid()
            AND rol = 'administrador'
    )
);
-- PASO 5: CREAR FUNCIONES Y TRIGGERS
-- =============================================
-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE
UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proyectos_updated_at BEFORE
UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluaciones_updated_at BEFORE
UPDATE ON evaluaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_updated_at BEFORE
UPDATE ON configuracion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =============================================
-- FIN DEL SCRIPT
-- =============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/lfegqescnkegwjpgcesj
-- 2. En el menú lateral, haz clic en "SQL Editor"
-- 3. Haz clic en "New Query"
-- 4. Copia y pega TODO este script
-- 5. Haz clic en "Run" para ejecutar
-- 6. Verifica que todas las tablas se crearon en "Table Editor"