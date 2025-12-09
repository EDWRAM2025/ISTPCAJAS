# 🚀 EJECUTAR TODO - 3 MINUTOS

## ✅ PASO 1: Ejecutar Script SQL (1 minuto)

### A. Copiar Script
Selecciona TODO este código (Ctrl+A en este bloque):

```sql
DO $$
DECLARE user_uuid UUID;
BEGIN
    -- Buscar el UUID del usuario Gmail
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'cordedwinegsep@gmail.com';
    
    -- Verificar que el usuario existe
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION '❌ ERROR: El usuario cordedwinegsep@gmail.com NO existe en auth.users. Primero debes crear este usuario en Authentication > Users';
    END IF;
    
    -- Eliminar usuario admin anterior si existe
    DELETE FROM usuarios WHERE email = 'admin@institutocajas.edu.pe';
    
    -- Crear nuevo usuario admin vinculado al Gmail
    INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
    VALUES ('Administrador', 'Sistema', 'admin@institutocajas.edu.pe', 'administrador', user_uuid);
    
    RAISE NOTICE '✅ Usuario administrador creado exitosamente';
END $$;

-- Verificar el resultado
SELECT u.nombre, u.email, u.rol, au.email as gmail_vinculado
FROM usuarios u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'admin@institutocajas.edu.pe';
```

### B. Pegar y Ejecutar
1. Ve a: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/sql/new
2. Click en el editor SQL
3. **Ctrl+A** (seleccionar todo)
4. **Ctrl+V** (pegar el script)
5. Click en botón **"Run"** (esquina superior derecha)
6. Espera 3-5 segundos

### C. Verificar
Deberías ver una tabla con:
- nombre: Administrador
- email: admin@institutocajas.edu.pe
- rol: administrador
- gmail_vinculado: cordedwinegsep@gmail.com

✅ Si ves esto, el paso 1 está COMPLETO

---

## ✅ PASO 2: Agregar Metadata (30 segundos)

### Método Rápido con SQL (RECOMENDADO)

1. Ve a: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/sql/new
2. **Ctrl+A** (seleccionar todo en el editor)
3. **Ctrl+V** (pegar este script):

```sql
-- Actualizar metadata del usuario Gmail
UPDATE auth.users
SET raw_user_meta_data = '{"rol":"administrador","nombre":"Administrador","apellido":"Sistema"}'::jsonb
WHERE email = 'cordedwinegsep@gmail.com';

-- Verificar que se actualizó correctamente
SELECT email, raw_user_meta_data
FROM auth.users
WHERE email = 'cordedwinegsep@gmail.com';
```

4. Click en **"Run"**

### Resultado Esperado:
Deberías ver:
- **email**: cordedwinegsep@gmail.com
- **raw_user_meta_data**: `{"rol": "administrador", "nombre": "Administrador", "apellido": "Sistema"}`

✅ Si ves esto, el paso 2 está COMPLETO

---

## ✅ PASO 3: Probar Login (1 minuto)

### A. Abrir Sistema
1. Abre en tu navegador: `C:\Users\jesuk\OneDrive\Escritorio\ISTPCAJAS2025_INV\index.html`
2. O haz doble click en el archivo `index.html`

### B. Login
1. En el campo **Email**: escribe `admin`
2. En el campo **Contraseña**: escribe `Admin@Cajas2025`
3. Click en **"Iniciar Sesión"**

### C. Resultado Esperado
✅ **ÉXITO**: Te redirige a `dashboard-administrador.html`
❌ **ERROR**: Aparece mensaje "Correo o contraseña incorrectos"

> [!NOTE]
> El sistema mapea automáticamente `admin@institutocajas.edu.pe` (email ficticio) a `cordedwinegsep@gmail.com` (email real) para la autenticación.

---

## 🆘 Si hay ERROR en el Login

### Verificar Contraseña del Gmail
1. Ve a: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/auth/users
2. Click en `cordedwinegsep@gmail.com`
3. Resetea la contraseña a `Admin@Cajas2025`

### Verificar Metadata
Verifica que User Metadata tenga EXACTAMENTE:
```json
{"rol":"administrador","nombre":"Administrador","apellido":"Sistema"}
```

Debe mostrar:
- rol: administrador
- gmail: cordedwinegsep@gmail.com

Si no sale nada, repite PASO 1.

---

## ✅ CHECKLIST FINAL

- [ ] Script SQL ejecutado sin errores
- [ ] Usuario muestra gmail_vinculado: cordedwinegsep@gmail.com
- [ ] Metadata agregado con rol: administrador
- [ ] Contraseña del Gmail reseteada
- [ ] Login funciona y redirige a dashboard-administrador.html

**¡Si todas están marcadas, el sistema está 100% funcional!**

---

## 📌 DATOS DE LOGIN

**Email**: `admin` (se autocompletará a admin@institutocajas.edu.pe)
**Password**: `Admin@Cajas2025`  
**Email Real (Gmail vinculado)**: cordedwinegsep@gmail.com
