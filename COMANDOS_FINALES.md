# 🎯 3 COMANDOS SIMPLES PARA TERMINAR

Ya tienes el usuario `cordedwinegsep@gmail.com` creado en Supabase.

Ahora solo copia y pega estos 3 bloques SQL uno por uno:

---

## 📝 BLOQUE 1: Crear Tablas (Copiar y Pegar en SQL Editor)

```sql
-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla usuarios
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

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);

-- Tabla proyectos
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

CREATE INDEX IF NOT EXISTS idx_proyectos_investigador ON proyectos(investigador_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_categoria ON proyectos(categoria);

-- Tabla evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    evaluador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    calificacion NUMERIC(5,2) CHECK (calificacion >= 0 AND calificacion <= 20),
    comentarios TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_proyecto ON evaluaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_evaluador ON evaluaciones(evaluador_id);

-- Tabla configuracion
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave TEXT UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO configuracion (clave, valor) 
VALUES ('fechas_limite', '{"paso2":"2025-03-15","paso3":"2025-05-15","paso4":"2025-07-15","paso5":"2025-09-15","paso6":"2025-11-15","paso7":"2025-12-31"}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proyectos_updated_at ON proyectos;
CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuracion_updated_at ON configuracion;
CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📝 BLOQUE 2: Activar RLS y Políticas (Copiar y Pegar en SQL Editor)

```sql
-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden insertar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden actualizar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Administradores pueden eliminar usuarios" ON usuarios;

CREATE POLICY "Usuarios pueden ver su propio perfil" ON usuarios FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Administradores pueden ver todos los usuarios" ON usuarios FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador');
CREATE POLICY "Administradores pueden insertar usuarios" ON usuarios FOR INSERT WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador');
CREATE POLICY "Administradores pueden actualizar usuarios" ON usuarios FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador');
CREATE POLICY "Administradores pueden eliminar usuarios" ON usuarios FOR DELETE USING (auth.uid() != auth_user_id AND (auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador');

-- Políticas proyectos
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver proyectos" ON proyectos;
DROP POLICY IF EXISTS "Investigadores pueden crear proyectos" ON proyectos;
DROP POLICY IF EXISTS "Investigadores pueden actualizar sus proyectos" ON proyectos;
DROP POLICY IF EXISTS "Administradores pueden actualizar proyectos" ON proyectos;

CREATE POLICY "Usuarios autenticados pueden ver proyectos" ON proyectos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Investigadores pueden crear proyectos" ON proyectos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = investigador_id AND usuarios.auth_user_id = auth.uid() AND usuarios.rol = 'investigador'));
CREATE POLICY "Investigadores pueden actualizar sus proyectos" ON proyectos FOR UPDATE USING (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = investigador_id AND usuarios.auth_user_id = auth.uid() AND usuarios.rol = 'investigador'));
CREATE POLICY "Administradores pueden actualizar proyectos" ON proyectos FOR UPDATE USING (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.auth_user_id = auth.uid() AND usuarios.rol = 'administrador'));

-- Políticas evaluaciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Evaluadores pueden crear evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Evaluadores pueden actualizar sus evaluaciones" ON evaluaciones;

CREATE POLICY "Usuarios autenticados pueden ver evaluaciones" ON evaluaciones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Evaluadores pueden crear evaluaciones" ON evaluaciones FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = evaluador_id AND usuarios.auth_user_id = auth.uid() AND usuarios.rol = 'evaluador'));
CREATE POLICY "Evaluadores pueden actualizar sus evaluaciones" ON evaluaciones FOR UPDATE USING (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = evaluador_id AND usuarios.auth_user_id = auth.uid() AND usuarios.rol = 'evaluador'));

-- Políticas configuracion
DROP POLICY IF EXISTS "Usuarios pueden leer configuración" ON configuracion;
DROP POLICY IF EXISTS "Administradores pueden modificar configuración" ON configuracion;

CREATE POLICY "Usuarios pueden leer configuración" ON configuracion FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Administradores pueden modificar configuración" ON configuracion FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.auth_user_id = auth.uid() AND usuarios.rol = 'administrador'));

-- Vistas
CREATE OR REPLACE VIEW proyectos_completos AS
SELECT p.id, p.titulo, p.categoria, p.linea_investigacion, p.programa_estudio, p.estado, p.segundo_entregable_url, p.segundo_entregable_titulo, p.created_at, p.updated_at,
       u.id as investigador_id, u.nombre as investigador_nombre, u.apellido as investigador_apellido, u.email as investigador_email
FROM proyectos p JOIN usuarios u ON p.investigador_id = u.id;

CREATE OR REPLACE VIEW evaluaciones_completas AS
SELECT e.id, e.proyecto_id, e.calificacion, e.comentarios, e.created_at,
       u.id as evaluador_id, u.nombre as evaluador_nombre, u.apellido as evaluador_apellido
FROM evaluaciones e JOIN usuarios u ON e.evaluador_id = u.id;
```

---

## 📝 BLOQUE 3: Vincular Usuario Admin (2 pasos)

### Paso A: Obtener UUID del usuario
```sql
-- Ejecuta esto para ver el UUID del usuario creado
SELECT id, email FROM auth.users WHERE email = 'cordedwinegsep@gmail.com';
```

**COPIA EL UUID QUE APARECE** (algo como: abc123-def456-...)

### Paso B: Vincular usuario (reemplaza TU_UUID_AQUI)
```sql
-- Reemplaza TU_UUID_AQUI con el UUID que copiaste arriba
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
VALUES ('Administrador', 'Sistema', 'admin@institutocajas.edu.pe', 'administrador', 'TU_UUID_AQUI');

-- Luego actualiza el metadata del usuario en Authentication
-- Ve a Auth → Users → Click en cordedwinegsep@gmail.com → User Metadata → Editar
-- Pega: {"rol":"administrador","nombre":"Administrador","apellido":"Sistema"}
```

---

## ✅ VERIFICAR

```sql
-- Verifica que todo esté bien
SELECT * FROM usuarios WHERE email = 'admin@institutocajas.edu.pe';
```

Deberías ver un registro con todos los datos.

---

## 🚀 PROBAR LOGIN

Abre `index.html` y login con:
- Email: `admin`
- Password: `Admin@Cajas2025`

¡Listo!
