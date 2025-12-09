/* ====================================
   AUTH.JS - Autenticación con Supabase
   ==================================== */

// Manejar el formulario de login
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput && eyeIcon) {
        togglePasswordBtn.addEventListener('click', function () {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;

            // Cambiar el icono
            eyeIcon.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    // Abrir modal de recuperación de contraseña
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            openPasswordRecoveryModal();
        });
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
        console.log('📝 Intentando login con email:', email);

        // Mapear emails institucionales ficticios a sus Gmail reales
        const emailMap = {
            'admin@institutocajas.edu.pe': 'cordedwinegsep@gmail.com'
        };

        // Si el email está en el mapa, usar el Gmail real para autenticación
        const authEmail = emailMap[email.toLowerCase()] || email;

        if (authEmail !== email) {
            console.log('🔄 Mapeando email ficticio a Gmail real:', authEmail);
        }

        // Intentar login con Supabase (usando el email real si existe mapeo)
        const result = await SupabaseManager.login(authEmail, password);

        console.log('📦 Resultado de login:', result);

        if (result.error) {
            console.error('❌ Login retornó error:', result.error);
            throw new Error(result.error);
        }

        // Login exitoso
        const userData = result.userData;
        console.log('✅ Login exitoso! userData:', userData);
        console.log('🎭 Rol detectado:', userData.rol);

        // Guardar en localStorage para compatibilidad (opcional)
        if (remember) {
            localStorage.setItem('rememberUser', 'true');
            console.log('💾 Guardado "remember user"');
        }

        showNotification('¡Bienvenido! Iniciando sesión...', 'success');
        console.log('📢 Notificación mostrada');

        // Redireccionar después de un breve delay
        console.log('⏱️ Iniciando timeout para redirección...');
        setTimeout(() => {
            console.log('🚀 Ejecutando redirección con rol:', userData.rol);
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
    console.log('🎯 redirectToDashboard llamada con rol:', rol);

    const dashboards = {
        'administrador': 'dashboard-administrador.html',
        'investigador': 'dashboard-investigador.html',
        'evaluador': 'dashboard-evaluador.html'
    };

    const dashboard = dashboards[rol];
    console.log('🗺️ Dashboard seleccionado:', dashboard);

    if (dashboard) {
        console.log('✈️ Redirigiendo a:', dashboard);
        window.location.href = dashboard;
    } else {
        console.error('❌ Rol no válido:', rol);
        showError('Rol de usuario no válido');
    }
}

// ====================================
// PASSWORD RECOVERY FUNCTIONS
// ====================================

// Abrir modal de recuperación
function openPasswordRecoveryModal() {
    const modal = document.getElementById('passwordRecoveryModal');
    const recoveryEmailInput = document.getElementById('recoveryEmail');
    const recoveryForm = document.getElementById('recoveryForm');
    const closeBtn = document.getElementById('closeRecoveryModal');
    const cancelBtn = document.getElementById('cancelRecovery');
    const overlay = document.getElementById('recoveryModalOverlay');
    const recoveryMessage = document.getElementById('recoveryMessage');

    // Mostrar modal
    modal.style.display = 'flex';

    // Limpiar mensaje anterior
    recoveryMessage.style.display = 'none';
    recoveryMessage.className = 'recovery-message';
    recoveryEmailInput.value = '';

    // Cerrar modal con botones
    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    overlay.onclick = closeModal;

    // Manejar envío del formulario
    recoveryForm.onsubmit = async function (e) {
        e.preventDefault();
        await handlePasswordRecovery(recoveryEmailInput, recoveryMessage);
    };

    // Auto-completar dominio
    recoveryEmailInput.addEventListener('input', function (e) {
        let value = e.target.value;
        if (value.includes('@')) {
            value = value.split('@')[0];
            e.target.value = value;
        }
    });

    recoveryEmailInput.addEventListener('blur', function (e) {
        let value = e.target.value.trim();
        if (value && !value.includes('@')) {
            e.target.value = value + '@institutocajas.edu.pe';
        }
    });

    recoveryEmailInput.addEventListener('focus', function (e) {
        let value = e.target.value;
        if (value.endsWith('@institutocajas.edu.pe')) {
            e.target.value = value.replace('@institutocajas.edu.pe', '');
        }
    });
}

// Manejar recuperación de contraseña
async function handlePasswordRecovery(emailInput, messageDiv) {
    const email = emailInput.value.trim();
    const submitButton = document.querySelector('#recoveryForm button[type="submit"]');

    // Validar email
    if (!email || !isValidEmail(email)) {
        showRecoveryMessage(messageDiv, 'Por favor, ingresa un correo válido', 'error');
        return;
    }

    if (!email.toLowerCase().endsWith(DOMINIO_INSTITUTO)) {
        showRecoveryMessage(messageDiv, `El correo debe ser institucional (${DOMINIO_INSTITUTO})`, 'error');
        return;
    }

    // Mostrar loading
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Enviando...';
    submitButton.disabled = true;

    try {
        const result = await SupabaseManager.resetPassword(email);

        if (result.error) {
            throw new Error(result.error);
        }

        showRecoveryMessage(
            messageDiv,
            '✅ Se ha enviado un enlace de recuperación a tu correo. Por favor, revisa tu bandeja de entrada.',
            'success'
        );

        // Limpiar formulario
        emailInput.value = '';

        // Cerrar modal después de 3 segundos
        setTimeout(() => {
            document.getElementById('passwordRecoveryModal').style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('Error en recuperación:', error);
        showRecoveryMessage(
            messageDiv,
            'Error al enviar el enlace de recuperación. Intenta nuevamente.',
            'error'
        );
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Mostrar mensaje en modal de recuperación
function showRecoveryMessage(messageDiv, text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `recovery-message ${type}`;
    messageDiv.style.display = 'block';
}

// Exportar funciones
window.handleLogin = handleLogin;
window.redirectToDashboard = redirectToDashboard;
window.checkExistingSession = checkExistingSession;
window.openPasswordRecoveryModal = openPasswordRecoveryModal;
