/* ====================================
   ADMINISTRADOR.JS - Módulo Administrador
   ==================================== */

// Inicialización
document.addEventListener('DOMContentLoaded', async function () {
    if (window.location.pathname.includes('dashboard-administrador')) {
        await checkRole(['administrador']);
        await updateUserInfo();
        loadAdminStats();
    }
});

// Cargar estadísticas del administrador
function loadAdminStats() {
    const usuarios = StorageManager.getItem('usuarios') || [];
    const proyectos = StorageManager.getItem('proyectos') || [];

    const totalUsuarios = usuarios.length;
    const totalProyectos = proyectos.length;
    const aprobados = proyectos.filter(p => p.estado === 'aprobado').length;
    const rechazados = proyectos.filter(p => p.estado === 'rechazado').length;

    updateElementText('totalUsuarios', totalUsuarios);
    updateElementText('totalProyectosAdmin', totalProyectos);
    updateElementText('proyectosAprobadosAdmin', aprobados);
    updateElementText('proyectosRechazadosAdmin', rechazados);
}

// Mostrar gestión de usuarios
function mostrarGestionUsuarios(e) {
    if (e) e.preventDefault();

    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('reportesView').style.display = 'none';
    document.getElementById('gestionUsuariosView').style.display = 'block';

    cargarTablaUsuarios();
}

// Mostrar reportes
function mostrarReportes(e) {
    if (e) e.preventDefault();

    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('gestionUsuariosView').style.display = 'none';
    document.getElementById('reportesView').style.display = 'block';

    cargarReportesProyectos();
}

// Cargar tabla de usuarios (BOTONES CENTRADOS Y UNIFORMES)
function cargarTablaUsuarios() {
    const usuarios = StorageManager.getItem('usuarios') || [];
    const tbody = document.getElementById('usuariosTableBody');

    if (!tbody) return;

    tbody.innerHTML = usuarios.map(usuario => `
        <tr>
            <td style="vertical-align: middle;">${usuario.nombre}</td>
            <td style="vertical-align: middle;">${usuario.apellido}</td>
            <td style="vertical-align: middle;">${usuario.email}</td>
            <td style="vertical-align: middle;">${getRolBadge(usuario.rol)}</td>
            <td style="vertical-align: middle;">${formatDateShort(usuario.fechaCreacion)}</td>
            <td style="vertical-align: middle;">
                ${usuario.rol !== 'administrador' ?
            `<div style="display:flex; gap:5px; align-items:center;">
                        <!-- BOTÓN EDITAR (Amarillo) -->
                        <button onclick="editarUsuario('${usuario.id}')" title="Editar" 
                            style="
                                background: #FFC107; 
                                color: white; 
                                border: none; 
                                width: 32px; 
                                height: 32px; 
                                border-radius: 4px; 
                                cursor: pointer; 
                                display: inline-flex; 
                                align-items: center; 
                                justify-content: center;
                                font-size: 16px;
                                transition: all 0.2s ease;
                            ">
                            ✏️
                        </button>

                        <!-- BOTÓN ELIMINAR (Rojo) -->
                        <button onclick="eliminarUsuario('${usuario.id}')" title="Eliminar"
                            style="
                                background: #F44336; 
                                color: white; 
                                border: none; 
                                width: 32px; 
                                height: 32px; 
                                border-radius: 4px; 
                                cursor: pointer; 
                                display: inline-flex; 
                                align-items: center; 
                                justify-content: center;
                                font-size: 16px;
                                transition: all 0.2s ease;
                            ">
                            🗑️
                        </button>
                    </div>` :
            '<span style="color: #ccc;">-</span>'
        }
            </td>
        </tr>
    `).join('');
}

// Cargar reportes de proyectos
function cargarReportesProyectos() {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const tbody = document.getElementById('reportesProyectosBody');

    if (!tbody) return;

    if (proyectos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #718096;">No hay proyectos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = proyectos.map(proyecto => `
        <tr>
            <td>${proyecto.titulo}</td>
            <td>${getCategoryName(proyecto.categoria)}</td>
            <td>${proyecto.investigadorNombre}</td>
            <td>${getStatusBadge(proyecto.estado)}</td>
            <td>${formatDateShort(proyecto.fechaCreacion)}</td>
        </tr>
    `).join('');
}

// Mostrar modal crear usuario
function mostrarModalCrearUsuario() {
    const modal = document.getElementById('modalCrearUsuario');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    // Setup form
    const form = document.getElementById('formCrearUsuario');
    if (form) {
        form.addEventListener('submit', handleCrearUsuario);
    }

    // Setup email generation
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');

    if (nombreInput && apellidoInput) {
        nombreInput.addEventListener('input', generateEmail);
        apellidoInput.addEventListener('input', generateEmail);
    }
}

// Cerrar modal crear usuario
function cerrarModalCrearUsuario() {
    const modal = document.getElementById('modalCrearUsuario');
    const form = document.getElementById('formCrearUsuario');

    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    if (form) {
        form.reset();
        document.getElementById('emailGenerado').value = '@institutocajas.edu.pe';
    }
}

// Función auxiliar: limpia tildes y caracteres raros
function limpiarTexto(txt) {
    return txt
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita tildes
        .replace(/[^a-z\s]/g, "");       // solo letras y espacios
}

// Generar correo con estructura:
// 1ra letra del primer nombre + apellido paterno + inicial apellido materno
// Ej: "Lourdes Lidia" + "Cardenas Perez" -> lcardenasp@institutocajas.edu.pe
function generarCorreoInstituto(nombre, apellidos) {
    const nombreLimpio = limpiarTexto(nombre).trim();
    const apellidosLimpios = limpiarTexto(apellidos).trim();

    if (!nombreLimpio || !apellidosLimpios) return '@institutocajas.edu.pe';

    const partesNombre = nombreLimpio.split(/\s+/);
    const partesApellidos = apellidosLimpios.split(/\s+/);

    const inicialNombre = partesNombre[0]?.[0] || '';
    const apellidoPaterno = partesApellidos[0] || '';
    const inicialApellidoMaterno = partesApellidos.length > 1
        ? partesApellidos[partesApellidos.length - 1][0]
        : '';

    return `${inicialNombre}${apellidoPaterno}${inicialApellidoMaterno}@institutocajas.edu.pe`;
}

// Generar email automáticamente (para el input)
function generateEmail() {
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const emailField = document.getElementById('emailGenerado');

    emailField.value = generarCorreoInstituto(nombre, apellido);
}

// Manejar creación de usuario
async function handleCrearUsuario(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const password = document.getElementById('password').value;
    const rol = document.getElementById('rol').value;

    // Validaciones
    if (!nombre || !apellido || !password || !rol) {
        showNotification('Por favor, completa todos los campos', 'warning');
        return;
    }

    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }

    // Generar email institucional
    const email = generarCorreoInstituto(nombre, apellido);

    try {
        console.log('Creando usuario en Supabase Auth...', email);

        // 1. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await SupabaseManager.createUser(email, password);

        if (authError) {
            console.error('Error al crear usuario en Auth:', authError);

            // Si el error es que el usuario ya existe, intentar crearlo solo en la tabla
            if (authError.message && authError.message.includes('already registered')) {
                showNotification('El email ya está registrado en el sistema', 'error');
                return;
            }

            throw authError;
        }

        console.log('Usuario creado en Auth:', authData);

        // 2. Insertar en tabla usuarios con el auth_user_id
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .insert([{
                nombre: nombre,
                apellido: apellido,
                email: email,
                rol: rol,
                auth_user_id: authData.user.id
            }])
            .select()
            .single();

        if (userError) {
            console.error('Error al insertar en tabla usuarios:', userError);
            // Si falla la inserción en la tabla, deberíamos eliminar el usuario de Auth
            // pero Supabase no permite eliminar usuarios desde el cliente por seguridad
            throw userError;
        }

        console.log('Usuario insertado en tabla usuarios:', userData);

        showNotification(`Usuario ${nombre} ${apellido} creado exitosamente`, 'success');
        cerrarModalCrearUsuario();

        // Recargar tabla de usuarios
        await cargarTablaUsuarios();
        await loadAdminStats();

    } catch (error) {
        console.error('Error al crear usuario:', error);
        showNotification('Error al crear usuario: ' + (error.message || 'Error desconocido'), 'error');
    }
}

// Eliminar usuario
function eliminarUsuario(userId) {
    if (!confirmAction('¿Estás seguro de que deseas eliminar este usuario?')) {
        return;
    }

    const usuarios = StorageManager.getItem('usuarios') || [];
    const usuariosFiltrados = usuarios.filter(u => u.id != userId);

    StorageManager.setItem('usuarios', usuariosFiltrados);

    showNotification('Usuario eliminado correctamente', 'success');
    cargarTablaUsuarios();
    loadAdminStats();
}

// Función auxiliar
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Exportar funciones
window.mostrarGestionUsuarios = mostrarGestionUsuarios;
window.mostrarReportes = mostrarReportes;
window.mostrarModalCrearUsuario = mostrarModalCrearUsuario;
window.cerrarModalCrearUsuario = cerrarModalCrearUsuario;
window.generateEmail = generateEmail;
window.eliminarUsuario = eliminarUsuario;

/* ===========================================================
   FUNCIONES DE EDICIÓN DE USUARIO
   =========================================================== */

function editarUsuario(userId) {
    // 1. Limpiar modales previos
    const existente = document.getElementById('modalEditarUsuario');
    if (existente) existente.remove();

    const usuarios = StorageManager.getItem('usuarios') || [];
    const usuario = usuarios.find(u => u.id === userId);

    if (!usuario) {
        showNotification('Usuario no encontrado', 'error');
        return;
    }

    // 2. HTML del Modal de Edición (ESTILIZADO)
    const modalHTML = `
        <div id="modalEditarUsuario" class="modal active" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
            <div class="modal-content" style="background: white; padding: 25px; border-radius: 8px; width: 100%; max-width: 500px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: #333;">✏️ Editar Usuario</h3>
                    <button type="button" onclick="document.getElementById('modalEditarUsuario').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">&times;</button>
                </div>

                <form id="formEditarUsuario">
                    <input type="hidden" id="edit_userId" value="${usuario.id}">
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #444;">Nombre</label>
                        <input type="text" id="edit_nombre" class="form-control" value="${usuario.nombre}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #444;">Apellidos</label>
                        <input type="text" id="edit_apellido" class="form-control" value="${usuario.apellido}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #444;">Correo Institucional</label>
                        <input type="text" id="edit_email" class="form-control" value="${usuario.email}" readonly style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; background: #f0f2f5; color: #666;">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #444;">Rol</label>
                        <select id="edit_rol" class="form-control" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; background: white;">
                            <option value="investigador" ${usuario.rol === 'investigador' ? 'selected' : ''}>Investigador</option>
                            <option value="evaluador" ${usuario.rol === 'evaluador' ? 'selected' : ''}>Evaluador</option>
                            <option value="administrador" ${usuario.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #444;">Contraseña <small style="color: #888; font-weight: normal;">(Opcional)</small></label>
                        <input type="password" id="edit_password" class="form-control" placeholder="Nueva contraseña..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
                    </div>

                    <!-- BOTONES ESTILIZADOS -->
                    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #eee; padding-top: 15px;">
                        
                        <button type="button" onclick="document.getElementById('modalEditarUsuario').remove()" 
                            style="
                                background: #e0e0e0; 
                                color: #333; 
                                border: none; 
                                padding: 10px 20px; 
                                border-radius: 6px; 
                                cursor: pointer; 
                                font-weight: 600;
                                font-size: 14px;
                            ">
                            Cancelar
                        </button>

                        <button type="submit" 
                            style="
                                background: #1a237e; /* Azul oscuro profesional */
                                color: white; 
                                border: none; 
                                padding: 10px 20px; 
                                border-radius: 6px; 
                                cursor: pointer; 
                                font-weight: 600;
                                font-size: 14px;
                                display: flex;
                                align-items: center;
                                gap: 8px; /* Espacio entre icono y texto */
                            ">
                            <span>💾</span> Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 3. Insertar en el DOM
    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);

    // 4. Lógica de auto-generación de email
    const inputNombre = document.getElementById('edit_nombre');
    const inputApellido = document.getElementById('edit_apellido');

    const actualizarEmail = () => {
        const nom = inputNombre.value.trim().toLowerCase();
        const ape = inputApellido.value.trim().toLowerCase();
        const emailField = document.getElementById('edit_email');
        const DOMINIO = "@institutocajas.edu.pe";

        if (nom && ape) {
            const listaNombres = nom.split(/\s+/);
            const letraNombre = listaNombres[0].charAt(0);

            const listaApellidos = ape.split(/\s+/);
            const primerApellido = listaApellidos[0];

            let letraSegundoApellido = '';
            if (listaApellidos.length > 1) {
                letraSegundoApellido = listaApellidos[1].charAt(0);
            }
            emailField.value = `${letraNombre}${primerApellido}${letraSegundoApellido}${DOMINIO}`;
        }
    };

    inputNombre.addEventListener('input', actualizarEmail);
    inputApellido.addEventListener('input', actualizarEmail);

    // 5. Manejar Submit
    document.getElementById('formEditarUsuario').addEventListener('submit', handleGuardarEdicion);
}

/* ===========================================================
   FUNCIONES DE IMPORTACIÓN MASIVA DESDE EXCEL
   =========================================================== */

// Variable global para almacenar usuarios a importar
let usuariosParaImportar = [];

// Mostrar modal de importación
function mostrarModalImportarUsuarios() {
    const modal = document.getElementById('modalImportarUsuarios');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    // Resetear el formulario
    resetearModalImportacion();
}

// Cerrar modal de importación
function cerrarModalImportarUsuarios() {
    const modal = document.getElementById('modalImportarUsuarios');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    resetearModalImportacion();
}

// Resetear modal de importación
function resetearModalImportacion() {
    usuariosParaImportar = [];
    document.getElementById('archivoExcel').value = '';
    document.getElementById('vistaPrevia').style.display = 'none';
    document.getElementById('rolSelectionContainer').style.display = 'none';
    document.getElementById('btnConfirmarImportacion').style.display = 'none';
    document.getElementById('mensajeEstado').style.display = 'none';
    document.getElementById('tablaPrevistaUsuarios').innerHTML = '';
    document.getElementById('rolImportacion').value = '';
}

// Procesar archivo Excel
function procesarArchivoExcel(file) {
    if (!file) {
        showNotification('Por favor selecciona un archivo', 'warning');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Obtener la primera hoja
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convertir a JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Procesar datos
            procesarDatosExcel(jsonData);

        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            showNotification('Error al leer el archivo Excel. Verifica el formato.', 'error');
        }
    };

    reader.readAsArrayBuffer(file);
}

// Procesar datos del Excel
function procesarDatosExcel(datos) {
    if (!datos || datos.length === 0) {
        showNotification('El archivo está vacío', 'warning');
        return;
    }

    // Determinar si la primera fila es encabezado
    const primeraFila = datos[0];
    let inicioIndice = 0;

    // Si la primera fila contiene texto como "nombre", "apellido", etc. la consideramos encabezado
    const esEncabezado = primeraFila.some(celda =>
        typeof celda === 'string' &&
        (celda.toLowerCase().includes('nombre') ||
            celda.toLowerCase().includes('apellido'))
    );

    if (esEncabezado) {
        inicioIndice = 1; // Saltar la primera fila
    }

    usuariosParaImportar = [];

    // Procesar cada fila
    for (let i = inicioIndice; i < datos.length; i++) {
        const fila = datos[i];

        // Verificar que tenga al menos 2 columnas con datos
        if (!fila || fila.length < 2 || !fila[0] || !fila[1]) {
            continue; // Saltar filas vacías o incompletas
        }

        const nombres = String(fila[0]).trim();
        const apellidos = String(fila[1]).trim();

        if (nombres && apellidos) {
            const email = generarCorreoInstituto(nombres, apellidos);

            usuariosParaImportar.push({
                nombres: nombres,
                apellidos: apellidos,
                email: email
            });
        }
    }

    if (usuariosParaImportar.length === 0) {
        showNotification('No se encontraron usuarios válidos en el archivo', 'warning');
        return;
    }

    // Mostrar preview
    generarVistaPrevia();
}

// Generar vista previa de usuarios
function generarVistaPrevia() {
    const tbody = document.getElementById('tablaPrevistaUsuarios');
    const totalElement = document.getElementById('totalUsuariosPreview');

    tbody.innerHTML = usuariosParaImportar.map(usuario => `
        <tr>
            <td>${usuario.nombres}</td>
            <td>${usuario.apellidos}</td>
            <td><code style="background: #f0f7ff; padding: 2px 6px; border-radius: 4px;">${usuario.email}</code></td>
        </tr>
    `).join('');

    totalElement.textContent = usuariosParaImportar.length;

    // Mostrar la vista previa y opciones
    document.getElementById('vistaPrevia').style.display = 'block';
    document.getElementById('rolSelectionContainer').style.display = 'block';
    document.getElementById('btnConfirmarImportacion').style.display = 'inline-block';

    showNotification(`Se encontraron ${usuariosParaImportar.length} usuarios en el archivo`, 'success');
}

// Procesar importación masiva
function procesarImportacionMasiva() {
    const rol = document.getElementById('rolImportacion').value;

    if (!rol) {
        showNotification('Por favor selecciona un rol para los usuarios', 'warning');
        return;
    }

    if (usuariosParaImportar.length === 0) {
        showNotification('No hay usuarios para importar', 'warning');
        return;
    }

    const usuarios = StorageManager.getItem('usuarios') || [];
    const emailsExistentes = usuarios.map(u => u.email.toLowerCase());

    // Verificar duplicados
    const duplicados = [];
    const usuariosNuevos = [];

    usuariosParaImportar.forEach(usuario => {
        if (emailsExistentes.includes(usuario.email.toLowerCase())) {
            duplicados.push(usuario.email);
        } else {
            usuariosNuevos.push(usuario);
        }
    });

    // Si hay duplicados, mostrar advertencia
    if (duplicados.length > 0) {
        const mensaje = `Se encontraron ${duplicados.length} correo(s) duplicado(s):\n${duplicados.slice(0, 5).join('\n')}${duplicados.length > 5 ? '\n...' : ''}\n\nSolo se importarán los ${usuariosNuevos.length} usuarios sin duplicados.`;

        if (usuariosNuevos.length === 0) {
            showNotification('Todos los correos ya existen en el sistema', 'error');
            return;
        }

        if (!confirm(mensaje + '\n\n¿Deseas continuar?')) {
            return;
        }
    }

    // Crear usuarios nuevos
    usuariosNuevos.forEach(usuario => {
        const nuevoUsuario = {
            id: generateId(),
            nombre: usuario.nombres,
            apellido: usuario.apellidos,
            email: usuario.email,
            password: '123456', // Contraseña por defecto
            rol: rol,
            fechaCreacion: new Date().toISOString()
        };

        usuarios.push(nuevoUsuario);
    });

    // Guardar en localStorage
    StorageManager.setItem('usuarios', usuarios);

    const mensajeFinal = duplicados.length > 0
        ? `${usuariosNuevos.length} usuarios importados exitosamente (${duplicados.length} duplicados omitidos)`
        : `${usuariosNuevos.length} usuarios importados exitosamente`;

    showNotification(mensajeFinal, 'success');

    // Cerrar modal y actualizar tabla
    cerrarModalImportarUsuarios();
    cargarTablaUsuarios();
    loadAdminStats();
}

// Exportar funciones
window.mostrarModalImportarUsuarios = mostrarModalImportarUsuarios;
window.cerrarModalImportarUsuarios = cerrarModalImportarUsuarios;
window.procesarArchivoExcel = procesarArchivoExcel;
window.procesarImportacionMasiva = procesarImportacionMasiva;

/* ===========================================================
   GESTIÓN DE FECHAS DE ENTREGA
   =========================================================== */

// Función para mostrar la gestión de fechas
function mostrarGestionFechas(e) {
    if (e) e.preventDefault();

    const fechasLimite = StorageManager.getItem('fechasLimite') || getDefaultFechas();

    const modalHTML = `
        <div id="modalGestionFechas" class="modal active" style="display: flex;">
            <div class="modal-content modal-large" style="max-width: 900px;">
                <div class="modal-header">
                    <h3>📅 Gestión de Fechas L\u00edmite</h3>
                    <button class="modal-close" onclick="cerrarModalGestionFechas()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 25px;">
                    <div class="alert alert-info" style="margin-bottom: 20px;">
                        \ud83d\udcc5 <strong>Configuraci\u00f3n de plazos:</strong> Establece las fechas l\u00edmite para cada fase del proyecto de investigaci\u00f3n.
                    </div>

                    <table class="data-table" style="width: 100%;">
                        <thead>
                            <tr>
                                <th style="width: 50%;">Fase del Proyecto</th>
                                <th style="width: 30%;">Fecha L\u00edmite Actual</th>
                                <th style="width: 20%;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <strong>Paso 2:</strong> Perfil de Proyecto (PDF)<br>
                                    <small style="color: #666;">Primer entregable del proyecto</small>
                                </td>
                                <td id="fecha-paso2-display">${formatFecha(fechasLimite.paso2)}</td>
                                <td>
                                    <button class="btn-small btn-edit" onclick="EditarFechaPaso(2, '${fechasLimite.paso2}')">
                                        \u270f\ufe0f Modificar
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Paso 3:</strong> Problem\u00e1tica<br>
                                    <small style="color: #666;">Identificaci\u00f3n y formulaci\u00f3n</small>
                                </td>
                                <td id="fecha-paso3-display">${formatFecha(fechasLimite.paso3)}</td>
                                <td>
                                    <button class="btn-small btn-edit" onclick="editarFechaPaso(3, '${fechasLimite.paso3}')">
                                        \u270f\ufe0f Modificar
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Paso 4:</strong> Marco Te\u00f3rico<br>
                                    <small style="color: #666;">Antecedentes y bases te\u00f3ricas</small>
                                </td>
                                <td id="fecha-paso4-display">${formatFecha(fechasLimite.paso4)}</td>
                                <td>
                                    <button class="btn-small btn-edit" onclick="editarFechaPaso(4, '${fechasLimite.paso4}')">
                                        \u270f\ufe0f Modificar
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Paso 5:</strong> Metodolog\u00eda<br>
                                    <small style="color: #666;">Dise\u00f1o y  plan de investigaci\u00f3n</small>
                                </td>
                                <td id="fecha-paso5-display">${formatFecha(fechasLimite.paso5)}</td>
                                <td>
                                    <button class="btn-small btn-edit" onclick="editarFechaPaso(5, '${fechasLimite.paso5}')">
                                        \u270f\ufe0f Modificar
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Paso 6:</strong> Informe Final<br>
                                    <small style="color: #666;">Documento completo del proyecto</small>
                                </td>
                                <td id="fecha-paso6-display">${formatFecha(fechasLimite.paso6)}</td>
                                <td>
                                    <button class="btn-small btn-edit" onclick="editarFechaPaso(6, '${fechasLimite.paso6}')">
                                        \u270f\ufe0f Modificar
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Paso 7:</strong> Art\u00edculo Cient\u00edfico<br>
                                    <small style="color: #666;">Publicaci\u00f3n acad\u00e9mica del proyecto</small>
                                </td>
                                <td id="fecha-paso7-display">${formatFecha(fechasLimite.paso7)}</td>
                                <td>
                                    <button class="btn-small btn-edit" onclick="editarFechaPaso(7, '${fechasLimite.paso7}')">
                                        \u270f\ufe0f Modificar
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-left: 4px solid #667eea; border-radius: 4px;">
                        <p style="margin: 0; font-size: 0.9em;">
                            \ud83d\udca1 <strong>Nota:</strong> Las fechas establecidas son orientativas. Los investigadores recibir\u00e1n notificaciones cuando se acerquen los plazos.
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="cerrarModalGestionFechas()">Cerrar</button>
                    <button class="btn-primary" onclick="restablecerFechasPorDefecto()" style="background: #FF9800;">
                        \ud83d\udd04 Restablecer Fechas Por Defecto
                    </button>
                </div>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
}

function cerrarModalGestionFechas() {
    const modal = document.getElementById('modalGestionFechas');
    if (modal) modal.remove();
}

function getDefaultFechas() {
    const hoy = new Date();
    return {
        paso2: formatDateForInput(new Date(hoy.getFullYear(), 2, 15)), // 15 de marzo
        paso3: formatDateForInput(new Date(hoy.getFullYear(), 4, 15)), // 15 de mayo
        paso4: formatDateForInput(new Date(hoy.getFullYear(), 6, 15)), // 15 de julio
        paso5: formatDateForInput(new Date(hoy.getFullYear(), 8, 15)), // 15 de septiembre
        paso6: formatDateForInput(new Date(hoy.getFullYear(), 10, 15)), // 15 de noviembre
        paso7: formatDateForInput(new Date(hoy.getFullYear(), 11, 31)) // 31 de diciembre
    };
}

function formatFecha(fechaISO) {
    if (!fechaISO) return 'No establecida';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function editarFechaPaso(paso, fechaActual) {
    const nuevaFecha = prompt(`Ingrese la nueva fecha l\u00edmite para el Paso ${paso}:\\n(Formato: AAAA-MM-DD)\\n\\nFecha actual: ${formatFecha(fechaActual)}`, fechaActual);

    if (nuevaFecha === null) return; // Usuario cancel\u00f3

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(nuevaFecha)) {
        showNotification('\u26a0\ufe0f Formato de fecha inv\u00e1lido. Use AAAA-MM-DD', 'error');
        return;
    }

    const fechaObj = new Date(nuevaFecha);
    if (isNaN(fechaObj.getTime())) {
        showNotification('\u26a0\ufe0f Fecha inv\u00e1lida', 'error');
        return;
    }

    // Guardar la nueva fecha
    const fechasLimite = StorageManager.getItem('fechasLimite') || getDefaultFechas();
    fechasLimite[`paso${paso}`] = nuevaFecha;
    StorageManager.setItem('fechasLimite', fechasLimite);

    // Actualizar la visualizaci\u00f3n
    document.getElementById(`fecha-paso${paso}-display`).textContent = formatFecha(nuevaFecha);

    showNotification(`\u2705 Fecha del Paso ${paso} actualizada exitosamente`, 'success');
}

function restablecerFechasPorDefecto() {
    if (!confirm('\u00bfEst\u00e1 seguro de restablecer todas las fechas a los valores por defecto?')) {
        return;
    }

    const fechasDefault = getDefaultFechas();
    StorageManager.setItem('fechasLimite', fechasDefault);

    showNotification('\u2705 Fechas restablecidas a valores por defecto', 'success');

    // Cerrar y reabrir modal para actualizar
    cerrarModalGestionFechas();
    setTimeout(() => mostrarGestionFechas(null), 100);
}

// Exportar funciones
window.mostrarGestionFechas = mostrarGestionFechas;
window.cerrarModalGestionFechas = cerrarModalGestionFechas;
window.editarFechaPaso = editarFechaPaso;
window.restablecerFechasPorDefecto = restablecerFechasPorDefecto;
