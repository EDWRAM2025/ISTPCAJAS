# 🚀 Configuración Completa desde Cero - ISTPCAJAS

## Proyecto Supabase: cymcihznzdbrqfogrlwr

---

## ✅ PASO 1: Obtener y Configurar Credenciales API

### 1.1 Obtener el Anon Key

Ya tienes abierta la página: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/settings/api

En esa página:

1. Busca la sección **"Project API keys"**
2. Encuentra la key llamada **"anon"** o **"anon public"**
3. Es un texto muy largo que empieza con `eyJ...`
4. **Click en el ícono de copiar** 📋 al lado de la key
5. Guárdala temporalmente

### 1.2 Actualizar el Código

1. Abre el archivo: `js/supabase-config.js`
2. En la línea 8, reemplaza `'YOUR_ANON_KEY_HERE'` con el key que copiaste
3. Debe quedar algo así:
```javascript
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```
4. **Guarda el archivo** (Ctrl+S)

---

## ✅ PASO 2: Crear la Base de Datos

### 2.1 Ir al SQL Editor

1. En Supabase Dashboard, click en **SQL Editor** (en la barra lateral izquierda)
2. Click en **"New query"** o el botón **"+"**

### 2.2 Ejecutar el Script

1. Abre el archivo: `init_database.sql` (que acabo de crear)
2. **Copia TODO el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Click en **"Run"** o presiona `Ctrl+Enter`
5. Espera a que termine (puede tomar 10-20 segundos)
6. Verifica que veas: `"Base de datos inicializada correctamente"`

---

## ✅ PASO 3: Configurar Storage para PDFs

### 3.1 Crear Bucket

1. En Supabase Dashboard, ve a **Storage** (barra lateral)
2. Click en **"New bucket"**
3. Nombre: `project-files`
4. **Public bucket:** ✓ (marcar)
5. Click **"Create bucket"**

### 3.2 Configurar Políticas del Bucket

1. Click en el bucket `project-files` que acabas de crear
2. Ve a **"Policies"**
3. Click **"New Policy"**
4. Selecciona **"For full customization"**
5. Usa este SQL:

```sql
-- Política para SELECT (leer archivos)
CREATE POLICY "Usuarios autenticados pueden ver archivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');

-- Política para INSERT (subir archivos)
CREATE POLICY "Investigadores pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- Política para UPDATE (actualizar archivos)
CREATE POLICY "Usuarios pueden actualizar sus archivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files');

-- Política para DELETE (eliminar archivos)
CREATE POLICY "Usuarios pueden eliminar sus archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');
```

---

## ✅ PASO 4: Crear Usuario Administrador

### 4.1 Crear Usuario en Authentication

1. Ve a **Authentication** → **Users**
2. Click **"Add user"**
3. Llena los datos:
   - **Email:** `cordedwinegsep@gmail.com`
   - **Password:** `Admin@Cajas2025`
   - **Auto Confirm User:** ✓ (marcar esta opción)
   - **Send confirmation email:** ✗ (NO marcar)

4. Click **"Create user"**

### 4.2 Agregar User Metadata

1. El usuario recién creado aparecerá en la lista
2. **Click en el usuario** para abrirlo
3. Busca sección **"User Metadata"** o **"Raw User Meta Data"**
4. Click en **editar** (ícono de lápiz)
5. Agrega este JSON:

```json
{
  "rol": "administrador",
  "nombre": "Administrador",
  "apellido": "Sistema"
}
```

6. **Guarda** los cambios

### 4.3 Copiar el UUID del Usuario

1. Mientras estás viendo el usuario, busca el campo **"ID"** o **"UUID"**
2. Es algo como: `a1b2c3d4-5678-90ab-cdef-1234567890ab`
3. **Copia ese UUID** completo

### 4.4 Vincular en Tabla usuarios

1. Ve al **SQL Editor**
2. Ejecuta este comando (reemplaza `AQUI_TU_UUID` con el UUID que copiaste):

```sql
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
VALUES (
    'Administrador',
    'Sistema',
    'admin@institutocajas.edu.pe',
    'administrador',
    'AQUI_TU_UUID'
);
```

3. Click **"Run"**
4. Deberías ver: `"Success. Rows returned: 1"`

---

## ✅ PASO 5: Configurar Authentication (Opcional pero Recomendado)

### 5.1 Desactivar Confirmación de Email

1. Ve a **Authentication** → **Providers**
2. Click en **"Email"**
3. Busca **"Confirm email"**
4. **Desactívalo** (toggle OFF)
5. **Save**

### 5.2 Configurar Redirect URLs (Para Password Recovery)

1. Ve a **Authentication** → **URL Configuration**
2. En **"Site URL"** pon:
   ```
   file:///C:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/index.html
   ```
3. En **"Redirect URLs"** agrega la misma URL
4. **Save**

---

## ✅ PASO 6: Verificar la Instalación

### 6.1 Verificar Tablas

En SQL Editor, ejecuta:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver:
- configuracion
- evaluaciones
- proyectos
- usuarios

### 6.2 Verificar Usuario Admin

```sql
SELECT u.nombre, u.apellido, u.email, u.rol, u.auth_user_id
FROM usuarios u
WHERE u.email = 'admin@institutocajas.edu.pe';
```

Deberías ver un registro con el nombre "Administrador Sistema".

---

## ✅ PASO 7: Probar el Login

1. Abre `index.html` en tu navegador
2. Ingresa:
   - **Email:** `admin` (se autocompletará a admin@institutocajas.edu.pe)
   - **Password:** `Admin@Cajas2025`
3. Click **"Iniciar Sesión"**
4. Deberías ser redirigido a `dashboard-administrador.html`

---

## 🎯 Resumen de Credenciales

### Login en el Sistema
- **Email:** admin@institutocajas.edu.pe
- **Password:** Admin@Cajas2025

### Email Real (para recuperación)
- **Gmail:** cordedwinegsep@gmail.com

### Supabase Project
- **Project ID:** cymcihznzdbrqfogrlwr
- **Project URL:** https://cymcihznzdbrqfogrlwr.supabase.co
- **Anon Key:** (la que copiaste y pegaste en supabase-config.js)

---

## 📁 Archivos Importantes

| Archivo | Ubicación | Uso |
|---------|-----------|-----|
| init_database.sql | Raíz del proyecto | Script completo de base de datos |
| supabase-config.js | js/ | Configuración de conexión |
| PASSWORD_ADMIN.txt | Raíz | Credenciales del admin |

---

## 🆘 Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste correctamente el anon key
- Asegúrate de que no tiene espacios al inicio/final

### Error: "Invalid login credentials"
- Verifica que el usuario tiene el metadata `rol: administrador`
- Verifica que existe en la tabla usuarios
- Verifica que el UUID coincide entre auth.users y usuarios.auth_user_id

### Error: "Row Level Security policy violation"
- Ejecuta nuevamente la sección de RLS políticas del script
- Verifica que el metadata del usuario tiene el campo `rol`

---

## ✅ Checklist Final

- [ ] Anon key pegado en supabase-config.js
- [ ] Script init_database.sql ejecutado completo
- [ ] Bucket project-files creado y con políticas
- [ ] Usuario cordedwinegsep@gmail.com creado en Auth
- [ ] User metadata agregado con rol: administrador
- [ ] Usuario vinculado en tabla usuarios
- [ ] Login probado exitosamente

---

**¡Listo! Tu sistema ISTPCAJAS está completamente configurado y listo para usar.**
