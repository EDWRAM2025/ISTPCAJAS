/* ====================================
   SUPABASE-CONFIG.JS - Configuración Supabase
   ==================================== */

// PROYECTO: ISTCAJASCHAT (lfegqescnkegwjpgcesj)
// Configuración actualizada: 2025-12-18

const SUPABASE_URL = 'https://lfegqescnkegwjpgcesj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZWdxZXNjbmtlZ3dqcGdjZXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDM3NzQsImV4cCI6MjA4MTY3OTc3NH0.7fAi3bU0O7nVDfoYGqyQ_SHUBwgvKpLeA3AiDYxTkUA';

// Inicializar cliente de Supabase
// Guardar referencia a la librería
const supabaseLib = window.supabase;

// Crear cliente de Supabase (usar var para permitir reasignación)
var supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// SUPABASE MANAGER - Gestión de Base de Datos
// =============================================

class SupabaseManager {
    // ==================== USUARIOS ====================

    /**
     * Obtener todos los usuarios
     */
    static async getUsuarios() {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            showNotification('Error al cargar usuarios', 'error');
            return [];
        }
    }

    /**
     * Crear un nuevo usuario
     */
    static async createUsuario(userData) {
        try {
            // 1. Crear usuario en Auth (con email y password temporal)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password || 'TempPassword123!',
                options: {
                    data: {
                        nombre: userData.nombre,
                        apellido: userData.apellido,
                        rol: userData.rol
                    }
                }
            });

            if (authError) throw authError;

            // 2. Crear registro en tabla usuarios
            const { data, error } = await supabase
                .from('usuarios')
                .insert([{
                    nombre: userData.nombre,
                    apellido: userData.apellido,
                    email: userData.email,
                    rol: userData.rol,
                    auth_user_id: authData.user.id
                }])
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            showNotification('Error al crear usuario: ' + error.message, 'error');
            return null;
        }
    }

    /**
     * Actualizar usuario
     */
    static async updateUsuario(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            showNotification('Error al actualizar usuario', 'error');
            return null;
        }
    }

    /**
     * Eliminar usuario
     */
    static async deleteUsuario(userId) {
        try {
            const { error } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            showNotification('Error al eliminar usuario', 'error');
            return false;
        }
    }

    // ==================== PROYECTOS ====================

    /**
     * Obtener todos los proyectos
     */
    static async getProyectos(filtros = {}) {
        try {
            let query = supabase
                .from('proyectos_completos')
                .select('*');

            // Aplicar filtros
            if (filtros.categoria) {
                query = query.eq('categoria', filtros.categoria);
            }
            if (filtros.investigador_id) {
                query = query.eq('investigador_id', filtros.investigador_id);
            }
            if (filtros.estado) {
                query = query.eq('estado', filtros.estado);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al obtener proyectos:', error);
            showNotification('Error al cargar proyectos', 'error');
            return [];
        }
    }

    /**
     * Obtener un proyecto por ID
     */
    static async getProyecto(proyectoId) {
        try {
            const { data, error } = await supabase
                .from('proyectos_completos')
                .select('*')
                .eq('id', proyectoId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener proyecto:', error);
            return null;
        }
    }

    /**
     * Crear un nuevo proyecto
     */
    static async createProyecto(proyectoData) {
        try {
            const { data, error } = await supabase
                .from('proyectos')
                .insert([proyectoData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al crear proyecto:', error);
            showNotification('Error al crear proyecto', 'error');
            return null;
        }
    }

    /**
     * Actualizar proyecto
     */
    static async updateProyecto(proyectoId, updates) {
        try {
            const { data, error } = await supabase
                .from('proyectos')
                .update(updates)
                .eq('id', proyectoId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al actualizar proyecto:', error);
            showNotification('Error al actualizar proyecto', 'error');
            return null;
        }
    }

    /**
     * Subir archivo PDF de proyecto a Storage
     */
    static async uploadProyectoFile(proyectoId, file) {
        try {
            const fileName = `${proyectoId}/segundo-entregable-${Date.now()}.pdf`;

            const { data, error } = await supabase.storage
                .from('project-files')
                .upload(fileName, file, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (error) throw error;

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('project-files')
                .getPublicUrl(fileName);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error al subir archivo:', error);
            showNotification('Error al subir archivo', 'error');
            return null;
        }
    }

    // ==================== EVALUACIONES ====================

    /**
     * Obtener evaluaciones de un proyecto
     */
    static async getEvaluaciones(proyectoId) {
        try {
            const { data, error } = await supabase
                .from('evaluaciones_completas')
                .select('*')
                .eq('proyecto_id', proyectoId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al obtener evaluaciones:', error);
            return [];
        }
    }

    /**
     * Crear evaluación
     */
    static async createEvaluacion(evaluacionData) {
        try {
            const { data, error } = await supabase
                .from('evaluaciones')
                .insert([evaluacionData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al crear evaluación:', error);
            showNotification('Error al guardar evaluación', 'error');
            return null;
        }
    }

    /**
     * Actualizar evaluación
     */
    static async updateEvaluacion(evaluacionId, updates) {
        try {
            const { data, error } = await supabase
                .from('evaluaciones')
                .update(updates)
                .eq('id', evaluacionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al actualizar evaluación:', error);
            showNotification('Error al actualizar evaluación', 'error');
            return null;
        }
    }

    // ==================== CONFIGURACIÓN ====================

    /**
     * Obtener configuración (por ej. fechas límite)
     */
    static async getConfiguracion(clave) {
        try {
            const { data, error } = await supabase
                .from('configuracion')
                .select('valor')
                .eq('clave', clave)
                .single();

            if (error) throw error;
            return data?.valor || null;
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            return null;
        }
    }

    /**
     * Actualizar configuración
     */
    static async updateConfiguracion(clave, valor) {
        try {
            const { data, error } = await supabase
                .from('configuracion')
                .upsert({
                    clave: clave,
                    valor: valor
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al actualizar configuración:', error);
            showNotification('Error al actualizar configuración', 'error');
            return null;
        }
    }

    // ==================== AUTENTICACIÓN ====================

    /**
     * Login con email y password
     */
    static async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Obtener datos completos del usuario desde la tabla usuarios
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('auth_user_id', data.user.id)
                .single();

            if (userError) throw userError;

            return { user: data.user, userData: userData };
        } catch (error) {
            console.error('Error en login:', error);
            return { error: error.message };
        }
    }

    /**
     * Logout
     */
    static async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error en logout:', error);
            return false;
        }
    }

    /**
     * Obtener sesión actual
     */
    static async getSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        } catch (error) {
            console.error('Error al obtener sesión:', error);
            return null;
        }
    }

    /**
     * Obtener usuario actual
     */
    static async getCurrentUser() {
        try {
            console.log('🔐 SupabaseManager.getCurrentUser: Obteniendo usuario de Auth...');
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                console.error('❌ Error en auth.getUser():', error);
                throw error;
            }

            console.log('👤 Usuario de Auth:', user);

            if (!user) {
                console.warn('⚠️ No hay usuario autenticado en Auth');
                return null;
            }

            console.log('🔍 Buscando en tabla usuarios con auth_user_id:', user.id);

            // Obtener datos completos
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('auth_user_id', user.id)
                .single();

            if (userError) {
                console.error('❌ Error al buscar en tabla usuarios:', userError);
                throw userError;
            }

            console.log('✅ Datos del usuario encontrados:', userData);
            return userData;
        } catch (error) {
            console.error('❌ Error al obtener usuario actual:', error);
            return null;
        }
    }
}

// Exportar para uso global
window.supabase = supabase;
window.SupabaseManager = SupabaseManager;

// Escuchar cambios en la autenticación
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);

    if (event === 'SIGNED_OUT') {
        // Redirigir al login
        window.location.href = 'index.html';
    }
});

console.log('✅ Supabase configurado correctamente - Proyecto: ISTCAJASCHAT');
console.log('📦 Exportando a window:', { supabase: !!window.supabase, SupabaseManager: !!window.SupabaseManager });

// Disparar evento personalizado para notificar que Supabase está listo
console.log('🚀 Disparando evento supabaseReady');
window.dispatchEvent(new CustomEvent('supabaseReady'));
console.log('✅ Evento supabaseReady disparado');
