# 📝 Instrucciones: Crear 7 Investigadores Faltantes

## 🎯 Objetivo

Crear los 7 investigadores correctos que actualmente faltan en el sistema.

## ⚠️ Problema Identificado

Se crearon 7 investigadores **incorrectos**. Los usuarios actuales en Supabase son diferentes a los que necesitas.

### ❌ Usuarios Incorrectos (Actualmente en Supabase)

1. <ccarhuachir@institutocajas.edu.pe>
2. <fruizy@institutocajas.edu.pe>
3. <jmerlog@institutocajas.edu.pe>
4. <lcardenasp@institutocajas.edu.pe>
5. <lpuentey@institutocajas.edu.pe>
6. <lrodrigom@institutocajas.edu.pe>
7. <rsandovall@institutocajas.edu.pe>

### ✅ Usuarios Correctos (Los que necesitas crear)

1. <pcajusolis@institutocajas.edu.pe>
2. <mfigueroacb@institutocajas.edu.pe>
3. <dvargasr@institutocajas.edu.pe>
4. <eacturizcetam@institutocajas.edu.pe>
5. <dbegazoa@institutocajas.edu.pe>
6. <mrojass@institutocajas.edu.pe>
7. <rarevalom@institutocajas.edu.pe>

---

## 📋 Pasos para Crear los Usuarios

### PASO 1: Crear Usuarios en Supabase Authentication

1. Ve a: <https://supabase.com/dashboard>
2. Selecciona el proyecto **ISTPCAJASCHAT**
3. Ve a **Authentication** → **Users**
4. Para **CADA** uno de los 7 emails correctos, haz lo siguiente:

   **a.** Click en **"Add user"** → **"Create new user"**

   **b.** Ingresa el email (ejemplo: `pcajusolis@institutocajas.edu.pe`)

   **c.** Ingresa la contraseña: `Invest@2025`

   **d.** ✅ Marca la opción **"Auto Confirm User"**

   **e.** Click en **"Create user"**

   **f.** Espera a que aparezca el mensaje de éxito

   **g.** Repite con el siguiente email

### PASO 2: Ejecutar Script SQL

1. En Supabase, ve a **SQL Editor**
2. Click en **"New query"**
3. Abre el archivo: `crear_7_investigadores_faltantes.sql`
4. Copia TODO el contenido del archivo
5. Pégalo en el editor SQL
6. Click en **"Run"**
7. Verifica que veas 7 usuarios con estado "✅ Vinculado"

### PASO 3: Verificar

1. Ve a **Authentication** → **Users**
2. Deberías ver ahora **23 usuarios** en total (16 anteriores + 7 nuevos)
3. Busca cada uno de los 7 emails nuevos para confirmar que existen
4. Prueba el login con uno de ellos en `verificar_usuarios.html`

---

## 🔄 Opción Alternativa: Eliminar Usuarios Incorrectos

Si prefieres tener solo los usuarios correctos, puedes:

1. **Eliminar** los 7 usuarios incorrectos desde Authentication → Users
2. **Crear** los 7 usuarios correctos siguiendo el PASO 1
3. **Ejecutar** el script SQL del PASO 2

---

## ✅ Verificación Final

Después de completar los pasos, verifica:

- [ ] Los 7 nuevos usuarios aparecen en Authentication → Users
- [ ] Todos tienen estado "Confirmed"
- [ ] Al ejecutar el script SQL, todos muestran "✅ Vinculado"
- [ ] Puedes iniciar sesión con al menos uno de ellos

---

## 🆘 Solución de Problemas

**Si el script SQL falla:**

- Asegúrate de haber creado PRIMERO los usuarios en Authentication
- Verifica que los emails estén escritos correctamente
- Revisa que la tabla `usuarios` exista en tu base de datos

**Si no puedes iniciar sesión:**

- Verifica que usaste la contraseña correcta: `Invest@2025`
- Confirma que el usuario tiene estado "Confirmed" en Authentication
- Revisa que el usuario esté en la tabla `usuarios` con `auth_user_id` vinculado

---

## 📞 Contacto

Si tienes problemas, avísame y te ayudaré a resolverlos.
