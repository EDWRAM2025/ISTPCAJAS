# 🚀 Guía de Configuración de Supabase para ISTPCAJAS

Esta guía te ayudará a configurar Supabase paso a paso para el sistema de gestión de investigación.

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Crear Proyecto en Supabase](#crear-proyecto)
3. [Configurar Base de Datos](#configurar-base-de-datos)
4. [Configurar Autenticación](#configurar-autenticacion)
5. [Configurar Storage](#configurar-storage)
6. [Crear Usuario Administrador](#crear-usuario-administrador)
7. [Conectar con la Aplicación](#conectar-aplicacion)
8. [Solución de Problemas](#solucion-problemas)

---

## 1️⃣ Prerrequisitos

- ✅ Cuenta en [Supabase](https://supabase.com)
- ✅ Navegador web actualizado
- ✅ Acceso al código del proyecto ISTPCAJAS

---

## 2️⃣ Crear Proyecto en Supabase

1. **Inicia sesión** en [Supabase](https://supabase.com/dashboard)

2. **Crea un nuevo proyecto:**
   - Click en **"New Project"**
   - Nombre: `ISTPCAJAS` o el que prefieras
   - Database Password: Anota esta contraseña (la necesitarás después)
   - Region: Selecciona la más cercana a tu ubicación (ej: `South America (São Paulo)`)
   - Click en **"Create new project"**
   - ⏱️ Espera 1-2 minutos mientras se crea el proyecto

---

## 3️⃣ Configurar Base de Datos

### 3.1 Ejecutar el Script SQL

1. En tu proyecto, ve a **SQL Editor** (menú lateral izquierdo)

2. Click en **"New Query"**

3. **Copia TODO el contenido** del archivo [`database.sql`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/database.sql)

4. **Pega** el código en el editor SQL

5. Click en **"Run"** o presiona `Ctrl + Enter`

6. ✅ Deberías ver el mensaje: **"Success. No rows returned"**

### 3.2 Verificar las Tablas Creadas

1. Ve a **Table Editor** (menú lateral)

2. Deberías ver las siguientes tablas:
   - ✅ `usuarios`
   - ✅ `proyectos`
   - ✅ `evaluaciones`
   - ✅ `configuracion`

---

## 4️⃣ Configurar Autenticación

### 4.1 Desactivar Confirmación de Email (Desarrollo)

> ⚠️ **Importante:** Esto permite usar emails ficticios como `admin@institutocajas.edu.pe`

1. Ve a **Authentication** → **Settings** → **Auth Providers**

2. Busca la sección **"Email"**

3. **Desactiva** las siguientes opciones:
   - ❌ **"Confirm email"** (desmarcar)
   - ❌ **"Secure email change"** (desmarcar)

4. Click en **"Save"**

### 4.2 Configurar Políticas de Contraseña

1. En **Authentication** → **Settings** → **Auth Settings**

2. Verifica la configuración de contraseñas:
   - Minimum password length: `8` o más
   - **No marques** "Require special characters" (opcional)

---

## 5️⃣ Configurar Storage

### 5.1 Crear Bucket para PDFs

1. Ve a **Storage** (menú lateral)

2. Click en **"Create a new bucket"**

3. Configuración:
   - **Name:** `project-files`
   - **Public bucket:** ✅ Activar (para poder acceder a los PDFs)
   - Click en **"Create bucket"**

### 5.2 Configurar Políticas del Bucket

1. Click en tu bucket `project-files`

2. Ve a **"Policies"**

3. Click en **"New Policy"**

4. **Política para SELECT (lectura):**
   ```
   Policy name: Public Read Access
   Allowed operation: SELECT
   Target roles: public
   USING expression: true
   ```

5. **Política para INSERT (subir archivos):**
   ```
   Policy name: Authenticated Upload
   Allowed operation: INSERT
   Target roles: authenticated
   WITH CHECK expression: true
   ```

---

## 6️⃣ Crear Usuario Administrador

### Opción A: Desde la Interfaz de Supabase (Recomendado)

1. Ve a **Authentication** → **Users**

2. Click en **"Add user"** → **"Create new user"**

3. Completa el formulario:
   - **Email:** `admin@institutocajas.edu.pe`
   - **Password:** `Admin@Cajas2025`
   - **Auto Confirm User:** ✅ Activar
   - Click en **"Create user"**

4. **Copia el UUID** del usuario que acabas de crear (aparece en la columna `id`)

5. Ve a **SQL Editor** → **New Query**

6. Ejecuta este SQL (reemplaza `UUID_DEL_USUARIO` con el UUID que copiaste):

   ```sql
   INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
   VALUES (
     'Admin',
     'Sistema',
     'admin@institutocajas.edu.pe',
     'administrador',
     'UUID_DEL_USUARIO'
   );
   ```

7. Click en **"Run"**

### Opción B: Solo con SQL (Avanzado)

> ⚠️ **Nota:** Esta opción es más compleja y requiere usar funciones de Supabase

1. Ve a **SQL Editor** → **New Query**

2. Ejecuta este código:

   ```sql
   -- Primero verificar si el usuario ya existe en auth.users
   SELECT id, email FROM auth.users WHERE email = 'admin@institutocajas.edu.pe';
   
   -- Si existe, usar el ID. Si no, necesitas crearlo desde la interfaz
   ```

---

## 7️⃣ Conectar con la Aplicación

### 7.1 Obtener las Credenciales

1. Ve a **Settings** → **API** (menú lateral)

2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (es un JWT largo)

### 7.2 Actualizar el Código

1. Abre el archivo [`js/supabase-config.js`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/js/supabase-config.js)

2. **Verifica** que las credenciales sean correctas:

   ```javascript
   const SUPABASE_URL = 'https://wbondpjuxlcxkkkdbzkj.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

3. Si son diferentes, **reemplázalas** con tus valores

---

## 8️⃣ Solución de Problemas

### ❌ Error: "Invalid login credentials"

**Posibles causas:**

1. **Email o contraseña incorrectos**
   - ✅ Verifica en **Authentication** → **Users** que el usuario exista
   - ✅ Intenta hacer **Reset Password** desde Supabase

2. **Email no confirmado**
   - ✅ Ve a **Authentication** → **Settings** → **Auth Providers**
   - ✅ Desactiva **"Confirm email"**
   - ✅ O bien, confirma el usuario manualmente en **Users** → **3 puntos** → **Confirm Email**

3. **Usuario no existe en la tabla `usuarios`**
   - ✅ Ejecuta: `SELECT * FROM usuarios WHERE email = 'admin@institutocajas.edu.pe';`
   - ✅ Si no aparece, créalo siguiendo el [Paso 6](#crear-usuario-administrador)

### ❌ Error: "Failed to fetch" o problemas de conexión

1. **Verifica las credenciales:**
   - ✅ Comprueba `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `supabase-config.js`
   - ✅ Asegúrate de que no tengan espacios antes/después

2. **Verifica que el proyecto esté activo:**
   - ✅ Ve al Dashboard de Supabase
   - ✅ Verifica que el proyecto no esté pausado

### ❌ Error: Row Level Security (RLS)

**Síntomas:** No puedes ver datos, aunque el login funciona

1. **Verifica las políticas RLS:**
   - Ve a **Table Editor** → Selecciona una tabla
   - Click en **"RLS Policies"**
   - Deberías ver las políticas creadas por `database.sql`

2. **Si no hay políticas, vuelve a ejecutar:**
   - Todo el script `database.sql` de nuevo

### ❌ No puedo subir archivos PDF

1. **Verifica que el bucket exista:**
   - ✅ Ve a **Storage**
   - ✅ Debe existir el bucket `project-files`

2. **Verifica las políticas del bucket:**
   - ✅ Debe tener políticas para `SELECT` e `INSERT`
   - ✅ Sigue el [Paso 5.2](#52-configurar-políticas-del-bucket)

### ❌ Los emails ficticios no funcionan

1. **Desactiva la confirmación de email:**
   - ✅ **Authentication** → **Settings** → **Auth Providers**
   - ✅ Desmarca **"Confirm email"**

2. **Confirma usuarios manualmente:**
   - ✅ **Authentication** → **Users**
   - ✅ Click en **3 puntos** → **Confirm Email**

---

## 🎉 ¡Listo!

Si seguiste todos los pasos, tu aplicación ya debería estar conectada a Supabase.

**Prueba el login:**
1. Abre `index.html` en el navegador
2. Ingresa:
   - Usuario: `admin` (se autocompletará a `admin@institutocajas.edu.pe`)
   - Contraseña: `Admin@Cajas2025`
3. Click en **"Iniciar Sesión"**

**Si todo funciona correctamente, serás redirigido al dashboard del administrador.**

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la **Consola del Navegador** (F12) para ver errores
2. Verifica que todas las tablas y políticas estén configuradas
3. Comprueba que las credenciales en `supabase-config.js` sean correctas

---

**¡Buena suerte! 🚀**
