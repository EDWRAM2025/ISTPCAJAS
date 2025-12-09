# ⚡ BLOQUE 3 - PASO A PASO (2 MINUTOS)

## PASO A: Obtener UUID (30 segundos)

1. Ve a: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/sql/new
2. **Copia y pega** esto:

```sql
SELECT id, email FROM auth.users WHERE email = 'cordedwinegsep@gmail.com';
```

3. Click **Run**
4. Verás algo como:
```
id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
email: cordedwinegsep@gmail.com
```

5. **COPIA el UUID** (el id completo, con guiones)

---

## PASO B: Vincular Usuario (30 segundos)

1. En el mismo SQL Editor, **borra todo**
2. **Copia esto** y **REEMPLAZA** `PEGA_AQUI_EL_UUID` con el UUID que copiaste:

```sql
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
VALUES ('Administrador', 'Sistema', 'admin@institutocajas.edu.pe', 'administrador', 'PEGA_AQUI_EL_UUID');
```

Ejemplo (CON TU UUID REAL):
```sql
INSERT INTO usuarios (nombre, apellido, email, rol, auth_user_id)
VALUES ('Administrador', 'Sistema', 'admin@institutocajas.edu.pe', 'administrador', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
```

3. Click **Run**
4. Deberías ver: `Success. Rows returned: 1`

---

## PASO C: Agregar Metadata (1 minuto)

1. Ve a: https://supabase.com/dashboard/project/cymcihznzdbrqfogrlwr/auth/users
2. **Click** en el usuario: `cordedwinegsep@gmail.com`
3. Busca sección **"User Metadata"** o **"Raw User Meta Data"**
4. Click en **editar** (ícono de lápiz)
5. **Borra** todo lo que haya
6. **Pega** esto EXACTAMENTE:

```json
{"rol":"administrador","nombre":"Administrador","apellido":"Sistema"}
```

7. Click **Save** o **Apply**

---

## ✅ VERIFICAR

1. Ve a SQL Editor
2. Ejecuta:

```sql
SELECT u.*, au.email as auth_email 
FROM usuarios u 
LEFT JOIN auth.users au ON u.auth_user_id = au.id 
WHERE u.email = 'admin@institutocajas.edu.pe';
```

Deberías ver un registro completo con:
- nombre: Administrador
- apellido: Sistema
- email: admin@institutocajas.edu.pe
- rol: administrador
- auth_email: cordedwinegsep@gmail.com

---

## 🚀 PROBAR LOGIN

1. Abre: file:///C:/Users/jesuk/OneDrive/Escritorio/ISTPCAJAS2025_INV/index.html
2. Login:
   - Usuario: `admin`
   - Contraseña: `Admin@Cajas2025`
3. Deberías entrar al dashboard de administrador

---

## 🆘 Si hay error

**Error: "duplicate key value"**
- Ya existe un usuario con ese email
- Ejecuta: `DELETE FROM usuarios WHERE email = 'admin@institutocajas.edu.pe';`
- Vuelve a intentar el INSERT

**Error: "Invalid login credentials"**
- Verifica que el metadata tiene exactamente: `{"rol":"administrador","nombre":"Administrador","apellido":"Sistema"}`
- Sin espacios extra, con comillas dobles

---

**¡Solo 3 pasos y listo!**
