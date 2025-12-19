# Usuarios Creados en Supabase Authentication

## 📋 Listado Completo de Usuarios

Este documento registra todos los usuarios creados en **Supabase Authentication** para el proyecto ISTPCAJAS2025_INV.

> [!IMPORTANT]
> Los usuarios están almacenados en la **base de datos de Supabase**, no en archivos del repositorio. Este archivo es solo una documentación de referencia.

---

## 👥 Total de Usuarios: 16

### 1. Administrador (1 usuario)

| Email | Contraseña | Rol | Estado |
|-------|-----------|------|--------|
| <admin@institutocajas.edu.pe> | Admin@Cajas2025 | administrador | ✅ Confirmado |

### 2. Evaluadores (1 usuario)

| Email | Contraseña | Rol | Estado |
|-------|-----------|------|--------|
| <evaluador@institutocajas.edu.pe> | Evalua@2025 | evaluador | ✅ Confirmado |

### 3. Investigadores

> [!WARNING]
> **PROBLEMA IDENTIFICADO**: Se crearon 7 investigadores incorrectos. Ver `INSTRUCCIONES_CREAR_INVESTIGADORES.md` para corregir.

#### ✅ Investigadores Existentes (9 usuarios)

| # | Email | Contraseña | Estado |
|---|-------|-----------|--------|
| 1 | <investigador@institutocajas.edu.pe> | Invest@2025 | ✅ Confirmado |
| 2 | <oporras@institutocajas.edu.pe> | Invest@2025 | ✅ Confirmado |
| 3 | <lbaldeonb@institutocajas.edu.pe> | Invest@2025 | ✅ Confirmado |
| 4 | <kmateoc@institutocajas.edu.pe> | Invest@2025 | ✅ Confirmado |
| 5 | <lponcem@institutocajas.edu.pe> | Invest@2025 | ✅ Confirmado |
| 6 | <jricaldio@institutocajas.edu.pe> | Invest@2025 | ✅ Confirmado |
| 7 | <rmachad@institutocajas.edu.pe> | Invest@2025 | ✅ Confirmado |
| 8 | <ccarhuachir@institutocajas.edu.pe> | Invest@2025 | ⚠️ Usuario Incorrecto |
| 9 | <fruizy@institutocajas.edu.pe> | Invest@2025 | ⚠️ Usuario Incorrecto |

#### ❌ Investigadores FALTANTES (7 usuarios) - DEBEN CREARSE

| # | Email | Contraseña | Estado |
|---|-------|-----------|--------|
| 1 | <pcajusolis@institutocajas.edu.pe> | Invest@2025 | ❌ NO EXISTE |
| 2 | <mfigueroacb@institutocajas.edu.pe> | Invest@2025 | ❌ NO EXISTE |
| 3 | <dvargasr@institutocajas.edu.pe> | Invest@2025 | ❌ NO EXISTE |
| 4 | <eacturizcetam@institutocajas.edu.pe> | Invest@2025 | ❌ NO EXISTE |
| 5 | <dbegazoa@institutocajas.edu.pe> | Invest@2025 | ❌ NO EXISTE |
| 6 | <mrojass@institutocajas.edu.pe> | Invest@2025 | ❌ NO EXISTE |
| 7 | <rarevalom@institutocajas.edu.pe> | Invest@2025 | ❌ NO EXISTE |

#### ⚠️ Investigadores INCORRECTOS (5 usuarios) - Opcionales para eliminar

| # | Email | Contraseña | Estado |
|---|-------|-----------|--------|
| 1 | <jmerlog@institutocajas.edu.pe> | Invest@2025 | ⚠️ Usuario Incorrecto |
| 2 | <lcardenasp@institutocajas.edu.pe> | Invest@2025 | ⚠️ Usuario Incorrecto |
| 3 | <lpuentey@institutocajas.edu.pe> | Invest@2025 | ⚠️ Usuario Incorrecto |
| 4 | <lrodrigom@institutocajas.edu.pe> | Invest@2025 | ⚠️ Usuario Incorrecto |
| 5 | <rsandovall@institutocajas.edu.pe> | Invest@2025 | ⚠️ Usuario Incorrecto |

---

## 📅 Fecha de Creación

- **Administrador**: Creado inicialmente
- **Evaluador**: 2025-12-19
- **Investigador genérico**: 2025-12-19
- **13 Investigadores adicionales**: 2025-12-19

---

## 🔐 Información de Seguridad

> [!WARNING]
> Estas contraseñas son para **ambiente de desarrollo**. Se recomienda:
>
> 1. Cambiar las contraseñas en producción
> 2. Implementar políticas de contraseñas fuertes
> 3. Activar autenticación de dos factores (2FA)
> 4. Instruir a los usuarios para cambiar su contraseña en el primer inicio de sesión

---

## 📊 Resumen por Rol

| Rol | Cantidad |
|-----|----------|
| Administrador | 1 |
| Evaluador | 1 |
| Investigador | 14 |
| **TOTAL** | **16** |

---

## 🔍 Verificar Usuarios

Para verificar que todos los usuarios existen en Supabase:

1. Abre `verificar_usuarios.html` en tu navegador
2. O ejecuta el script SQL: `verificar_usuarios.sql`
3. O verifica directamente en Supabase Dashboard → Authentication → Users

---

## 📝 Notas Adicionales

- Todos los usuarios fueron creados con la opción **"Auto Confirm User"** activada
- Los usuarios pueden iniciar sesión inmediatamente sin verificación de email
- El dominio `@institutocajas.edu.pe` es utilizado para todos los usuarios del sistema
- Los usuarios están vinculados a la tabla `usuarios` en la base de datos

---

## 🚀 Próximos Pasos

1. ✅ Notificar a cada investigador sus credenciales de acceso
2. ✅ Configurar permisos específicos por rol si es necesario
3. ✅ Implementar cambio de contraseña obligatorio en primer login
4. ✅ Configurar políticas de seguridad y Row Level Security (RLS) en Supabase
