/* ====================================
   AUTH.JS - Autenticación
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

// Verificar sesión existente
function checkExistingSession() {
    const currentUser = StorageManager.getItem('currentUser');

    if (currentUser && window.location.pathname.includes('index.html')) {
        redirectToDashboard(currentUser.rol);
    }
}

// Manejar inicio de sesión
function handleLogin(e) {
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

    // Obtener usuarios
    const usuarios = StorageManager.getItem('usuarios') || [];

    // Buscar usuario
    const user = usuarios.find(u => u.email === email && u.password === password);

    if (user) {
        // Login exitoso
        const userData = {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rol: user.rol
        };

        StorageManager.setItem('currentUser', userData);

        if (remember) {
            StorageManager.setItem('rememberUser', true);
        }

        showNotification('¡Bienvenido! Iniciando sesión...', 'success');

        // Redireccionar después de un breve delay
        setTimeout(() => {
            redirectToDashboard(user.rol);
        }, 1000);
    } else {
        showError('Correo o contraseña incorrectos');
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
