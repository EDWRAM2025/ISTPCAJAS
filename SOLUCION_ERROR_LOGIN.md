# 🔧 SOLUCIÓN: Error de Login - Recursión Infinita en RLS

## 🐛 Problema Identificado

**Error:** `infinite recursion detected in policy for relation "usuarios"`

**Causa:** Las políticas RLS estaban consultando la tabla `usuarios` para verificar si un usuario es administrador, creando un bucle infinito.

**Evidencia:** 
- Login de autenticación exitoso ✅
- Error al obtener datos del usuario desde la tabla `usuarios` ❌

![Login Attempt](file:///C:/Users/jesuk/.gemini/antigravity/brain/7461dcf0-da67-49cd-8d91-f00051477d97/login_attempt_1765167695171.png)

---

## ✅ Solución Implementada

### Cambio Principal

**Antes (problemático):** Las políticas consultaban la misma tabla
```sql
CREATE POLICY "Administradores pueden ver todos los usuarios"
    ON usuarios FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM usuarios  -- ❌ Recursión infinita
            WHERE usuarios.auth_user_id = auth.uid()
            AND usuarios.rol = 'administrador'
        )
    );
```

**Después (corregido):** Usar metadatos del JWT
```sql
CREATE POLICY "Administradores pueden ver todos los usuarios"
    ON usuarios FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'rol') = 'administrador'  -- ✅ Sin recursión
    );
```

---

## 📝 Archivos Modificados

### 1. [`database.sql`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/database.sql)
- ✅ Corregidas todas las políticas RLS de la tabla `usuarios`
- ✅ Ahora usan `auth.jwt()` en lugar de consultar la tabla

### 2. [`fix_rls_policies.sql`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/fix_rls_policies.sql)
- ✅ Script SQL listo para ejecutar en Supabase
- ✅ Incluye instrucciones paso a paso

### 3. [`js/supabase-config.js`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/js/supabase-config.js)
- ✅ Añadido comentario importante en `createUsuario()`

---

## 🚀 Pasos para Aplicar la Solución

### Opción A: Ejecutar el Script de Corrección (Recomendado)

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto: https://supabase.com/dashboard

2. **Abre SQL Editor**
   - Click en **SQL Editor** en el menú lateral

3. **Ejecuta el script de corrección**
   - Abre el archivo [`fix_rls_policies.sql`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/fix_rls_policies.sql)
   - **Copia TODO el contenido**
   - **Pega** en el SQL Editor de Supabase
   - Click en **"Run"**

4. **Actualizar metadatos del usuario admin**
   
   El script incluye una sección para actualizar los metadatos. Después de ejecutar el script completo, ejecuta **adicionalmente** este comando:

   ```sql
   -- Actualizar metadatos del usuario administrador
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
       COALESCE(raw_user_meta_data, '{}'::jsonb),
       '{rol}',
       '"administrador"'
   )
   WHERE email = 'admin@institutocajas.edu.pe';
   
   -- Verificar que se actualizó
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'admin@institutocajas.edu.pe';
   ```

5. **Verificar los resultados**
   
   Deberías ver en los resultados:
   ```json
   {
     "rol": "administrador",
     "nombre": "Admin",
     "apellido": "Sistema"
   }
   ```

---

### Opción B: Ejecutar el database.sql Completo Desde Cero

Si prefieres empezar desde cero:

1. **Eliminar todas las políticas actuales**
   ```sql
   DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON usuarios;
   DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON usuarios;
   DROP POLICY IF EXISTS "Administradores pueden insertar usuarios" ON usuarios;
   DROP POLICY IF EXISTS "Administradores pueden actualizar usuarios" ON usuarios;
   DROP POLICY IF EXISTS "Administradores pueden eliminar usuarios" ON usuarios;
   ```

2. **Ejecutar el nuevo database.sql**
   - Abre [`database.sql`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/database.sql) (ya corregido)
   - Ejecuta la sección de políticas RLS (líneas 119-170)

3. **Actualizar metadatos** (igual que en Opción A, paso 4)

---

## 🧪 Probar la Solución

### 1. Verificar que las políticas estén correctas

En SQL Editor:
```sql
SELECT * FROM pg_policies WHERE tablename = 'usuarios';
```

Deberías ver las políticas SIN la recursión.

### 2. Verificar los metadatos del admin

```sql
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@institutocajas.edu.pe';
```

Debe mostrar: `{"rol": "administrador", ...}`

### 3. Probar el login

1. Abre [`index.html`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/index.html)
2. Ingresa:
   - Email: `admin`
   - Contraseña: `Admin@Cajas2025`
3. Click en **"Iniciar Sesión"**
4. ✅ Deberías ser redirigido al dashboard de administrador

---

## 🔍 Verificar en la Consola del Navegador

Después de aplicar la solución, la consola debería mostrar:

```
✅ Supabase configurado correctamente
Auth state changed: SIGNED_IN
¡Bienvenido! Iniciando sesión...
```

**SIN el error:** `infinite recursion detected in policy for relation "usuarios"`

---

## 📋 Checklist de Verificación

- [ ] Ejecuté el script `fix_rls_policies.sql` en Supabase
- [ ] Actualicé los metadatos del usuario admin con el comando UPDATE
- [ ] Verifiqué que los metadatos incluyen `"rol": "administrador"`
- [ ] Probé el login y fui redirigido al dashboard
- [ ] La consola NO muestra errores de recursión infinita

---

## 💡 ¿Por Qué Esta Solución Funciona?

### Problema Original
Las políticas RLS intentaban:
1. Usuario hace login → Supabase aplica políticas RLS
2. Política consulta tabla `usuarios` para verificar rol
3. Consultar `usuarios` requiere aplicar políticas RLS (volver al paso 2)
4. **Bucle infinito** 🔄

### Solución
Las políticas ahora:
1. Usuario hace login → Supabase crea JWT con metadatos
2. Política lee el JWT directamente (desde `auth.jwt()`)
3. **No consulta la tabla** → Sin recursión ✅

El JWT contiene los metadatos del usuario (`user_metadata`) que se guardaron al crear el usuario, incluyendo el `rol`.

---

## 🎯 Siguiente Paso

**Ejecuta el script [`fix_rls_policies.sql`](file:///c:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/fix_rls_policies.sql) en Supabase ahora mismo** y luego prueba el login.

¡Debería funcionar! 🚀
