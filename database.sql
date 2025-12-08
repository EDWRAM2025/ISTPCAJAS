-- =============================================
-- ISTPCAJAS - Supabase Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('administrador', 'investigador', 'evaluador')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- =============================================
-- TABLA: proyectos
-- =============================================
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('investigacion-aplicada', 'innovacion-tecnologica', 'innovacion-pedagogica')),
    linea_investigacion TEXT,
    programa_estudio TEXT,
    investigador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    segundo_entregable_url TEXT,
    segundo_entregable_titulo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_proyectos_investigador ON proyectos(investigador_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_categoria ON proyectos(categoria);

-- =============================================
-- TABLA: evaluaciones
-- =============================================
CREATE TABLE IF NOT EXISTS evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    evaluador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    calificacion NUMERIC(5,2) CHECK (calificacion >= 0 AND calificacion <= 20),
    comentarios TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evaluaciones_proyecto ON evaluaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_evaluador ON evaluaciones(evaluador_id);

-- =============================================
-- TABLA: configuracion
-- Para almacenar fechas límite y otras configs
-- =============================================
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave TEXT UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial de fechas límite
INSERT INTO configuracion (clave, valor) 
VALUES ('fechas_limite', '{
    "paso2": "2025-03-15",
    "paso3": "2025-05-15",
    "paso4": "2025-07-15",
    "paso5": "2025-09-15",
    "paso6": "2025-11-15",
    "paso7": "2025-12-31"
}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

-- =============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON proyectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - usuarios
-- =============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
    ON usuarios FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Los administradores pueden ver todos los usuarios
CREATE POLICY "Administradores pueden ver todos los usuarios"
    ON usuarios FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'administrador'
        )
    );

-- Los administradores pueden insertar usuarios
CREATE POLICY "Administradores pueden insertar usuarios"
    ON usuarios FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'administrador'
        )
    );

-- Los administradores pueden actualizar usuarios
CREATE POLICY "Administradores pueden actualizar usuarios"
    ON usuarios FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'administrador'
        )
    );

-- Los administradores pueden eliminar usuarios (excepto a sí mismos)
CREATE POLICY "Administradores pueden eliminar usuarios"
    ON usuarios FOR DELETE
    USING (
        auth.uid() != auth_user_id
        AND EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'administrador'
        )
    );

-- =============================================
-- POLÍTICAS RLS - proyectos
-- =============================================

-- Todos los usuarios autenticados pueden ver proyectos
CREATE POLICY "Usuarios autenticados pueden ver proyectos"
    ON proyectos FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Los investigadores pueden insertar sus propios proyectos
CREATE POLICY "Investigadores pueden crear proyectos"
    ON proyectos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = investigador_id
            AND usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'investigador'
        )
    );

-- Los investigadores pueden actualizar sus propios proyectos
CREATE POLICY "Investigadores pueden actualizar sus proyectos"
    ON proyectos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = investigador_id
            AND usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'investigador'
        )
    );

-- Los administradores pueden actualizar cualquier proyecto
CREATE POLICY "Administradores pueden actualizar proyectos"
    ON proyectos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'administrador'
        )
    );

-- =============================================
-- POLÍTICAS RLS - evaluaciones
-- =============================================

-- Todos los usuarios autenticados pueden ver evaluaciones
CREATE POLICY "Usuarios autenticados pueden ver evaluaciones"
    ON evaluaciones FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Los evaluadores pueden insertar evaluaciones
CREATE POLICY "Evaluadores pueden crear evaluaciones"
    ON evaluaciones FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = evaluador_id
            AND usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'evaluador'
        )
    );

-- Los evaluadores pueden actualizar sus propias evaluaciones
CREATE POLICY "Evaluadores pueden actualizar sus evaluaciones"
    ON evaluaciones FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = evaluador_id
            AND usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'evaluador'
        )
    );

-- =============================================
-- POLÍTICAS RLS - configuracion
-- =============================================

-- Todos los usuarios autenticados pueden leer configuración
CREATE POLICY "Usuarios pueden leer configuración"
    ON configuracion FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Solo administradores pueden modificar configuración
CREATE POLICY "Administradores pueden modificar configuración"
    ON configuracion FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'administrador'
        )
    );

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de proyectos con información del investigador
CREATE OR REPLACE VIEW proyectos_completos AS
SELECT 
    p.id,
    p.titulo,
    p.categoria,
    p.linea_investigacion,
    p.programa_estudio,
    p.estado,
    p.segundo_entregable_url,
    p.segundo_entregable_titulo,
    p.created_at,
    p.updated_at,
    u.id as investigador_id,
    u.nombre as investigador_nombre,
    u.apellido as investigador_apellido,
    u.email as investigador_email
FROM proyectos p
JOIN usuarios u ON p.investigador_id = u.id;

-- Vista de evaluaciones con información del evaluador
CREATE OR REPLACE VIEW evaluaciones_completas AS
SELECT 
    e.id,
    e.proyecto_id,
    e.calificacion,
    e.comentarios,
    e.created_at,
    u.id as evaluador_id,
    u.nombre as evaluador_nombre,
    u.apellido as evaluador_apellido
FROM evaluaciones e
JOIN usuarios u ON e.evaluador_id = u.id;

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema ISTPCAJAS';
COMMENT ON TABLE proyectos IS 'Proyectos de investigación';
COMMENT ON TABLE evaluaciones IS 'Evaluaciones de proyectos';
COMMENT ON TABLE configuracion IS 'Configuración del sistema (fechas límite, etc.)';
