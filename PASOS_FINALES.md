# ⚡ Pasos Finales - Configuración Rápida

## ✅ YA COMPLETADO
- ✅ Credenciales API actualizadas en `supabase-config.js`
- ✅ Bucket `project-files` creado

---

## 🔴 PASO 1: Ejecutar Script SQL (REQUERIDO)

1. Abre el archivo: `init_database.sql`
2. **Selecciona TODO** (Ctrl+A) y **copia** (Ctrl+C)
3. Ve a Supabase: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/sql/new
4. **Pega** el script completo (Ctrl+V)
5. Click en **"Run"** (o Ctrl+Enter)
6. Espera 10-20 segundos
7. Verifica que veas: `"Base de datos inicializada correctamente"`

---

## 🔴 PASO 2: Crear Usuario Administrador

### 2.1 Crear en Authentication
1. Ve a: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/auth/users
2. Click **"Add user"**
3. Llena:
   - Email: `cordedwinegsep@gmail.com`
   - Password: `Admin@Cajas2025`
   - ✓ **Auto Confirm User** (IMPORTANTE)
4. Click **"Create user"**

### 2.2 Agregar Metadata
1. Click en el usuario que acabas de crear
2. Busca **"User Metadata"**
3. Click **editar**
4. Pega este JSON:
```json
{
  "rol": "administrador",
  "nombre": "Administrador",
  "apellido": "Sistema"
}
```
5. **Guardar**

### 2.3 Copiar UUID
1. En la misma página, busca campo **"ID"**
2. **Copia** el UUID completo (formato: a1b2c3d4-...)

### 2.4 Vincular en Base de Datos
1. Ve a SQL Editor: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/sql/new
2. Ejecuta este SQL (reemplaza `AQUI_EL_UUID`):

```sql
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
VALUES (
    'Administrador',
    'Sistema',
    'admin@institutocajas.edu.pe',
    'administrador',
    'AQUI_EL_UUID'
);
```

3. Click **"Run"**

---

## ✅ PASO 3: PROBAR EL SISTEMA

1. Abre: `index.html` en tu navegador
2. Login:
   - Email: `admin`
   - Password: `Admin@Cajas2025`
3. Deberías ver el dashboard de administrador

---

## 🎯 Resumen Rápido

Solo 3 cosas:
1. ✅ Ejecutar `init_database.sql` en SQL Editor
2. ✅ Crear usuario + metadata + vincular
3. ✅ Probar login

**Tiempo estimado: 5-7 minutos**
