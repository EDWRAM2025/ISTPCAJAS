/* ====================================
   INVESTIGADOR.JS - MÃ³dulo Investigador
   ==================================== */

// Variables globales
let currentCategory = null;

// InicializaciÃ³n
document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.includes('dashboard-investigador')) {
        checkRole(['investigador']);
        updateUserInfo();
        loadDashboardStats();
        loadCategoryCounts();
    }

    if (window.location.pathname.includes('categoria-proyectos')) {
        checkRole(['investigador', 'evaluador']);
        loadCategoryFromURL();
    }

    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    const formNuevoProyecto = document.getElementById('formNuevoProyecto');
    if (formNuevoProyecto) {
        formNuevoProyecto.addEventListener('submit', handleNuevoProyecto);

        // Validar fechas
        const fechaInicio = document.getElementById('fechaInicio');
        const fechaFin = document.getElementById('fechaFinalizacion');

        if (fechaInicio && fechaFin) {
            fechaInicio.addEventListener('change', function () {
                fechaFin.min = this.value;
            });
        }
    }

    const formEditarProyecto = document.getElementById('formEditarProyecto');
    if (formEditarProyecto) {
        formEditarProyecto.addEventListener('submit', handleEditarProyecto);
    }
}

// Cargar estadÃ­sticas del dashboard
function loadDashboardStats() {
    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];

    const misProyectos = proyectos.filter(p => p.investigadorId === user.id);

    const total = misProyectos.length;
    const pendientes = misProyectos.filter(p => p.estado === 'pendiente').length;
    const aprobados = misProyectos.filter(p => p.estado === 'aprobado').length;
    const rechazados = misProyectos.filter(p => p.estado === 'rechazado').length;

    updateElementText('totalProyectos', total);
    updateElementText('proyectosPendientes', pendientes);
    updateElementText('proyectosAprobados', aprobados);
    updateElementText('proyectosRechazados', rechazados);
}

// Cargar contadores por categorÃ­a
// Cargar contadores por categorÃ­a
function loadCategoryCounts() {
    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];

    const misProyectos = proyectos.filter(p => p.investigadorId === user.id);

    const countInvestigacion = misProyectos.filter(p => p.categoria === 'investigacion-aplicada').length;
    const countInnovacion = misProyectos.filter(p => p.categoria === 'innovacion-tecnologica').length;
    const countPedagogica = misProyectos.filter(p => p.categoria === 'innovacion-pedagogica').length;

    updateElementText('count-investigacion-aplicada', countInvestigacion);
    updateElementText('count-innovacion-tecnologica', countInnovacion);
    updateElementText('count-innovacion-pedagogica', countPedagogica);
}

// Abrir categorÃ­a
function abrirCategoria(categoria) {
    window.location.href = `categoria-proyectos.html?categoria=${categoria}`;
}

// Cargar categorÃ­a desde URL
function loadCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    currentCategory = params.get('categoria');

    if (!currentCategory) {
        showNotification('CategorÃ­a no especificada', 'error');
        setTimeout(() => volverDashboard(), 2000);
        return;
    }

    const titulo = document.getElementById('categoriaTitulo');
    if (titulo) {
        titulo.textContent = getCategoryName(currentCategory);
    }

    const user = getCurrentUser();
    const btnNuevoProyecto = document.getElementById('btnNuevoProyecto');
    const btnEmptyStateCrear = document.getElementById('btnEmptyStateCrear');
    const emptyStateTitle = document.getElementById('emptyStateTitle');
    const emptyStateMessage = document.getElementById('emptyStateMessage');
    const sidebarText = document.getElementById('sidebarProyectosText');

    if (user.rol === 'investigador') {
        if (btnNuevoProyecto) btnNuevoProyecto.style.display = 'block';
        if (btnEmptyStateCrear) btnEmptyStateCrear.style.display = 'block';
        if (sidebarText) sidebarText.textContent = 'Mis Proyectos';
    } else if (user.rol === 'evaluador') {
        if (btnNuevoProyecto) btnNuevoProyecto.style.display = 'none';
        if (btnEmptyStateCrear) btnEmptyStateCrear.style.display = 'none';
        if (emptyStateTitle) emptyStateTitle.textContent = 'No hay proyectos para evaluar';
        if (emptyStateMessage) emptyStateMessage.textContent = 'No hay proyectos pendientes en esta categorÃ­a';
        if (sidebarText) sidebarText.textContent = 'Proyectos';
    }

    cargarProyectosCategoria();
}

// Cargar proyectos de la categorÃ­a
function cargarProyectosCategoria() {
    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];

    let proyectosFiltrados;

    if (user.rol === 'investigador') {
        proyectosFiltrados = proyectos.filter(p =>
            p.categoria === currentCategory &&
            p.investigadorId === user.id
        );
    } else if (user.rol === 'evaluador') {
        proyectosFiltrados = proyectos.filter(p =>
            p.categoria === currentCategory
        );
    }

    const grid = document.getElementById('proyectosGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    if (proyectosFiltrados.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.classList.add('active');
    } else {
        grid.style.display = 'grid';
        if (emptyState) emptyState.classList.remove('active');

        grid.innerHTML = proyectosFiltrados.map(proyecto =>
            createProyectoCard(proyecto)
        ).join('');
    }
}


// Crear tarjeta de proyecto
function createProyectoCard(proyecto) {
    const user = getCurrentUser();
    const isInvestigador = user.rol === 'investigador';
    const isEvaluador = user.rol === 'evaluador';
    const puedeEditarPaso1 = proyecto.estado === 'rechazado' && proyecto.paso === 1 && isInvestigador;
    const puedeSubirPaso2 = proyecto.estado === 'aprobado' && proyecto.paso === 1 && isInvestigador;
    const puedeEditarPaso2 = proyecto.estadoPaso2 === 'rechazado' && proyecto.paso === 2 && isInvestigador;
    const tienePDF = proyecto.paso >= 2 && proyecto.paso2 && proyecto.paso2.archivoPDF;

    let actions = '';
    let statusSection = '';

    if (isInvestigador) {
        // --- SECCIÃ“N DE ESTADOS (SOLO MUESTRA EL PASO ACTUAL) ---

        // PASO 1 - No se muestra estado porque los datos no son evaluados
        if (proyecto.paso === 1) {
            statusSection = '';
        }
        // PASO 2
        else if (proyecto.paso === 2) {
            const st = proyecto.estadoPaso2 || 'pendiente';
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">ðŸ“ Fase 2: Perfil</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                </div>`;
        }
        // PASO 3
        else if (proyecto.paso === 3) {
            const st = proyecto.estadoPaso3 || 'pendiente';
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">ðŸ“ Fase 3: ProblemÃ¡tica</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                </div>`;
        }
        // PASO 4
        else if (proyecto.paso === 4) {
            const st = proyecto.estadoPaso4 || 'pendiente';
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">ðŸ“ Fase 4: Marco TeÃ³rico</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                </div>`;
        }
        // PASO 5
        else if (proyecto.paso === 5) {
            const st = proyecto.estadoPaso5 || 'pendiente';
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">ðŸ“ Fase 5: MetodologÃ­a</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                </div>`;
        }
        // PASO 6 (NUEVO - INFORME FINAL)
        else if (proyecto.paso === 6) {
            const st = proyecto.estadoPaso6 || 'pendiente';
            const tienePDF6 = proyecto.paso6 && proyecto.paso6.archivoPDF;
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">ðŸ“ Fase 6: Informe Final</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                    ${tienePDF6 ? '<div style="margin-top:5px; font-size:0.9em; color:#1976D2;">ðŸ“Ž Informe Final PDF cargado</div>' : ''}
                    ${st === 'aprobado' ? '<div style="margin-top:10px; padding:8px; background:#E8F5E9; color:#2E7D32; border-radius:4px; font-weight:bold; text-align:center;">ðŸ† Â¡PROYECTO DE INVESTIGACIÃ“N FINALIZADO!</div>' : ''}
                </div>`;
        }

        // --- BOTONES DE ACCIÃ“N ---
        actions = '<div class="proyecto-actions">';
        actions += `<button class="btn-small btn-view" onclick="verReporte('${proyecto.id}')">ðŸ“„ Reporte</button>`;

        // Si hay PDF del Paso 2 o del Paso 6, mostrar botÃ³n de ver PDF
        const pdfToShow = (proyecto.paso === 6 && proyecto.paso6) ? '6' : (tienePDF ? '2' : null);
        if (pdfToShow) {
            actions += `<button class="btn-small" onclick="visualizarPDF('${proyecto.id}', '${pdfToShow}')" style="background: #607D8B; color: white;">ðŸ“Ž Ver PDF</button>`;
        }

        // LÃ“GICA DE BOTONES POR PASO
        if (proyecto.paso === 1) {
            // BotÃ³n Primer Avance siempre visible en paso 1
            actions += `<button class="btn-small btn-primary" onclick="subirSegundoEntregable('${proyecto.id}')" style="background: #4CAF50;">ðŸ“¤ Primer Avance</button>`;
        }
        else if (proyecto.paso === 2) {
            if (proyecto.estadoPaso2 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarSegundoEntregable('${proyecto.id}')">âœï¸ Corregir Paso 2</button>`;
            else if (proyecto.estadoPaso2 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirTercerEntregable('${proyecto.id}')" style="background: #673AB7;">ðŸ“ Iniciar Paso 3</button>`;
        }
        else if (proyecto.paso === 3) {
            if (proyecto.estadoPaso3 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarTercerEntregable('${proyecto.id}')">âœï¸ Corregir Paso 3</button>`;
            else if (proyecto.estadoPaso3 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirCuartoEntregable('${proyecto.id}')" style="background: #FF9800;">ðŸ“š Iniciar Paso 4</button>`;
        }
        else if (proyecto.paso === 4) {
            if (proyecto.estadoPaso4 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarCuartoEntregable('${proyecto.id}')">âœï¸ Corregir Paso 4</button>`;
            else if (proyecto.estadoPaso4 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirQuintoEntregable('${proyecto.id}')" style="background: #00BCD4;">ðŸ”¬ Iniciar Paso 5</button>`;
        }
        else if (proyecto.paso === 5) {
            if (proyecto.estadoPaso5 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarQuintoEntregable('${proyecto.id}')">âœï¸ Corregir Paso 5</button>`;
            else if (proyecto.estadoPaso5 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirSextoEntregable('${proyecto.id}')" style="background: #9C27B0;">ðŸŽ“ Subir Informe Final</button>`;
        }
        // NUEVO BOTÃ“N PASO 6
        else if (proyecto.paso === 6) {
            if (proyecto.estadoPaso6 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarSextoEntregable('${proyecto.id}')">âœï¸ Corregir Informe</button>`;
        }

        actions += '</div>';
    }

    // Vista Evaluador (Actualizada con el botÃ³n Paso 3)
    if (isEvaluador) {
        actions = '<div class="proyecto-actions">';

        // BotÃ³n Reporte
        actions += `<button class="btn-small btn-view" onclick="verReporte('${proyecto.id}')">ðŸ“„ Reporte</button>`;

        // BotÃ³n PDF
        if (tienePDF) {
            actions += `<button class="btn-small" onclick="visualizarPDF('${proyecto.id}')" style="background: #607D8B; color: white;">ðŸ“Ž PDF</button>`;
        }

        // --- LÃ“GICA PARA MOSTRAR EL BOTÃ“N DE EVALUAR CORRECTO ---
        let btnEvaluar = '';

        // Verificamos en orden inverso (3 -> 2 -> 1)
        if (proyecto.paso === 6 && proyecto.estadoPaso6 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #9C27B0; color: white;">âœ“ Evaluar Informe Final</button>`;
        }
        else if (proyecto.paso === 5 && proyecto.estadoPaso5 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #00BCD4; color: white;">âœ“ Evaluar Paso 5</button>`;
        }
        else if (proyecto.paso === 4 && proyecto.estadoPaso4 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #FF5722; color: white;">âœ“ Evaluar Paso 4</button>`;
        }
        else if (proyecto.paso === 3 && proyecto.estadoPaso3 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #E91E63; color: white;">âœ“ Evaluar Paso 3</button>`;
        }
        else if (proyecto.paso === 2 && proyecto.estadoPaso2 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #2196F3; color: white;">âœ“ Evaluar Paso 2</button>`;
        }
        else if (proyecto.estado === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')">âœ“ Evaluar Paso 1</button>`;
        }

        actions += '</div>';
    }

    return `
        <div class="proyecto-card" style="border-left-color: ${getStatusColor(proyecto.estadoPaso2 === 'aprobado' ? 'aprobado' : proyecto.estado)}">
            <div class="proyecto-header">
                <div style="flex: 1;">
                    <h3 class="proyecto-title">${proyecto.titulo}</h3>
                </div>
            </div>
            ${statusSection}
            <div class="proyecto-meta">
                <div><strong>ðŸ“… Creado:</strong> ${formatDateShort(proyecto.fechaCreacion)}</div>
                <div><strong>ðŸ”¬ Tipo:</strong> ${proyecto.tipoInvestigacion === 'aplicada' ? 'Aplicada' : 'InnovaciÃ³n'}</div>
                <div><strong>ðŸ“š LÃ­nea:</strong> ${formatLineaInvestigacion(proyecto.lineaInvestigacion)}</div>
                ${isEvaluador ? `<div><strong>ðŸ‘¤ Investigador:</strong> ${proyecto.investigadorNombre}</div>` : ''}
                ${proyecto.evaluadorNombre ? `<div><strong>âœ“ Evaluado por:</strong> ${proyecto.evaluadorNombre}</div>` : ''}
                ${proyecto.puntuacion !== undefined ? `<div><strong>ðŸ“Š PuntuaciÃ³n Paso 1:</strong> ${proyecto.puntuacion}/100</div>` : ''}
                ${proyecto.puntuacionPaso2 !== undefined ? `<div><strong>ðŸ“Š PuntuaciÃ³n Paso 2:</strong> ${proyecto.puntuacionPaso2}/100</div>` : ''}
            </div>
            <div class="proyecto-description">
                <strong>Objetivo:</strong> ${proyecto.objetivoProyecto}
            </div>
            ${proyecto.comentarios ? `
                <div class="alert alert-info" style="margin-top: 15px; font-size: 0.85em;">
                    <strong>ðŸ’¬ Comentarios Paso 1:</strong><br>
                    ${proyecto.comentarios}
                </div>
            ` : ''}
            ${proyecto.comentariosPaso2 ? `
                <div class="alert alert-info" style="margin-top: 15px; font-size: 0.85em;">
                    <strong>ðŸ’¬ Comentarios Paso 2:</strong><br>
                    ${proyecto.comentariosPaso2}
                </div>
            ` : ''}
            <div class="proyecto-footer">
                ${actions}
            </div>
        </div>
    `;
}

// Formatear lÃ­nea de investigaciÃ³n
function formatLineaInvestigacion(linea) {
    const nombres = {
        'ingenieria-sistemas': 'IngenierÃ­a de Sistemas',
        'ingenieria-industrial': 'IngenierÃ­a Industrial',
        'administracion': 'AdministraciÃ³n de Empresas',
        'contabilidad': 'Contabilidad',
        'derecho': 'Derecho',
        'medicina': 'Medicina',
        'enfermeria': 'EnfermerÃ­a',
        'arquitectura': 'Arquitectura',
        'educacion': 'EducaciÃ³n',
        'psicologia': 'PsicologÃ­a'
    };
    return nombres[linea] || linea;
}

// Generar reporte automÃ¡tico
function generarReporte(proyecto) {
    const fechaGeneracion = new Date().toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const integrantes = proyecto.integrantes.split(',').map(i => i.trim());

    return `
        <div class="reporte-header" style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px;">
            <h2 style="color: #667eea; margin-bottom: 10px;">INSTITUTO DE INVESTIGACIÃ“N</h2>
            <h3 style="color: #2d3748; margin-bottom: 5px;">REPORTE DE CONSTANCIA</h3>
            <h4 style="color: #718096;">Informe General de Proyecto</h4>
            <p style="color: #a0aec0; font-size: 0.9em; margin-top: 10px;">Generado el: ${fechaGeneracion}</p>
        </div>

        <div class="reporte-body" style="line-height: 1.8; color: #2d3748;">
            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    ðŸ“‹ INFORMACIÃ“N GENERAL
                </h4>
                <p><strong>TÃ­tulo del Proyecto:</strong><br>${proyecto.titulo}</p>
                <p><strong>CategorÃ­a:</strong> ${getCategoryName(proyecto.categoria)}</p>
                <p><strong>Tipo de InvestigaciÃ³n:</strong> ${proyecto.tipoInvestigacion === 'aplicada' ? 'Aplicada' : 'InnovaciÃ³n'}</p>
                <p><strong>LÃ­nea de InvestigaciÃ³n:</strong> ${formatLineaInvestigacion(proyecto.lineaInvestigacion)}</p>
            </div>

            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    ðŸ‘¥ INTEGRANTES DEL PROYECTO
                </h4>
                <ul style="list-style: none; padding-left: 0;">
                    ${integrantes.map((integrante, index) =>
        `<li style="padding: 5px 0;">â€¢ ${integrante}</li>`
    ).join('')}
                </ul>
            </div>

            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    ðŸŽ¯ OBJETIVO DEL PROYECTO
                </h4>
                <p style="text-align: justify;">${proyecto.objetivoProyecto}</p>
            </div>

            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    ðŸ“ DATOS ADICIONALES
                </h4>
                <p><strong>Beneficiarios:</strong> ${proyecto.beneficiarios}</p>
                <p><strong>LocalizaciÃ³n:</strong> ${proyecto.localizacion}</p>
                <p><strong>Fecha de Inicio:</strong> ${formatDate(proyecto.fechaInicio)}</p>
                <p><strong>Fecha de FinalizaciÃ³n:</strong> ${formatDate(proyecto.fechaFinalizacion)}</p>
            </div>

            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    ðŸ‘¨â€ðŸ”¬ RESPONSABLE
                </h4>
                <p><strong>Investigador Principal:</strong> ${proyecto.investigadorNombre}</p>
                <p><strong>Fecha de PresentaciÃ³n:</strong> ${formatDate(proyecto.fechaCreacion)}</p>
            </div>

            ${proyecto.estado !== 'pendiente' ? `
                <div class="reporte-section" style="margin-bottom: 25px; background: ${proyecto.estado === 'aprobado' ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 8px;">
                    <h4 style="color: ${proyecto.estado === 'aprobado' ? '#2e7d32' : '#c62828'}; margin-bottom: 10px;">
                        ðŸ“Š EVALUACIÃ“N
                    </h4>
                    <p><strong>Estado:</strong> ${proyecto.estado === 'aprobado' ? 'âœ“ APROBADO' : 'âœ— RECHAZADO'}</p>
                    <p><strong>PuntuaciÃ³n:</strong> ${proyecto.puntuacion}/100</p>
                    <p><strong>Evaluador:</strong> ${proyecto.evaluadorNombre}</p>
                    <p><strong>Fecha de EvaluaciÃ³n:</strong> ${formatDate(proyecto.fechaEvaluacion)}</p>
                    ${proyecto.comentarios ? `<p><strong>Comentarios:</strong><br>${proyecto.comentarios}</p>` : ''}
                </div>
            ` : ''}
        </div>

        <div class="reporte-footer" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.9em;">
            <p>Este documento ha sido generado automÃ¡ticamente por el Sistema de GestiÃ³n de Proyectos</p>
            <p>Instituto de InvestigaciÃ³n Â© ${new Date().getFullYear()}</p>
        </div>
    `;
}

// Ver reporte
function verReporte(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto) {
        showNotification('Proyecto no encontrado', 'error');
        return;
    }

    const reporteContent = document.getElementById('reporteContent');
    if (reporteContent) {
        reporteContent.innerHTML = generarReporte(proyecto);
    }

    const modal = document.getElementById('modalVerReporte');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

// Cerrar modal reporte
function cerrarModalReporte() {
    const modal = document.getElementById('modalVerReporte');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// Imprimir reporte
function imprimirReporte() {
    const reporteContent = document.getElementById('reporteContent').innerHTML;

    const ventanaImpresion = window.open('', '', 'width=800,height=600');
    ventanaImpresion.document.write(`
        <html>
        <head>
            <title>Reporte de Constancia</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 40px;
                    color: #2d3748;
                }
                h2, h3, h4 { color: #667eea; }
                p { margin: 10px 0; line-height: 1.6; }
                .reporte-section { margin-bottom: 25px; page-break-inside: avoid; }
            </style>
        </head>
        <body>
            ${reporteContent}
        </body>
        </html>
    `);

    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 250);
}

// Mostrar modal nuevo proyecto
function mostrarModalNuevoProyecto() {
    const user = getCurrentUser();

    if (user.rol !== 'investigador') {
        showNotification('No tienes permisos para crear proyectos', 'error');
        return;
    }

    const modal = document.getElementById('modalNuevoProyecto');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

// Cerrar modal nuevo proyecto
function cerrarModalNuevoProyecto() {
    const modal = document.getElementById('modalNuevoProyecto');
    const form = document.getElementById('formNuevoProyecto');

    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    if (form) {
        form.reset();
    }
}

// Manejar creaciÃ³n de nuevo proyecto
function handleNuevoProyecto(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];

    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFinalizacion').value;

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
        showNotification('La fecha de finalizaciÃ³n debe ser posterior a la fecha de inicio', 'warning');
        return;
    }

    const nuevoProyecto = {
        id: generateId(),
        titulo: document.getElementById('tituloProyecto').value.trim(),
        tipoInvestigacion: document.getElementById('tipoInvestigacion').value,
        lineaInvestigacion: document.getElementById('lineaInvestigacion').value,
        integrantes: document.getElementById('integrantes').value.trim(),
        objetivoProyecto: document.getElementById('objetivoProyecto').value.trim(),
        beneficiarios: document.getElementById('beneficiarios').value.trim(),
        localizacion: document.getElementById('localizacion').value.trim(),
        fechaInicio: fechaInicio,
        fechaFinalizacion: fechaFin,
        categoria: currentCategory,
        investigadorId: user.id,
        investigadorNombre: `${user.nombre} ${user.apellido}`,
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString(),
        paso: 1
    };

    proyectos.push(nuevoProyecto);
    StorageManager.setItem('proyectos', proyectos);

    showNotification('âœ“ Proyecto creado y reporte generado exitosamente', 'success');
    cerrarModalNuevoProyecto();
    cargarProyectosCategoria();

    // Mostrar el reporte generado
    setTimeout(() => {
        verReporte(nuevoProyecto.id);
    }, 500);
}

// Editar proyecto
function editarProyecto(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto) {
        showNotification('Proyecto no encontrado', 'error');
        return;
    }

    document.getElementById('editProyectoId').value = proyecto.id;
    document.getElementById('editTituloProyecto').value = proyecto.titulo;
    document.getElementById('editTipoInvestigacion').value = proyecto.tipoInvestigacion;
    document.getElementById('editLineaInvestigacion').value = proyecto.lineaInvestigacion;
    document.getElementById('editIntegrantes').value = proyecto.integrantes;
    document.getElementById('editObjetivoProyecto').value = proyecto.objetivoProyecto;
    document.getElementById('editBeneficiarios').value = proyecto.beneficiarios;
    document.getElementById('editLocalizacion').value = proyecto.localizacion;
    document.getElementById('editFechaInicio').value = proyecto.fechaInicio;
    document.getElementById('editFechaFinalizacion').value = proyecto.fechaFinalizacion;

    if (proyecto.fechaLimiteCorreccion) {
        document.getElementById('editFechaLimite').textContent = formatDate(proyecto.fechaLimiteCorreccion);
    }

    const modal = document.getElementById('modalEditarProyecto');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

// Cerrar modal editar proyecto
function cerrarModalEditarProyecto() {
    const modal = document.getElementById('modalEditarProyecto');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// Manejar ediciÃ³n de proyecto
function handleEditarProyecto(e) {
    e.preventDefault();

    const proyectoId = document.getElementById('editProyectoId').value;
    const proyectos = StorageManager.getItem('proyectos') || [];

    const index = proyectos.findIndex(p => p.id === proyectoId);

    if (index !== -1) {
        proyectos[index].titulo = document.getElementById('editTituloProyecto').value.trim();
        proyectos[index].tipoInvestigacion = document.getElementById('editTipoInvestigacion').value;
        proyectos[index].lineaInvestigacion = document.getElementById('editLineaInvestigacion').value;
        proyectos[index].integrantes = document.getElementById('editIntegrantes').value.trim();
        proyectos[index].objetivoProyecto = document.getElementById('editObjetivoProyecto').value.trim();
        proyectos[index].beneficiarios = document.getElementById('editBeneficiarios').value.trim();
        proyectos[index].localizacion = document.getElementById('editLocalizacion').value.trim();
        proyectos[index].fechaInicio = document.getElementById('editFechaInicio').value;
        proyectos[index].fechaFinalizacion = document.getElementById('editFechaFinalizacion').value;
        proyectos[index].estado = 'pendiente';
        proyectos[index].fechaEdicion = new Date().toISOString();

        delete proyectos[index].comentarios;
        delete proyectos[index].puntuacion;
        delete proyectos[index].evaluadorNombre;

        StorageManager.setItem('proyectos', proyectos);

        showNotification('âœ“ Proyecto actualizado y reporte regenerado', 'success');
        cerrarModalEditarProyecto();
        cargarProyectosCategoria();
    }
}

// Ver mis proyectos
function verMisProyectos(e) {
    if (e) e.preventDefault();

    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];
    const misProyectos = proyectos.filter(p => p.investigadorId === user.id);

    let modalHTML = `
        <div id="modalMisProyectos" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Mis Proyectos</h3>
                    <button class="modal-close" onclick="cerrarModalMisProyectos()">&times;</button>
                </div>
                <div class="modal-body">
                    ${misProyectos.length === 0 ?
            '<p style="text-align: center; padding: 40px; color: #718096;">No tienes proyectos aÃºn</p>' :
            `<div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>TÃ­tulo</th>
                                        <th>CategorÃ­a</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Fecha</th>
                                        <th>PuntuaciÃ³n</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${misProyectos.map(p => `
                                        <tr>
                                            <td>${p.titulo}</td>
                                            <td>${getCategoryName(p.categoria)}</td>
                                            <td>${p.tipoInvestigacion === 'aplicada' ? 'Aplicada' : 'InnovaciÃ³n'}</td>
                                            <td>${getStatusBadge(p.estado)}</td>
                                            <td>${formatDateShort(p.fechaCreacion)}</td>
                                            <td>${p.puntuacion !== undefined ? p.puntuacion + '/100' : '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>`
        }
                </div>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
}

// Cerrar modal mis proyectos
function cerrarModalMisProyectos() {
    const modal = document.getElementById('modalMisProyectos');
    if (modal) {
        modal.remove();
    }
}

// Volver al dashboard
function volverDashboard() {
    const user = getCurrentUser();
    if (user.rol === 'investigador') {
        window.location.href = 'dashboard-investigador.html';
    } else if (user.rol === 'evaluador') {
        window.location.href = 'dashboard-evaluador.html';
    }
}

// FunciÃ³n auxiliar
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Exportar funciones
window.abrirCategoria = abrirCategoria;
window.mostrarModalNuevoProyecto = mostrarModalNuevoProyecto;
window.cerrarModalNuevoProyecto = cerrarModalNuevoProyecto;
window.editarProyecto = editarProyecto;
window.cerrarModalEditarProyecto = cerrarModalEditarProyecto;
window.verMisProyectos = verMisProyectos;
window.cerrarModalMisProyectos = cerrarModalMisProyectos;
window.volverDashboard = volverDashboard;
window.cargarProyectosCategoria = cargarProyectosCategoria;
window.verReporte = verReporte;
window.cerrarModalReporte = cerrarModalReporte;
window.imprimirReporte = imprimirReporte;



// Subir segundo entregable
function subirSegundoEntregable(proyectoId) {
    // Limpiar modal previo
    const existente = document.getElementById('modalSegundoEntregable');
    if (existente) existente.remove();

    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto) {
        showNotification('Proyecto no encontrado', 'error');
        return;
    }

    // Datos pre-cargados (si existen de una ediciÃ³n anterior o del paso 1)
    const data = proyecto.paso2 || {};

    // HTML EstÃ¡ndar para todas las categorÃ­as
    const modalHTML = `
        <div id="modalSegundoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>ðŸ“„ Paso 2: Perfil de Proyecto</h3>
                    <button type="button" class="modal-close" onclick="cerrarModalSegundoEntregable()">&times;</button>
                </div>
                <form id="formSegundoEntregable" class="modal-body">
                    <input type="hidden" id="paso2ProyectoId" value="${proyecto.id}">
                    
                    <div class="alert alert-info">
                        â„¹ï¸ Complete los datos del perfil.
                    </div>

                    <div class="form-group">
                        <label><strong>1.1. TÃ­tulo del Proyecto</strong></label>
                        <input type="text" value="${proyecto.titulo}" readonly style="background:#eee; color:#555;">
                    </div>

                    <div class="form-group">
                        <label><strong>1.2. Investigador(es)</strong></label>
                        <textarea id="p2_inv" class="form-control" rows="1" required>${data.investigadores || proyecto.integrantes}</textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>1.3. Programa de Estudios</strong></label>
                        <input type="text" id="p2_prog" class="form-control" required value="${data.programa || formatLineaInvestigacion(proyecto.lineaInvestigacion)}">
                    </div>

                    <div class="form-group">
                        <label><strong>1.4. LÃ­nea de InvestigaciÃ³n</strong></label>
                        <input type="text" id="p2_linea" class="form-control" required value="${data.lineaInvestigacion || formatLineaInvestigacion(proyecto.lineaInvestigacion)}">
                    </div>

                    <div class="form-group">
                        <label><strong>1.5. Beneficiarios</strong></label>
                        <textarea id="p2_ben" class="form-control" rows="1" required>${data.beneficiarios || proyecto.beneficiarios}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>1.6. Costo</strong></label>
                            <input type="text" id="p2_costo" class="form-control" required placeholder="S/. 0.00" value="${data.costo || ''}">
                        </div>
                        <div class="form-group">
                            <label><strong>1.7. Lugar</strong></label>
                            <input type="text" id="p2_lugar" class="form-control" required value="${data.lugar || proyecto.localizacion}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label><strong>1.8. Fuente de Financiamiento</strong></label>
                        <input type="text" id="p2_fin" class="form-control" required placeholder="Ej: Autofinanciado" value="${data.financiamiento || ''}">
                    </div>

                    <!-- SECCIÃ“N PDF -->
                    <div class="form-group" style="margin-top: 20px; border: 2px dashed #ccc; padding: 20px; background: #fafafa; text-align: center;">
                        <label style="display:block; margin-bottom:10px; font-weight:bold; color:#d32f2f;">
                            Adjuntar Perfil (PDF) *
                        </label>
                        <input type="file" id="paso2PDF" accept=".pdf" required style="margin:auto;">
                        <small style="display:block; margin-top:5px; color:#666;">MÃ¡ximo 2MB</small>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="cerrarModalSegundoEntregable()">Cancelar</button>
                        <button type="submit" class="btn-primary">ðŸ“¤ Enviar Paso 2</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);

    document.getElementById('formSegundoEntregable').addEventListener('submit', handleSegundoEntregable);
}

// Crear modal segundo entregable segÃºn categorÃ­a

// Crear modal segundo entregable segÃºn categorÃ­a
function crearModalSegundoEntregable(proyecto) {
    // Solo mostrar tÃ­tulo (readonly) y campo de PDF
    const camposHTML = `
        <div class="form-group">
            <label for="paso2Titulo">TÃ­tulo del Proyecto</label>
            <input type="text" id="paso2Titulo" value="${proyecto.titulo}" readonly style="background: #f7fafc; cursor: not-allowed;">
            <small style="color: #718096;">ðŸ“‹ Este campo se toma automÃ¡ticamente del sistema</small>
        </div>

        <div class="form-group" style="margin-top: 25px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
            <label for="paso2PDF">
                <span style="color: #f44336;">*</span> Adjuntar Perfil (PDF)
            </label>
            <input type="file" id="paso2PDF" accept=".pdf" required>
            <small style="display: block; margin-top: 8px; color: #718096;">
                ðŸ“„ Suba el documento completo del perfil en formato PDF (MÃ¡ximo 2MB)
            </small>
            <small style="display: block; color: #667eea;">
                â„¹ï¸ Debe seguir el formato APA 7ma ediciÃ³n segÃºn la estructura de su categorÃ­a
            </small>
        </div>
    `;

    return `
        <div id="modalSegundoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>ðŸ“„ Paso 2: Perfil de Proyecto</h3>
                    <button class="modal-close" onclick="cerrarModalSegundoEntregable()">&times;</button>
                </div>
                <form id="formSegundoEntregable" class="modal-body">
                    <input type="hidden" id="paso2ProyectoId" value="${proyecto.id}">
                    
                    <div class="alert alert-info" style="margin-bottom: 20px;">
                        <strong>â„¹ï¸ Complete los datos del perfil:</strong> Llene el formulario y adjunte el documento PDF correspondiente.
                    </div>

                    ${camposHTML}

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="cerrarModalSegundoEntregable()">Cancelar</button>
                        <button type="submit" class="btn-primary">ðŸ“¤ Enviar Paso 2</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// Cerrar modal segundo entregable
function cerrarModalSegundoEntregable() {
    const modal = document.getElementById('modalSegundoEntregable');
    if (modal) modal.remove();
}


// Manejar envÃ­o segundo entregable
function handleSegundoEntregable(e) {
    e.preventDefault();

    const proyectoId = document.getElementById('paso2ProyectoId').value;
    const archivoInput = document.getElementById('paso2PDF');
    const archivo = archivoInput.files[0];

    if (!archivo) {
        showNotification('âš ï¸ Debe adjuntar el documento PDF', 'warning');
        return;
    }

    // Validar que sea PDF
    if (archivo.type !== 'application/pdf') {
        showNotification('âš ï¸ Solo se permiten archivos PDF', 'warning');
        return;
    }

    // Validar tamaÃ±o (2MB) para evitar error de LocalStorage
    if (archivo.size > 2 * 1024 * 1024) {
        showNotification('âŒ El archivo es muy pesado (MÃ¡ximo 2MB)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const proyectos = StorageManager.getItem('proyectos') || [];
        const index = proyectos.findIndex(p => p.id === proyectoId);

        if (index !== -1) {
            const proyecto = proyectos[index];

            // Guardar datos - solo tÃ­tulo y PDF
            proyecto.paso = 2;
            proyecto.estadoPaso2 = 'pendiente';

            // Limpiar datos anteriores de evaluaciÃ³n
            delete proyecto.comentariosPaso2;
            delete proyecto.puntuacionPaso2;

            proyecto.paso2 = {
                titulo: proyecto.titulo,
                archivoPDF: {
                    nombre: archivo.name,
                    tamano: archivo.size,
                    fechaSubida: new Date().toISOString(),
                    contenido: event.target.result // Base64
                }
            };

            StorageManager.setItem('proyectos', proyectos);

            showNotification('âœ“ Paso 2 enviado correctamente', 'success');
            cerrarModalSegundoEntregable();
            cargarProyectosCategoria();
        } else {
            showNotification('Error al guardar', 'error');
        }
    };

    reader.readAsDataURL(archivo);
}

// Editar segundo entregable
function editarSegundoEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto || !proyecto.paso2) {
        showNotification('Datos del paso 2 no encontrados', 'error');
        return;
    }

    window.currentProyectoSegundoEntregable = proyecto;

    const modalHTML = crearModalEditarSegundoEntregable(proyecto);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);

    const form = document.getElementById('formEditarSegundoEntregable');
    if (form) {
        form.addEventListener('submit', handleEditarSegundoEntregable);
    }
}


// Crear modal editar segundo entregable
function crearModalEditarSegundoEntregable(proyecto) {
    // Solo mostrar tÃ­tulo (readonly) y opciÃ³n para reemplazar PDF
    let camposHTML = `
        <div class="form-group">
            <label for="editPaso2Titulo">TÃ­tulo del Proyecto</label>
            <input type="text" id="editPaso2Titulo" value="${proyecto.paso2.titulo}" readonly style="background: #f7fafc; cursor: not-allowed;">
            <small style="color: #718096;">ðŸ“‹ Este campo se toma automÃ¡ticamente del sistema</small>
        </div>
        <div class="form-group" style="margin-top: 25px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
            ${proyecto.paso2.archivoPDF ? `
                <div class="alert alert-info" style="margin-bottom: 15px;">
                    <strong>ðŸ“„ Archivo actual:</strong> ${proyecto.paso2.archivoPDF.nombre}<br>
                    <small>TamaÃ±o: ${(proyecto.paso2.archivoPDF.tamano / 1024).toFixed(2)} KB | 
                    Subido: ${formatDateShort(proyecto.paso2.archivoPDF.fechaSubida)}</small>
                </div>
            ` : ''}
            <label for="editPaso2PDF">
                ${proyecto.paso2.archivoPDF ? 'Reemplazar Documento PDF (opcional)' : 'Adjuntar Documento PDF *'}
            </label>
            <input type="file" id="editPaso2PDF" accept=".pdf" ${!proyecto.paso2.archivoPDF ? 'required' : ''}>
            <small style="display: block; margin-top: 8px; color: #718096;">
                ðŸ“„ ${proyecto.paso2.archivoPDF ? 'Deje vacÃ­o si no desea cambiar el archivo' : 'Adjunte el documento en formato PDF (MÃ¡ximo 2MB)'}
            </small>
        </div>
    `;

    return `
        <div id="modalEditarSegundoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>âœï¸ Editar Paso 2: Perfil de Proyecto</h3>
                    <button class="modal-close" onclick="cerrarModalEditarSegundoEntregable()">&times;</button>
                </div>
                <form id="formEditarSegundoEntregable" class="modal-body">
                    <input type="hidden" id="editPaso2ProyectoId" value="${proyecto.id}">

                    <div class="alert alert-warning" style="margin-bottom: 20px;">
                        <strong>âš ï¸ CorrecciÃ³n:</strong> Fecha lÃ­mite: ${formatDate(proyecto.fechaLimiteCorreccionPaso2)}
                    </div>

                    ${camposHTML}

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="cerrarModalEditarSegundoEntregable()">Cancelar</button>
                        <button type="submit" class="btn-primary">ðŸ’¾ Guardar Correcciones</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// Cerrar modal editar segundo entregable
function cerrarModalEditarSegundoEntregable() {
    const modal = document.getElementById('modalEditarSegundoEntregable');
    if (modal) {
        modal.remove();
    }
}
// Manejar creaciÃ³n de nuevo proyecto

// Manejar ediciÃ³n segundo entregable
function handleEditarSegundoEntregable(e) {
    e.preventDefault();

    const proyectoId = document.getElementById('editPaso2ProyectoId').value;
    const archivoInput = document.getElementById('editPaso2PDF');
    const archivo = archivoInput.files[0];

    const proyectos = StorageManager.getItem('proyectos') || [];
    const index = proyectos.findIndex(p => p.id === proyectoId);

    if (index === -1) {
        showNotification('Proyecto no encontrado', 'error');
        return;
    }

    const proyecto = proyectos[index];

    // FunciÃ³n para guardar los datos - solo tÃ­tulo y PDF
    const guardarDatos = (archivoPDF) => {
        proyecto.paso2 = {
            titulo: proyecto.titulo, // Siempre del proyecto original
            archivoPDF: archivoPDF
        };

        proyecto.estadoPaso2 = 'pendiente';
        proyecto.fechaEdicionPaso2 = new Date().toISOString();

        delete proyecto.comentariosPaso2;
        delete proyecto.puntuacionPaso2;

        StorageManager.setItem('proyectos', proyectos);

        showNotification('âœ“ Paso 2 actualizado correctamente', 'success');
        cerrarModalEditarSegundoEntregable();
        cargarProyectosCategoria();
    };

    // Si se seleccionÃ³ un nuevo archivo
    if (archivo) {
        if (archivo.type !== 'application/pdf') {
            showNotification('âš ï¸ Solo se permiten archivos PDF', 'warning');
            return;
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (archivo.size > maxSize) {
            showNotification('âš ï¸ El archivo no debe superar los 2MB', 'warning');
            return;
        }

        showNotification('ðŸ“¤ Subiendo nuevo archivo...', 'info');

        const reader = new FileReader();
        reader.onload = function (event) {
            const archivoPDF = {
                nombre: archivo.name,
                tamano: archivo.size,
                tipo: archivo.type,
                fechaSubida: new Date().toISOString(),
                contenido: event.target.result
            };
            guardarDatos(archivoPDF);
        };
        reader.readAsDataURL(archivo);
    } else {
        // Mantener el archivo anterior si existe
        guardarDatos(proyecto.paso2.archivoPDF || null);
    }
}

// Exportar nuevas funciones
window.subirSegundoEntregable = subirSegundoEntregable;
window.cerrarModalSegundoEntregable = cerrarModalSegundoEntregable;
window.editarSegundoEntregable = editarSegundoEntregable;
window.cerrarModalEditarSegundoEntregable = cerrarModalEditarSegundoEntregable;


// Visualizar PDF del proyecto
function visualizarPDF(proyectoId, paso = '2') {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(pr => pr.id === proyectoId);

    if (!proyecto) {
        showNotification('Proyecto no encontrado', 'error');
        return;
    }

    // 1. Determinar quÃ© PDF mostrar segÃºn el parÃ¡metro 'paso'
    let pdf = null;

    // Si piden paso 6 y existe
    if (String(paso) === '6' && proyecto.paso6 && proyecto.paso6.archivoPDF) {
        pdf = proyecto.paso6.archivoPDF;
    }
    // Si no, intentamos mostrar el del Paso 2 (Default)
    else if (proyecto.paso2 && proyecto.paso2.archivoPDF) {
        pdf = proyecto.paso2.archivoPDF;
    }

    // 2. Validar si encontramos algÃºn PDF
    if (!pdf) {
        showNotification('âŒ No hay documento PDF disponible para esta fase', 'warning');
        return;
    }

    // 3. Generar Modal
    const modalHTML = `
        <div id="modalVisualizarPDF" class="modal active" style="display: flex;">
            <div class="modal-content modal-large" style="max-width: 90%; max-height: 95vh;">
                <div class="modal-header">
                    <h3>ðŸ“„ ${pdf.nombre}</h3>
                    <button class="modal-close" onclick="cerrarModalPDF()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div style="padding: 20px; background: #f7fafc; border-bottom: 1px solid #e2e8f0;">
                        <p style="margin: 5px 0;"><strong>Nombre:</strong> ${pdf.nombre}</p>
                        <p style="margin: 5px 0;"><strong>TamaÃ±o:</strong> ${(pdf.tamano / 1024).toFixed(2)} KB</p>
                        <p style="margin: 5px 0;"><strong>Fecha de subida:</strong> ${pdf.fechaSubida ? formatDate(pdf.fechaSubida) : 'Reciente'}</p>
                        <p style="margin: 5px 0;"><strong>Proyecto:</strong> ${proyecto.titulo}</p>
                    </div>
                    <div style="height: 70vh; overflow: auto; background: #525659;">
                        <iframe 
                            src="${pdf.contenido}#toolbar=1&navpanes=1&scrollbar=1" 
                            style="width: 100%; height: 100%; border: none;"
                            type="application/pdf"
                        ></iframe>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="cerrarModalPDF()">Cerrar</button>
                    <a href="${pdf.contenido}" download="${pdf.nombre}" class="btn-primary" style="text-decoration: none; display: inline-block; padding: 12px 24px;">
                        ðŸ’¾ Descargar PDF
                    </a>
                </div>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
}

// Cerrar modal PDF
function cerrarModalPDF() {
    const modal = document.getElementById('modalVisualizarPDF');
    if (modal) {
        modal.remove();
    }
}

/* ===========================================================
   FUNCIONES NUEVAS: PASO 3 (IDENTIFICACIÃ“N DE PROBLEMÃTICA)
   =========================================================== */

// Abrir el modal del Paso 3
function subirTercerEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto) return;

    // HTML del Modal con los campos que pediste
    const modalHTML = `
        <div id="modalTercerEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>III. IDENTIFICACIÃ“N DE LA PROBLEMÃTICA</h3>
                    <button class="modal-close" onclick="cerrarModalTercerEntregable()">&times;</button>
                </div>
                
                <form id="formTercerEntregable" class="modal-body">
                    <input type="hidden" id="paso3ProyectoId" value="${proyecto.id}">
                    
                    <!-- 2.1 IdentificaciÃ³n del problema -->
                    <div class="form-group">
                        <label for="identificacionProblema"><strong>2.1. IdentificaciÃ³n del problema (incluye causas)</strong></label>
                        <textarea id="identificacionProblema" class="form-control" rows="4" required placeholder="Describa claramente el problema y sus causas..."></textarea>
                    </div>

                    <!-- 2.2 FormulaciÃ³n del problema -->
                    <div class="form-group">
                        <label for="formulacionProblema"><strong>2.2. FormulaciÃ³n del problema (General y EspecÃ­ficos)</strong></label>
                        <textarea id="formulacionProblema" class="form-control" rows="4" required placeholder="Formule el problema general y los especÃ­ficos..."></textarea>
                    </div>

                    <!-- 2.3 Objetivos -->
                    <div class="form-group">
                        <label for="objetivos"><strong>2.3. Objetivos de la InvestigaciÃ³n (General y EspecÃ­ficos) â€“ Verbo en infinitivo</strong></label>
                        <textarea id="objetivos" class="form-control" rows="4" required placeholder="Redacte los objetivos usando verbos en infinitivo..."></textarea>
                    </div>

                    <!-- 2.4 JustificaciÃ³n -->
                    <div class="form-group">
                        <label for="justificacion"><strong>2.4. JustificaciÃ³n social</strong></label>
                        <textarea id="justificacion" class="form-control" rows="4" required placeholder="Explique la necesidad u oportunidad que se busca aprovechar..."></textarea>
                    </div>

                    <!-- 2.5 Limitaciones -->
                    <div class="form-group">
                        <label for="limitaciones"><strong>2.5. Limitaciones de la investigaciÃ³n</strong></label>
                        <textarea id="limitaciones" class="form-control" rows="4" required placeholder="Indique las limitaciones del estudio..."></textarea>
                    </div>

                    <!-- Botones -->
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="cerrarModalTercerEntregable()">Cancelar</button>
                        <button type="submit" class="btn-primary" style="background: #673AB7;">
                            ðŸ’¾ Guardar Paso 3
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);

    // Agregar listener al formulario
    document.getElementById('formTercerEntregable').addEventListener('submit', handleGuardarPaso3);
}

// Cerrar modal
function cerrarModalTercerEntregable() {
    const modal = document.getElementById('modalTercerEntregable');
    if (modal) modal.remove();
}

// Guardar datos del Paso 3
function handleGuardarPaso3(e) {
    e.preventDefault();

    const proyectoId = document.getElementById('paso3ProyectoId').value;
    const proyectos = StorageManager.getItem('proyectos') || [];
    const index = proyectos.findIndex(p => p.id === proyectoId);

    if (index === -1) return;

    const proyecto = proyectos[index];

    // Guardar los datos en el objeto proyecto
    proyecto.paso = 3;
    proyecto.estadoPaso3 = 'pendiente'; // Pasa a estado pendiente para evaluaciÃ³n
    proyecto.paso3 = {
        identificacion: document.getElementById('identificacionProblema').value,
        formulacion: document.getElementById('formulacionProblema').value,
        objetivos: document.getElementById('objetivos').value,
        justificacion: document.getElementById('justificacion').value,
        limitaciones: document.getElementById('limitaciones').value,
        fechaEnvio: new Date().toISOString()
    };

    StorageManager.setItem('proyectos', proyectos);

    showNotification('âœ“ Paso 3 guardado y enviado a revisiÃ³n', 'success');
    cerrarModalTercerEntregable();
    cargarProyectosCategoria(); // Recargar la lista para ver los cambios
}

// FunciÃ³n para Editar (Si fue rechazado) - Carga los datos previos
function editarTercerEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto || !proyecto.paso3) return;

    // Llamamos a la misma funciÃ³n de subir, pero luego llenamos los campos
    subirTercerEntregable(proyectoId);

    // Llenar los campos con lo que ya existÃ­a
    setTimeout(() => {
        document.getElementById('identificacionProblema').value = proyecto.paso3.identificacion || '';
        document.getElementById('formulacionProblema').value = proyecto.paso3.formulacion || '';
        document.getElementById('objetivos').value = proyecto.paso3.objetivos || '';
        document.getElementById('justificacion').value = proyecto.paso3.justificacion || '';
        document.getElementById('limitaciones').value = proyecto.paso3.limitaciones || '';

        // Cambiar tÃ­tulo del modal para que diga "Editar"
        document.querySelector('#modalTercerEntregable h3').textContent = 'âœï¸ CORREGIR: III. IDENTIFICACIÃ“N DE LA PROBLEMÃTICA';
    }, 50);
}

// Exportar al window para que el HTML los reconozca
window.subirTercerEntregable = subirTercerEntregable;
window.cerrarModalTercerEntregable = cerrarModalTercerEntregable;
window.editarTercerEntregable = editarTercerEntregable;

/* ===========================================================
   FUNCIONES NUEVAS: PASO 4 (MARCO TEÃ“RICO E HIPÃ“TESIS)
   =========================================================== */

function subirCuartoEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    // Verificar requisitos
    if (proyecto.estadoPaso3 !== 'aprobado') {
        showNotification('Debe aprobar el Paso 3 primero.', 'error');
        return;
    }

    const modalHTML = `
        <div id="modalCuartoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>IV. MARCO TEÃ“RICO E HIPÃ“TESIS</h3>
                    <button class="modal-close" onclick="document.getElementById('modalCuartoEntregable').remove()">&times;</button>
                </div>
                <form id="formCuartoEntregable" class="modal-body">
                    <input type="hidden" id="paso4ProyectoId" value="${proyecto.id}">

                    <div class="form-group">
                        <label><strong>3.1. Antecedentes del estudio</strong></label>
                        <textarea id="p4_antecedentes" class="form-control" rows="4" required></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>2.2. Bases teÃ³ricas - cientÃ­ficas</strong></label>
                        <textarea id="p4_bases" class="form-control" rows="4" required></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>3.3. DefiniciÃ³n de tÃ©rminos bÃ¡sicos</strong></label>
                        <textarea id="p4_definicion" class="form-control" rows="4" required></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>4.1. Cuadro de operacionalizaciÃ³n de variables e indicadores</strong></label>
                        <textarea id="p4_cuadro" class="form-control" rows="4" required placeholder="Describa o copie el contenido del cuadro..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>4.2. HipÃ³tesis (G. E.)</strong></label>
                        <textarea id="p4_hipotesis" class="form-control" rows="4" required placeholder="Si (Objetivo general), ENTONCES (probable soluciÃ³n)..."></textarea>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalCuartoEntregable').remove()">Cancelar</button>
                        <button type="submit" class="btn-primary" style="background: #FF9800;">ðŸ’¾ Enviar Paso 4</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    const d = document.createElement('div'); d.innerHTML = modalHTML; document.body.appendChild(d.firstElementChild);
    document.getElementById('formCuartoEntregable').addEventListener('submit', handleGuardarPaso4);
}

function handleGuardarPaso4(e) {
    e.preventDefault();
    const id = document.getElementById('paso4ProyectoId').value;
    const proyectos = StorageManager.getItem('proyectos') || [];
    const index = proyectos.findIndex(p => p.id === id);
    if (index === -1) return;

    proyectos[index].paso = 4;
    proyectos[index].estadoPaso4 = 'pendiente';

    // Limpiar evaluaciones previas del paso 4
    delete proyectos[index].comentariosPaso4;
    delete proyectos[index].puntuacionPaso4;

    proyectos[index].paso4 = {
        antecedentes: document.getElementById('p4_antecedentes').value,
        bases: document.getElementById('p4_bases').value,
        definicion: document.getElementById('p4_definicion').value,
        cuadro: document.getElementById('p4_cuadro').value,
        hipotesis: document.getElementById('p4_hipotesis').value,
        fechaEnvio: new Date().toISOString()
    };

    StorageManager.setItem('proyectos', proyectos);
    showNotification('âœ“ Paso 4 enviado a revisiÃ³n', 'success');
    document.getElementById('modalCuartoEntregable').remove();
    cargarProyectosCategoria();
}

function editarCuartoEntregable(proyectoId) {
    subirCuartoEntregable(proyectoId);
    setTimeout(() => {
        const p = (StorageManager.getItem('proyectos') || []).find(pr => pr.id === proyectoId);
        if (p && p.paso4) {
            document.getElementById('p4_antecedentes').value = p.paso4.antecedentes;
            document.getElementById('p4_bases').value = p.paso4.bases;
            document.getElementById('p4_definicion').value = p.paso4.definicion;
            document.getElementById('p4_cuadro').value = p.paso4.cuadro;
            document.getElementById('p4_hipotesis').value = p.paso4.hipotesis;
            document.querySelector('#modalCuartoEntregable h3').textContent = 'âœï¸ CORREGIR PASO 4';
        }
    }, 50);
}

// Exportar
window.subirCuartoEntregable = subirCuartoEntregable;
window.editarCuartoEntregable = editarCuartoEntregable;

/* ===========================================================
   FUNCIONES NUEVAS: PASO 5 (METODOLOGÃA)
   =========================================================== */

function subirQuintoEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    if (proyecto.estadoPaso4 !== 'aprobado') {
        showNotification('Debe aprobar el Paso 4 primero.', 'error');
        return;
    }

    // PRE-LLENADO DE DATOS (Extraer informaciÃ³n existente)
    const tipoInv = proyecto.tipoInvestigacion === 'aplicada' ? 'InvestigaciÃ³n Aplicada' : 'InnovaciÃ³n TecnolÃ³gica';
    // Combinar lugar y fechas para el campo "Lugar y periodo"
    const lugarPeriodo = `${proyecto.localizacion} (${formatDateShort(proyecto.fechaInicio)} - ${formatDateShort(proyecto.fechaFinalizacion)})`;
    // Intentar predecir poblaciÃ³n basada en beneficiarios
    const poblacion = proyecto.beneficiarios || '';

    const modalHTML = `
        <div id="modalQuintoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>V. METODOLOGÃA</h3>
                    <button class="modal-close" onclick="document.getElementById('modalQuintoEntregable').remove()">&times;</button>
                </div>
                <form id="formQuintoEntregable" class="modal-body">
                    <input type="hidden" id="paso5ProyectoId" value="${proyecto.id}">

                    <div class="alert alert-info">
                        â„¹ï¸ Algunos campos se han completado automÃ¡ticamente. Puede editarlos si es necesario.
                    </div>

                    <div class="form-group">
                        <label><strong>Tipo de investigaciÃ³n</strong></label>
                        <input type="text" id="p5_tipo" class="form-control" value="${tipoInv}" required>
                    </div>

                    <div class="form-group">
                        <label><strong>DiseÃ±o de investigaciÃ³n</strong></label>
                        <textarea id="p5_diseno" class="form-control" rows="2" required placeholder="Ej: Experimental, Cuasi-experimental, Descriptivo..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>Alcance de la investigaciÃ³n</strong></label>
                        <textarea id="p5_alcance" class="form-control" rows="2" required placeholder="Ej: Exploratorio, Descriptivo, Correlacional, Explicativo..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>Lugar y periodo de la investigaciÃ³n</strong></label>
                        <input type="text" id="p5_lugar" class="form-control" value="${lugarPeriodo}" required>
                    </div>

                    <div class="form-group">
                        <label><strong>Instrumentos de recolecciÃ³n de datos</strong></label>
                        <textarea id="p5_instrumentos" class="form-control" rows="3" required placeholder="Ej: Encuestas, Entrevistas, Fichas de observaciÃ³n..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>PoblaciÃ³n y muestra</strong></label>
                        <textarea id="p5_poblacion" class="form-control" rows="3" required>${poblacion}</textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>Plan de anÃ¡lisis estadÃ­stico de datos</strong></label>
                        <select id="p5_analisis" class="form-control" required>
                            <option value="">-- Seleccione una opciÃ³n --</option>
                            <option value="Descriptivo">AnÃ¡lisis Descriptivo</option>
                            <option value="Inferencial">AnÃ¡lisis Inferencial</option>
                            <option value="Ambos">Descriptivo e Inferencial</option>
                        </select>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalQuintoEntregable').remove()">Cancelar</button>
                        <button type="submit" class="btn-primary" style="background: #00BCD4;">ðŸ’¾ Enviar Paso 5</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    const d = document.createElement('div'); d.innerHTML = modalHTML; document.body.appendChild(d.firstElementChild);
    document.getElementById('formQuintoEntregable').addEventListener('submit', handleGuardarPaso5);
}

function handleGuardarPaso5(e) {
    e.preventDefault();
    const id = document.getElementById('paso5ProyectoId').value;
    const proyectos = StorageManager.getItem('proyectos') || [];
    const index = proyectos.findIndex(p => p.id === id);
    if (index === -1) return;

    proyectos[index].paso = 5;
    proyectos[index].estadoPaso5 = 'pendiente';

    delete proyectos[index].comentariosPaso5;
    delete proyectos[index].puntuacionPaso5;

    proyectos[index].paso5 = {
        tipo: document.getElementById('p5_tipo').value,
        diseno: document.getElementById('p5_diseno').value,
        alcance: document.getElementById('p5_alcance').value,
        lugar: document.getElementById('p5_lugar').value,
        instrumentos: document.getElementById('p5_instrumentos').value,
        poblacion: document.getElementById('p5_poblacion').value,
        analisis: document.getElementById('p5_analisis').value,
        fechaEnvio: new Date().toISOString()
    };

    StorageManager.setItem('proyectos', proyectos);
    showNotification('âœ“ Paso 5 enviado a revisiÃ³n', 'success');
    document.getElementById('modalQuintoEntregable').remove();
    cargarProyectosCategoria();
}

function editarQuintoEntregable(proyectoId) {
    subirQuintoEntregable(proyectoId);
    setTimeout(() => {
        const p = (StorageManager.getItem('proyectos') || []).find(pr => pr.id === proyectoId);
        if (p && p.paso5) {
            document.getElementById('p5_tipo').value = p.paso5.tipo;
            document.getElementById('p5_diseno').value = p.paso5.diseno;
            document.getElementById('p5_alcance').value = p.paso5.alcance;
            document.getElementById('p5_lugar').value = p.paso5.lugar;
            document.getElementById('p5_instrumentos').value = p.paso5.instrumentos;
            document.getElementById('p5_poblacion').value = p.paso5.poblacion;
            document.getElementById('p5_analisis').value = p.paso5.analisis;
            document.querySelector('#modalQuintoEntregable h3').textContent = 'âœï¸ CORREGIR PASO 5';
        }
    }, 50);
}

window.subirQuintoEntregable = subirQuintoEntregable;
window.editarQuintoEntregable = editarQuintoEntregable;

function cargarCriteriosPaso6(proyecto) {
    const container = document.getElementById('criteriosEvaluacion');

    // Mostrar botÃ³n para ver el PDF
    const btnPDF = `
        <div style="margin-bottom:20px; padding:15px; background:#f3e5f5; border:1px solid #e1bee7; border-radius:5px;">
            <strong>ðŸ“„ Informe Final Adjunto:</strong> ${proyecto.paso6.archivoPDF.nombre}<br>
            <button type="button" onclick="visualizarPDF('${proyecto.id}', '6')" style="margin-top:10px; background:#9C27B0; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:4px;">
                ðŸ‘ï¸ Ver Informe Completo
            </button>
        </div>
        <h3>Lista de Cotejo (Marque SÃ si cumple)</h3>
    `;

    // Las 35 preguntas
    const preguntas = [
        // I. Datos Generales
        "1. Describe la lÃ­nea de investigaciÃ³n",
        "2. Describe los beneficiarios del proyecto directos e indirectos",
        "3. Menciona el costo del proyecto",
        "4. Explica la fuente de financiamiento",
        "5. Menciona el lugar de ejecuciÃ³n",
        // II. TÃ­tulo
        "6. Refleja el contenido de la descripciÃ³n del problema",
        "7. Es concordante con las variables de estudio nivel y alcance",
        // III. IdentificaciÃ³n de la problemÃ¡tica
        "8. Describe el problema (causas, caracterÃ­sticas, consecuencias) con citas",
        "9. La formulaciÃ³n del problema considera variables y dimensiones",
        "10. El objetivo general tiene relaciÃ³n con el problema y tÃ­tulo",
        "11. Los objetivos especÃ­ficos relacionan problemas y variables",
        "12. La justificaciÃ³n social determina el beneficio a la sociedad",
        "13. Establece claramente el alcance geogrÃ¡fico y temporal",
        // IV. Marco TeÃ³rico
        "14. Antecedentes son de tesis/artÃ­culos/libros especializados",
        "15. DescripciÃ³n de antecedentes resume problema, objetivo y soluciÃ³n",
        "16. Presenta ideas y teorÃ­as claras relacionadas al tema",
        "17. Conceptos utilizados son de las variables y dimensiones",
        // V. HipÃ³tesis
        "18. HipÃ³tesis general da respuesta a priori al problema general",
        "19. HipÃ³tesis especÃ­ficas dan respuesta a problemas especÃ­ficos",
        "20. Variables conceptualizadas con cita correspondiente",
        "21. OperacionalizaciÃ³n: RelaciÃ³n entre variables y dimensiones",
        "22. OperacionalizaciÃ³n: RelaciÃ³n entre dimensiÃ³n e indicador",
        // VI. MetodologÃ­a
        "23. Identifica mÃ©todo general y especÃ­fico correctamente",
        "24. Considera y fundamenta el tipo de investigaciÃ³n",
        "25. Propone nivel de investigaciÃ³n correcto",
        "26. DiseÃ±o de investigaciÃ³n acorde al nivel",
        "27. Identifica universo y Ã¡mbito de investigaciÃ³n",
        "28. Determina tamaÃ±o de muestra correctamente",
        "29. Describe tÃ©cnica/instrumento con confiabilidad y validez",
        "30. Describe mÃ©todos especÃ­ficos de evaluaciÃ³n de variables",
        "31. Identifica mÃ©todos adecuados de anÃ¡lisis de datos",
        // VII. Cronograma
        "32. Cronograma establece acciones para cumplir objetivos",
        // VIII. Presupuesto
        "33. Establece el presupuesto del proyecto",
        // IX. Referencias
        "34. Establecidas de acuerdo a normas APA",
        // X. Anexos
        "35. Considera anexos exigidos en orden"
    ];

    // Generar HTML (Cada pregunta vale aprox 2.85 pts para llegar a 100, o usamos conteo simple)
    // Usaremos conteo simple: Total 35 puntos.

    let html = btnPDF + preguntas.map((p, i) => `
        <div class="criterion-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <div style="flex:1; font-size:0.9em;">${p}</div>
            <label class="checkbox-container">
                <input type="checkbox" name="eval-criterio-${i}" value="1"> <!-- Cada uno vale 1 punto -->
                <span class="checkmark"></span>
                <span class="points">SÃ</span>
            </label>
        </div>
    `).join('');

    container.innerHTML = html;
    updateElementText('puntuacionMaxima', '35'); // Total de preguntas
}

// ===== FUNCIONES AGREGADAS PARA MANEJAR PROYECTOS =====
