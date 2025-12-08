/* ====================================
   AUTH.JS - Autenticación con Supabase
   ==================================== */

// Manejar el formulario de login
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Auto-completar dominio del email
    if (emailInput) {
        emailInput.addEventListener('input', function (e) {
            let value = e.target.value;
            // Remover el dominio si el usuario lo escribió
            if (value.includes('@')) {
                value = value.split('@')[0];
                e.target.value = value;
            }
        });

        emailInput.addEventListener('blur', function (e) {
            let value = e.target.value.trim();
            if (value && !value.includes('@')) {
                e.target.value = value + '@institutocajas.edu.pe';
            }
        });

        emailInput.addEventListener('focus', function (e) {
            let value = e.target.value;
            // Remover el dominio al enfocar para editar solo el usuario
            if (value.endsWith('@institutocajas.edu.pe')) {
                e.target.value = value.replace('@institutocajas.edu.pe', '');
            }
        });
    }

    // Verificar si ya hay sesión activa
    checkExistingSession();
});

// Verificar sesión existente con Supabase
async function checkExistingSession() {
    try {
        const session = await SupabaseManager.getSession();

        if (session && window.location.pathname.includes('index.html')) {
            // Obtener datos del usuario desde la tabla usuarios
            const userData = await SupabaseManager.getCurrentUser();
            if (userData) {
                redirectToDashboard(userData.rol);
            }
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
    }
}

// Manejar inicio de sesión con Supabase
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    // Validar campos vacíos
    if (!email || !password) {
        showError('Por favor, completa todos los campos');
        return;
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
        showError('Por favor, ingresa un correo electrónico válido');
        return;
    }

    // Validar que sea correo institucional
    if (!email.toLowerCase().endsWith(DOMINIO_INSTITUTO)) {
        showError(`El correo debe ser institucional (${DOMINIO_INSTITUTO})`);
        return;
    }

    // Mostrar loading
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Iniciando sesión...';
    submitButton.disabled = true;

    try {
        // Intentar login con Supabase
        const result = await SupabaseManager.login(email, password);

        if (result.error) {
            throw new Error(result.error);
        }

        // Login exitoso
        const userData = result.userData;

        // Guardar en localStorage para compatibilidad (opcional)
        if (remember) {
            localStorage.setItem('rememberUser', 'true');
        }

        showNotification('¡Bienvenido! Iniciando sesión...', 'success');

        // Redireccionar después de un breve delay
        setTimeout(() => {
            redirectToDashboard(userData.rol);
        }, 1000);

    } catch (error) {
        console.error('Error en login:', error);
        submitButton.textContent = originalText;
        submitButton.disabled = false;

        if (error.message.includes('Invalid login credentials')) {
            showError('Correo o contraseña incorrectos');
        } else {
            showError('Error al iniciar sesión. Intenta nuevamente.');
        }
    }
}

// Mostrar error en el formulario
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Redireccionar según rol
function redirectToDashboard(rol) {
    const dashboards = {
        'administrador': 'dashboard-administrador.html',
        'investigador': 'dashboard-investigador.html',
        'evaluador': 'dashboard-evaluador.html'
    };

    const dashboard = dashboards[rol];
    if (dashboard) {
        window.location.href = dashboard;
    } else {
        showError('Rol de usuario no válido');
    }
}

// Exportar funciones
window.handleLogin = handleLogin;
window.redirectToDashboard = redirectToDashboard;
window.checkExistingSession = checkExistingSession;
