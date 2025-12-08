/* ====================================
   MAIN.JS - Funciones Globales
   ==================================== */

// Dominio institucional
const DOMINIO_INSTITUTO = '@institutocajas.edu.pe';

// Clase para gestionar el LocalStorage
class StorageManager {
    static setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static getItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    static removeItem(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }
}

// Inicializar datos de demostración
function initDemoData() {
    const usuariosGuardados = StorageManager.getItem('usuarios');

    // Regenerar usuarios si:
    // - No existen
    // - Son antiguos y NO tienen el nuevo dominio
    const debeRegenerar =
        !usuariosGuardados ||
        !Array.isArray(usuariosGuardados) ||
        usuariosGuardados.length === 0 ||
        !usuariosGuardados[0].email.endsWith(DOMINIO_INSTITUTO);

    if (debeRegenerar) {
        const usuarios = [
            {
                id: 1,
                nombre: 'Admin',
                apellido: 'Sistema',
                email: `admin${DOMINIO_INSTITUTO}`,
                password: 'admin123',
                rol: 'administrador'
            },
            {
                id: 2,
                nombre: 'Carlos',
                apellido: 'Investigador',
                email: `investigador${DOMINIO_INSTITUTO}`,
                password: 'inv123',
                rol: 'investigador'
            },
            {
                id: 3,
                nombre: 'María',
                apellido: 'Evaluador',
                email: `evaluador${DOMINIO_INSTITUTO}`,
                password: 'eval123',
                rol: 'evaluador'
            }
        ];

        StorageManager.setItem('usuarios', usuarios);
    }

    // Inicializar proyectos vacíos si no existen
    if (!StorageManager.getItem('proyectos')) {
        StorageManager.setItem('proyectos', []);
    }
}

// Obtener usuario actual (ahora asíncrono con Supabase)
async function getCurrentUser() {
    try {
        const userData = await SupabaseManager.getCurrentUser();
        return userData;
    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        return null;
    }
}

// Cerrar sesión con Supabase
async function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        try {
            await SupabaseManager.logout();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Forzar redirección incluso si hay error
            window.location.href = 'index.html';
        }
    }
}

// Verificar autenticación (ahora asíncrono)
async function checkAuth() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return false;
    }
    return currentUser;
}

// Verificar rol de usuario
function checkRole(allowedRoles) {
    const user = getCurrentUser();
    if (!user || !allowedRoles.includes(user.rol)) {
        alert('No tienes permisos para acceder a esta página');
        logout();
        return false;
    }
    return true;
}

// Formatear fecha
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Formatear fecha corta
function formatDateShort(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Generar ID único
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

// Confirmación
function confirmAction(message) {
    return confirm(message);
}

// Categorías
function getCategoryName(category) {
    const names = {
        'investigacion-aplicada': 'Investigación Aplicada',
        'innovacion-tecnologica': 'Innovación Tecnológica',
        'innovacion-pedagogica': 'Innovación Pedagógica'
    };
    return names[category] || category;
}

// Estados (colores, badges)
function getStatusColor(status) {
    const colors = {
        'pendiente': '#FF9800',
        'aprobado': '#4CAF50',
        'rechazado': '#f44336'
    };
    return colors[status] || '#2196F3';
}

function getStatusBadge(status) {
    const badges = {
        'pendiente': '<span class="badge badge-pending">Pendiente</span>',
        'aprobado': '<span class="badge badge-approved">Aprobado</span>',
        'rechazado': '<span class="badge badge-rejected">Rechazado</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
}

// Roles
function getRolBadge(rol) {
    const badges = {
        'administrador': '<span class="badge badge-admin">Administrador</span>',
        'investigador': '<span class="badge badge-investigador">Investigador</span>',
        'evaluador': '<span class="badge badge-evaluador">Evaluador</span>'
    };
    return badges[rol] || `<span class="badge">${rol}</span>`;
}

// Actualizar interfaz con datos del usuario actual (ahora asíncrono)
async function updateUserInfo() {
    const user = await getCurrentUser();
    if (!user) return;

    const userNameElements = document.querySelectorAll('#userName, #userNameTop');
    userNameElements.forEach(el => el.textContent = `${user.nombre} ${user.apellido}`);

    const roleEl = document.getElementById('userRole');
    if (roleEl) roleEl.textContent = user.rol;

    const initialsEl = document.getElementById('userInitials');
    if (initialsEl) initialsEl.textContent = user.nombre.charAt(0) + user.apellido.charAt(0);
}

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', async function () {
    initDemoData();
    if (window.location.pathname.includes('dashboard')) {
        await updateUserInfo(); // Esperar a que se cargue el usuario
    }
});

// Calcular días restantes
function getDaysRemaining(dateString) {
    const diffTime = new Date(dateString) - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Validar email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Truncar texto
function truncateText(text, maxLength) {
    return text.length <= maxLength ? text : text.substr(0, maxLength) + '...';
}

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function () {
    initDemoData();
    if (window.location.pathname.includes('dashboard')) updateUserInfo();
});

// Exportar funciones
window.StorageManager = StorageManager;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.checkAuth = checkAuth;
window.checkRole = checkRole;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.generateId = generateId;
window.showNotification = showNotification;
window.confirmAction = confirmAction;
window.getCategoryName = getCategoryName;
window.getStatusColor = getStatusColor;
window.getStatusBadge = getStatusBadge;
window.getRolBadge = getRolBadge;
window.updateUserInfo = updateUserInfo;
window.getDaysRemaining = getDaysRemaining;
window.isValidEmail = isValidEmail;
window.truncateText = truncateText;

