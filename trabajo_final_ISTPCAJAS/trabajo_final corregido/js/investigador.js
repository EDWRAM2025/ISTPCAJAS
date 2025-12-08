/* ====================================
   INVESTIGADOR.JS - Modulo Investigador
   ==================================== */

// Variables globales
let currentCategory = null;

// Inicializacion
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

// Cargar estadisticas del dashboard
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

// Cargar contadores por Categoria
// Cargar contadores por Categoria
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

// Abrir Categoria
function abrirCategoria(categoria) {
    window.location.href = `categoria-proyectos.html?categoria=${categoria}`;
}

// Cargar Categoria desde URL
function loadCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    currentCategory = params.get('categoria');

    if (!currentCategory) {
        showNotification('Categoria no especificada', 'error');
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
        if (emptyStateMessage) emptyStateMessage.textContent = 'No hay proyectos pendientes en esta Categoria';
        if (sidebarText) sidebarText.textContent = 'Proyectos';
    }

    cargarProyectosCategoria();
}

// Cargar proyectos de la Categoria
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
        // --- SECCIN DE ESTADOS (SOLO MUESTRA EL PASO ACTUAL) ---

        // PASO 1 - No se muestra estado porque los datos no son evaluados
        if (proyecto.paso === 1) {
            statusSection = '';
        }
        // PASO 2
        else if (proyecto.paso === 2) {
            const st = proyecto.estadoPaso2 || 'pendiente';
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">Fase 2: Perfil</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                </div>`;
        }
        // PASO 3
        else if (proyecto.paso === 3) {
            const st = proyecto.estadoPaso3 || 'pendiente';
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">Fase 3: Problematica</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                </div>`;
        }
        // PASO 4
        else if (proyecto.paso === 4) {
            const st = proyecto.estadoPaso4 || 'pendiente';
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">Fase 4: Marco Teorico</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                </div>`;
        }
        // PASO 5
        else if (proyecto.paso === 5) {
            const st = proyecto.estadoPaso5 || 'pendiente';
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">Fase 5: Metodologia</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                </div>`;
        }
        // PASO 6 (INFORME FINAL)
        else if (proyecto.paso === 6) {
            const st = proyecto.estadoPaso6 || 'pendiente';
            const tienePDF6 = proyecto.paso6 && proyecto.paso6.archivoPDF;
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">Fase 6: Informe Final</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                    ${tienePDF6 ? '<div style="margin-top:5px; font-size:0.9em; color:#1976D2;">📄 Informe Final PDF cargado</div>' : ''}
                </div>`;
        }
        // PASO 7 (ARTÍCULO CIENTÍFICO)
        else if (proyecto.paso === 7) {
            const st = proyecto.estadoPaso7 || 'pendiente';
            const tienePDF7 = proyecto.paso7 && proyecto.paso7.archivoPDF;
            statusSection = `
                <div style="background: ${getStatusColor(st)}15; padding: 12px; border-radius: 8px; border-left: 4px solid ${getStatusColor(st)}; margin-bottom: 10px;">
                    <h4 style="margin:0 0 5px 0; color: #333;">Fase 7: Artículo Científico</h4>
                    <div style="display:flex; justify-content:space-between;"><span>Estado:</span> ${getStatusBadge(st)}</div>
                    ${tienePDF7 ? '<div style="margin-top:5px; font-size:0.9em; color:#667eea;">📰 Artículo Científico PDF cargado</div>' : ''}
                    ${st === 'aprobado' ? '<div style="margin-top:10px; padding:8px; background:#E8F5E9; color:#2E7D32; border-radius:4px; font-weight:bold; text-align:center;">🎉 PROYECTO COMPLETADO AL 100%!</div>' : ''}
                </div>`;
        }

        // --- BOTONES DE ACCIN ---
        actions = '<div class="proyecto-actions">';
        actions += `<button class="btn-small btn-view" onclick="verReporte('${proyecto.id}')"> Reporte</button>`;

        // Si hay PDF del Paso 2 o del Paso 6, mostrar botn de ver PDF
        const pdfToShow = (proyecto.paso === 6 && proyecto.paso6) ? '6' : (tienePDF ? '2' : null);
        if (pdfToShow) {
            actions += `<button class="btn-small" onclick="visualizarPDF('${proyecto.id}', '${pdfToShow}')" style="background: #607D8B; color: white;"> Ver PDF</button>`;
        }

        // LGICA DE BOTONES POR PASO
        if (proyecto.paso === 1) {
            // Botn Primer Avance siempre visible en paso 1
            actions += `<button class="btn-small btn-primary" onclick="subirSegundoEntregable('${proyecto.id}')" style="background: #4CAF50;">Primer Avance</button>`;
        }
        else if (proyecto.paso === 2) {
            if (proyecto.estadoPaso2 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarSegundoEntregable('${proyecto.id}')">Corregir Paso 2</button>`;
            else if (proyecto.estadoPaso2 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirTercerEntregable('${proyecto.id}')" style="background: #673AB7;">Iniciar Paso 3</button>`;
        }
        else if (proyecto.paso === 3) {
            if (proyecto.estadoPaso3 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarTercerEntregable('${proyecto.id}')">Corregir Paso 3</button>`;
            else if (proyecto.estadoPaso3 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirCuartoEntregable('${proyecto.id}')" style="background: #FF9800;"> Iniciar Paso 4</button>`;
        }
        else if (proyecto.paso === 4) {
            if (proyecto.estadoPaso4 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarCuartoEntregable('${proyecto.id}')">Corregir Paso 4</button>`;
            else if (proyecto.estadoPaso4 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirQuintoEntregable('${proyecto.id}')" style="background: #00BCD4;">Iniciar Paso 5</button>`;
        }
        else if (proyecto.paso === 5) {
            if (proyecto.estadoPaso5 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarQuintoEntregable('${proyecto.id}')">Corregir Paso 5</button>`;
            else if (proyecto.estadoPaso5 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirSextoEntregable('${proyecto.id}')" style="background: #9C27B0;"> Subir Informe Final</button>`;
        }
        // BOTÓN PASO 6
        else if (proyecto.paso === 6) {
            if (proyecto.estadoPaso6 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarSextoEntregable('${proyecto.id}')">✏️ Corregir Informe</button>`;
            else if (proyecto.estadoPaso6 === 'aprobado') actions += `<button class="btn-small btn-primary" onclick="subirSeptimoEntregable('${proyecto.id}')" style="background: #667eea;">📰 Subir Artículo Científico</button>`;
        }
        // BOTÓN PASO 7
        else if (proyecto.paso === 7) {
            if (proyecto.estadoPaso7 === 'rechazado') actions += `<button class="btn-small btn-edit" onclick="editarSeptimoEntregable('${proyecto.id}')">✏️ Corregir Artículo</button>`;
            else if (proyecto.estadoPaso7 === 'aprobado') actions += `<button class="btn-small" disabled style="background: #4CAF50; color: white; opacity: 0.7; cursor: not-allowed;">✅ Proyecto Completado</button>`;
        }

        actions += '</div>';
    }

    // Vista Evaluador (Actualizada con el botn Paso 3)
    if (isEvaluador) {
        actions = '<div class="proyecto-actions">';

        // Botn Reporte
        actions += `<button class="btn-small btn-view" onclick="verReporte('${proyecto.id}')"> Reporte</button>`;

        // Botn PDF
        if (tienePDF) {
            actions += `<button class="btn-small" onclick="visualizarPDF('${proyecto.id}')" style="background: #607D8B; color: white;"> PDF</button>`;
        }

        // --- LGICA PARA MOSTRAR EL BOTN DE EVALUAR CORRECTO ---
        let btnEvaluar = '';

        // Verificamos en orden inverso (3 -> 2 -> 1)
        if (proyecto.paso === 6 && proyecto.estadoPaso6 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #9C27B0; color: white;"> Evaluar Informe Final</button>`;
        }
        else if (proyecto.paso === 5 && proyecto.estadoPaso5 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #00BCD4; color: white;"> Evaluar Paso 5</button>`;
        }
        else if (proyecto.paso === 4 && proyecto.estadoPaso4 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #FF5722; color: white;"> Evaluar Paso 4</button>`;
        }
        else if (proyecto.paso === 3 && proyecto.estadoPaso3 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #E91E63; color: white;"> Evaluar Paso 3</button>`;
        }
        else if (proyecto.paso === 2 && proyecto.estadoPaso2 === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')" style="background: #2196F3; color: white;"> Evaluar Paso 2</button>`;
        }
        else if (proyecto.estado === 'pendiente') {
            actions += `<button class="btn-small btn-evaluate" onclick="evaluarProyecto('${proyecto.id}')"> Evaluar Paso 1</button>`;
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
                <div><strong> Creado:</strong> ${formatDateShort(proyecto.fechaCreacion)}</div>
                <div><strong>Tipo:</strong> ${proyecto.tipoInvestigacion === 'aplicada' ? 'Aplicada' : 'Innovacion'}</div>
                <div><strong> Linea:</strong> ${formatLineaInvestigacion(proyecto.lineaInvestigacion)}</div>
                ${isEvaluador ? `<div><strong>Investigador:</strong> ${proyecto.investigadorNombre}</div>` : ''}
                ${proyecto.evaluadorNombre ? `<div><strong> Evaluado por:</strong> ${proyecto.evaluadorNombre}</div>` : ''}
                ${proyecto.puntuacion !== undefined ? `<div><strong> Puntuacion Paso 1:</strong> ${proyecto.puntuacion}/100</div>` : ''}
                ${proyecto.puntuacionPaso2 !== undefined ? `<div><strong> Puntuacion Paso 2:</strong> ${proyecto.puntuacionPaso2}/100</div>` : ''}
            </div>
            <div class="proyecto-description">
                <strong>Objetivo:</strong> ${proyecto.objetivoProyecto}
            </div>
            ${proyecto.comentarios ? `
                <div class="alert alert-info" style="margin-top: 15px; font-size: 0.85em;">
                    <strong>Comentarios Paso 1:</strong><br>
                    ${proyecto.comentarios}
                </div>
            ` : ''}
            ${proyecto.comentariosPaso2 ? `
                <div class="alert alert-info" style="margin-top: 15px; font-size: 0.85em;">
                    <strong>Comentarios Paso 2:</strong><br>
                    ${proyecto.comentariosPaso2}
                </div>
            ` : ''}
            <div class="proyecto-footer">
                ${actions}
            </div>
        </div>
    `;
}

// Formatear Linea de Investigacion
function formatLineaInvestigacion(linea) {
    const nombres = {
        'ingenieria-sistemas': 'Ingeniera de Sistemas',
        'ingenieria-industrial': 'Ingeniera Industrial',
        'administracion': 'Administracin de Empresas',
        'contabilidad': 'Contabilidad',
        'derecho': 'Derecho',
        'medicina': 'Medicina',
        'enfermeria': 'Enfermera',
        'arquitectura': 'Arquitectura',
        'educacion': 'Educacin',
        'psicologia': 'Psicologa'
    };
    return nombres[linea] || linea;
}

// Generar reporte automtico
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
            <h2 style="color: #667eea; margin-bottom: 10px;">INSTITUTO DE INVESTIGACIN</h2>
            <h3 style="color: #2d3748; margin-bottom: 5px;">REPORTE DE CONSTANCIA</h3>
            <h4 style="color: #718096;">Informe General de Proyecto</h4>
            <p style="color: #a0aec0; font-size: 0.9em; margin-top: 10px;">Generado el: ${fechaGeneracion}</p>
        </div>

        <div class="reporte-body" style="line-height: 1.8; color: #2d3748;">
            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                     INFORMACIN GENERAL
                </h4>
                <p><strong>Titulo del Proyecto:</strong><br>${proyecto.titulo}</p>
                <p><strong>Categoria:</strong> ${getCategoryName(proyecto.categoria)}</p>
                <p><strong>Tipo de Investigacion:</strong> ${proyecto.tipoInvestigacion === 'aplicada' ? 'Aplicada' : 'Innovacion'}</p>
                <p><strong>Linea de Investigacion:</strong> ${formatLineaInvestigacion(proyecto.lineaInvestigacion)}</p>
            </div>

            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    INTEGRANTES DEL PROYECTO
                </h4>
                <ul style="list-style: none; padding-left: 0;">
                    ${integrantes.map((integrante, index) =>
        `<li style="padding: 5px 0;"> ${integrante}</li>`
    ).join('')}
                </ul>
            </div>

            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    OBJETIVO DEL PROYECTO
                </h4>
                <p style="text-align: justify;">${proyecto.objetivoProyecto}</p>
            </div>

            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    DATOS ADICIONALES
                </h4>
                <p><strong>Beneficiarios:</strong> ${proyecto.beneficiarios}</p>
                <p><strong>Localizacin:</strong> ${proyecto.localizacion}</p>
                <p><strong>Fecha de Inicio:</strong> ${formatDate(proyecto.fechaInicio)}</p>
                <p><strong>Fecha de Finalizacion:</strong> ${formatDate(proyecto.fechaFinalizacion)}</p>
            </div>

            <div class="reporte-section" style="margin-bottom: 25px;">
                <h4 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">
                    RESPONSABLE
                </h4>
                <p><strong>Investigador Principal:</strong> ${proyecto.investigadorNombre}</p>
                <p><strong>Fecha de Presentacin:</strong> ${formatDate(proyecto.fechaCreacion)}</p>
            </div>

            ${proyecto.estado !== 'pendiente' ? `
                <div class="reporte-section" style="margin-bottom: 25px; background: ${proyecto.estado === 'aprobado' ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 8px;">
                    <h4 style="color: ${proyecto.estado === 'aprobado' ? '#2e7d32' : '#c62828'}; margin-bottom: 10px;">
                         EVALUACIN
                    </h4>
                    <p><strong>Estado:</strong> ${proyecto.estado === 'aprobado' ? ' APROBADO' : ' RECHAZADO'}</p>
                    <p><strong>Puntuacion:</strong> ${proyecto.puntuacion}/100</p>
                    <p><strong> Evaluador:</strong> ${proyecto.evaluadorNombre}</p>
                    <p><strong>Fecha de Evaluacion:</strong> ${formatDate(proyecto.fechaEvaluacion)}</p>
                    ${proyecto.comentarios ? `<p><strong>Comentarios:</strong><br>${proyecto.comentarios}</p>` : ''}
                </div>
            ` : ''}
        </div>

        <div class="reporte-footer" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.9em;">
            <p>Este documento ha sido generado automticamente por el Sistema de Gestin de Proyectos</p>
            <p>Instituto de Investigacion  ${new Date().getFullYear()}</p>
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

// Manejar creacin de nuevo proyecto
function handleNuevoProyecto(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];

    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFinalizacion').value;

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
        showNotification('La fecha de Finalizacion debe ser posterior a la fecha de inicio', 'warning');
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

    showNotification(' Proyecto creado y reporte generado exitosamente', 'success');
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

// Manejar edicin de proyecto
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

        showNotification(' Proyecto actualizado y reporte regenerado', 'success');
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
            '<p style="text-align: center; padding: 40px; color: #718096;">No tienes proyectos an</p>' :
            `<div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Titulo</th>
                                        <th>Categoria</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Fecha</th>
                                        <th>Puntuacion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${misProyectos.map(p => `
                                        <tr>
                                            <td>${p.titulo}</td>
                                            <td>${getCategoryName(p.categoria)}</td>
                                            <td>${p.tipoInvestigacion === 'aplicada' ? 'Aplicada' : 'Innovacion'}</td>
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

// Funcin auxiliar
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

    // Datos pre-cargados (si existen de una edicion anterior o del paso 1)
    const data = proyecto.paso2 || {};

    // HTML Simplificado - Solo mostrar titulo y PDF
    const modalHTML = `
        <div id="modalSegundoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Paso 2: Perfil de Proyecto</h3>
                    <button type="button" class="modal-close" onclick="cerrarModalSegundoEntregable()">&times;</button>
                </div>
                <form id="formSegundoEntregable" class="modal-body">
                    <input type="hidden" id="paso2ProyectoId" value="${proyecto.id}">

                    <div class="form-group">
                        <label><strong>1.1. Titulo del Proyecto</strong></label>
                        <input type="text" value="${proyecto.titulo}" readonly style="background:#eee; color:#555;">
                    </div>

                    <!-- SECCION PDF -->
                    <div class="form-group" style="margin-top: 20px; border: 2px dashed #ccc; padding: 20px; background: #fafafa; text-align: center;">
                        <label style="display:block; margin-bottom:10px; font-weight:bold; color:#d32f2f;">
                            Adjuntar Perfil (PDF) *
                        </label>
                        <input type="file" id="paso2PDF" accept=".pdf" required style="margin:auto;">
                        <small style="display:block; margin-top:5px; color:#666;">Maximo 2MB</small>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="cerrarModalSegundoEntregable()">Cancelar</button>
                        <button type="submit" class="btn-primary">Enviar Paso 2</button>
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

// Crear modal segundo entregable segn Categoria

// Crear modal segundo entregable segn Categoria
function crearModalSegundoEntregable(proyecto) {
    // Solo mostrar Titulo (readonly) y campo de PDF
    const camposHTML = `
        <div class="form-group">
            <label for="paso2Titulo">Titulo del Proyecto</label>
            <input type="text" id="paso2Titulo" value="${proyecto.titulo}" readonly style="background: #f7fafc; cursor: not-allowed;">
            <small style="color: #718096;"> Este campo se toma automticamente del sistema</small>
        </div>

        <div class="form-group" style="margin-top: 25px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
            <label for="paso2PDF">
                <span style="color: #f44336;">*</span> Adjuntar Perfil (PDF)
            </label>
            <input type="file" id="paso2PDF" accept=".pdf" required>
            <small style="display: block; margin-top: 8px; color: #718096;">
                 Suba el documento completo del perfil en formato PDF (Mximo 2MB)
            </small>
            <small style="display: block; color: #667eea;">
                 Debe seguir el formato APA 7ma edicin segn la estructura de su Categoria
            </small>
        </div>
    `;

    return `
        <div id="modalSegundoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3> Paso 2: Perfil de Proyecto</h3>
                    <button class="modal-close" onclick="cerrarModalSegundoEntregable()">&times;</button>
                </div>
                <form id="formSegundoEntregable" class="modal-body">
                    <input type="hidden" id="paso2ProyectoId" value="${proyecto.id}">
                    
                    <div class="alert alert-info" style="margin-bottom: 20px;">
                        <strong> Complete los datos del perfil:</strong> Llene el formulario y adjunte el documento PDF correspondiente.
                    </div>

                    ${camposHTML}

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="cerrarModalSegundoEntregable()">Cancelar</button>
                        <button type="submit" class="btn-primary">Enviar Paso 2</button>
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


// Manejar envo segundo entregable
function handleSegundoEntregable(e) {
    e.preventDefault();

    const proyectoId = document.getElementById('paso2ProyectoId').value;
    const archivoInput = document.getElementById('paso2PDF');
    const archivo = archivoInput.files[0];

    if (!archivo) {
        showNotification(' Debe adjuntar el documento PDF', 'warning');
        return;
    }

    // Validar que sea PDF
    if (archivo.type !== 'application/pdf') {
        showNotification('Solo se permiten archivos PDF', 'warning');
        return;
    }

    // Validar tamao (2MB) para evitar error de LocalStorage
    if (archivo.size > 2 * 1024 * 1024) {
        showNotification(' El archivo es muy pesado (Mximo 2MB)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const proyectos = StorageManager.getItem('proyectos') || [];
        const index = proyectos.findIndex(p => p.id === proyectoId);

        if (index !== -1) {
            const proyecto = proyectos[index];

            // Guardar datos - solo Titulo y PDF
            proyecto.paso = 2;
            proyecto.estadoPaso2 = 'pendiente';

            // Limpiar datos anteriores de Evaluacion
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

            showNotification(' Paso 2 enviado correctamente', 'success');
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
    // Solo mostrar Titulo (readonly) y opcin para reemplazar PDF
    let camposHTML = `
        <div class="form-group">
            <label for="editPaso2Titulo">Titulo del Proyecto</label>
            <input type="text" id="editPaso2Titulo" value="${proyecto.paso2.titulo}" readonly style="background: #f7fafc; cursor: not-allowed;">
            <small style="color: #718096;"> Este campo se toma automticamente del sistema</small>
        </div>
        <div class="form-group" style="margin-top: 25px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
            ${proyecto.paso2.archivoPDF ? `
                <div class="alert alert-info" style="margin-bottom: 15px;">
                    <strong> Archivo actual:</strong> ${proyecto.paso2.archivoPDF.nombre}<br>
                    <small>Tamao: ${(proyecto.paso2.archivoPDF.tamano / 1024).toFixed(2)} KB | 
                    Subido: ${formatDateShort(proyecto.paso2.archivoPDF.fechaSubida)}</small>
                </div>
            ` : ''}
            <label for="editPaso2PDF">
                ${proyecto.paso2.archivoPDF ? 'Reemplazar Documento PDF (opcional)' : 'Adjuntar Documento PDF *'}
            </label>
            <input type="file" id="editPaso2PDF" accept=".pdf" ${!proyecto.paso2.archivoPDF ? 'required' : ''}>
            <small style="display: block; margin-top: 8px; color: #718096;">
                 ${proyecto.paso2.archivoPDF ? 'Deje vaco si no desea cambiar el archivo' : 'Adjunte el documento en formato PDF (Mximo 2MB)'}
            </small>
        </div>
    `;

    return `
        <div id="modalEditarSegundoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3> Editar Paso 2: Perfil de Proyecto</h3>
                    <button class="modal-close" onclick="cerrarModalEditarSegundoEntregable()">&times;</button>
                </div>
                <form id="formEditarSegundoEntregable" class="modal-body">
                    <input type="hidden" id="editPaso2ProyectoId" value="${proyecto.id}">

                    <div class="alert alert-warning" style="margin-bottom: 20px;">
                        <strong> Correccin:</strong> Fecha lmite: ${formatDate(proyecto.fechaLimiteCorreccionPaso2)}
                    </div>

                    ${camposHTML}

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="cerrarModalEditarSegundoEntregable()">Cancelar</button>
                        <button type="submit" class="btn-primary"> Guardar Correcciones</button>
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
// Manejar creacin de nuevo proyecto

// Manejar edicin segundo entregable
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

    // Funcin para guardar los datos - solo Titulo y PDF
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

        showNotification(' Paso 2 actualizado correctamente', 'success');
        cerrarModalEditarSegundoEntregable();
        cargarProyectosCategoria();
    };

    // Si se seleccion un nuevo archivo
    if (archivo) {
        if (archivo.type !== 'application/pdf') {
            showNotification('Solo se permiten archivos PDF', 'warning');
            return;
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (archivo.size > maxSize) {
            showNotification('El archivo no debe superar los 2MB', 'warning');
            return;
        }

        showNotification('Subiendo nuevo archivo...', 'info');

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

    // 1. Determinar quPDF mostrar segn el parmetro 'paso'
    let pdf = null;

    // Si piden paso 7 y existe
    if (String(paso) === '7' && proyecto.paso7 && proyecto.paso7.archivoPDF) {
        pdf = proyecto.paso7.archivoPDF;
    }
    // Si piden paso 6 y existe
    else if (String(paso) === '6' && proyecto.paso6 && proyecto.paso6.archivoPDF) {
        pdf = proyecto.paso6.archivoPDF;
    }
    // Si no, intentamos mostrar el del Paso 2 (Default)
    else if (proyecto.paso2 && proyecto.paso2.archivoPDF) {
        pdf = proyecto.paso2.archivoPDF;
    }

    // 2. Validar si encontramos algn PDF
    if (!pdf) {
        showNotification(' No hay documento PDF disponible para esta fase', 'warning');
        return;
    }

    // 3. Generar Modal
    const modalHTML = `
        <div id="modalVisualizarPDF" class="modal active" style="display: flex;">
            <div class="modal-content modal-large" style="max-width: 90%; max-height: 95vh;">
                <div class="modal-header">
                    <h3> ${pdf.nombre}</h3>
                    <button class="modal-close" onclick="cerrarModalPDF()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div style="padding: 20px; background: #f7fafc; border-bottom: 1px solid #e2e8f0;">
                        <p style="margin: 5px 0;"><strong>Nombre:</strong> ${pdf.nombre}</p>
                        <p style="margin: 5px 0;"><strong>Tamao:</strong> ${(pdf.tamano / 1024).toFixed(2)} KB</p>
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
                         Descargar PDF
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
   FUNCIONES NUEVAS: PASO 3 (IDENTIFICACIN DE PROBLEMTICA)
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
                    <h3>III. IDENTIFICACIN DE LA PROBLEMTICA</h3>
                    <button class="modal-close" onclick="cerrarModalTercerEntregable()">&times;</button>
                </div>
                
                <form id="formTercerEntregable" class="modal-body">
                    <input type="hidden" id="paso3ProyectoId" value="${proyecto.id}">
                    
                    <!-- 2.1 Identificacin del problema -->
                    <div class="form-group">
                        <label for="identificacionProblema"><strong>2.1. Identificacin del problema (incluye causas)</strong></label>
                        <textarea id="identificacionProblema" class="form-control" rows="4" required placeholder="Describa claramente el problema y sus causas..."></textarea>
                    </div>

                    <!-- 2.2 Formulacin del problema -->
                    <div class="form-group">
                        <label for="formulacionProblema"><strong>2.2. Formulacin del problema (General y Especficos)</strong></label>
                        <textarea id="formulacionProblema" class="form-control" rows="4" required placeholder="Formule el problema general y los especficos..."></textarea>
                    </div>

                    <!-- 2.3 Objetivos -->
                    <div class="form-group">
                        <label for="objetivos"><strong>2.3. Objetivos de la Investigacion (General y Especficos)  Verbo en infinitivo</strong></label>
                        <textarea id="objetivos" class="form-control" rows="4" required placeholder="Redacte los objetivos usando verbos en infinitivo..."></textarea>
                    </div>

                    <!-- 2.4 Justificacin -->
                    <div class="form-group">
                        <label for="justificacion"><strong>2.4. Justificacin social</strong></label>
                        <textarea id="justificacion" class="form-control" rows="4" required placeholder="Explique la necesidad u oportunidad que se busca aprovechar..."></textarea>
                    </div>

                    <!-- 2.5 Limitaciones -->
                    <div class="form-group">
                        <label for="limitaciones"><strong>2.5. Limitaciones de la Investigacion</strong></label>
                        <textarea id="limitaciones" class="form-control" rows="4" required placeholder="Indique las limitaciones del estudio..."></textarea>
                    </div>

                    <!-- Botones -->
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="cerrarModalTercerEntregable()">Cancelar</button>
                        <button type="submit" class="btn-primary" style="background: #673AB7;">
                             Guardar Paso 3
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
    proyecto.estadoPaso3 = 'pendiente'; // Pasa a estado pendiente para Evaluacion
    proyecto.paso3 = {
        identificacion: document.getElementById('identificacionProblema').value,
        formulacion: document.getElementById('formulacionProblema').value,
        objetivos: document.getElementById('objetivos').value,
        justificacion: document.getElementById('justificacion').value,
        limitaciones: document.getElementById('limitaciones').value,
        fechaEnvio: new Date().toISOString()
    };

    StorageManager.setItem('proyectos', proyectos);

    showNotification(' Paso 3 guardado y enviado a revisin', 'success');
    cerrarModalTercerEntregable();
    cargarProyectosCategoria(); // Recargar la lista para ver los cambios
}

// Funcin para Editar (Si fue rechazado) - Carga los datos previos
function editarTercerEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto || !proyecto.paso3) return;

    // Llamamos a la misma funcin de subir, pero luego llenamos los campos
    subirTercerEntregable(proyectoId);

    // Llenar los campos con lo que ya exista
    setTimeout(() => {
        document.getElementById('identificacionProblema').value = proyecto.paso3.identificacion || '';
        document.getElementById('formulacionProblema').value = proyecto.paso3.formulacion || '';
        document.getElementById('objetivos').value = proyecto.paso3.objetivos || '';
        document.getElementById('justificacion').value = proyecto.paso3.justificacion || '';
        document.getElementById('limitaciones').value = proyecto.paso3.limitaciones || '';

        // Cambiar Titulo del modal para que diga "Editar"
        document.querySelector('#modalTercerEntregable h3').textContent = ' CORREGIR: III. IDENTIFICACIN DE LA PROBLEMTICA';
    }, 50);
}

// Exportar al window para que el HTML los reconozca
window.subirTercerEntregable = subirTercerEntregable;
window.cerrarModalTercerEntregable = cerrarModalTercerEntregable;
window.editarTercerEntregable = editarTercerEntregable;

/* ===========================================================
   FUNCIONES NUEVAS: PASO 4 (MARCO TERICO E HIPTESIS)
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
                    <h3>IV. MARCO TERICO E HIPTESIS</h3>
                    <button class="modal-close" onclick="document.getElementById('modalCuartoEntregable').remove()">&times;</button>
                </div>
                <form id="formCuartoEntregable" class="modal-body">
                    <input type="hidden" id="paso4ProyectoId" value="${proyecto.id}">

                    <div class="form-group">
                        <label><strong>3.1. Antecedentes del estudio</strong></label>
                        <textarea id="p4_antecedentes" class="form-control" rows="4" required></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>2.2. Bases tericas - cientficas</strong></label>
                        <textarea id="p4_bases" class="form-control" rows="4" required></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>3.3. Definicin de trminos bsicos</strong></label>
                        <textarea id="p4_definicion" class="form-control" rows="4" required></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>4.1. Cuadro de operacionalizacin de variables e indicadores</strong></label>
                        <textarea id="p4_cuadro" class="form-control" rows="4" required placeholder="Describa o copie el contenido del cuadro..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>4.2. Hiptesis (G. E.)</strong></label>
                        <textarea id="p4_hipotesis" class="form-control" rows="4" required placeholder="Si (Objetivo general), ENTONCES (probable solucin)..."></textarea>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalCuartoEntregable').remove()">Cancelar</button>
                        <button type="submit" class="btn-primary" style="background: #FF9800;"> Enviar Paso 4</button>
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
    showNotification(' Paso 4 enviado a revisin', 'success');
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
            document.querySelector('#modalCuartoEntregable h3').textContent = ' CORREGIR PASO 4';
        }
    }, 50);
}

// Exportar
window.subirCuartoEntregable = subirCuartoEntregable;
window.editarCuartoEntregable = editarCuartoEntregable;

/* ===========================================================
   FUNCIONES NUEVAS: PASO 5 (METODOLOGA)
   =========================================================== */

function subirQuintoEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    if (proyecto.estadoPaso4 !== 'aprobado') {
        showNotification('Debe aprobar el Paso 4 primero.', 'error');
        return;
    }

    // PRE-LLENADO DE DATOS (Extraer Informacion existente)
    const tipoInv = proyecto.tipoInvestigacion === 'aplicada' ? 'Investigacion Aplicada' : 'Innovacion Tecnolgica';
    // Combinar lugar y fechas para el campo "Lugar y periodo"
    const lugarPeriodo = `${proyecto.localizacion} (${formatDateShort(proyecto.fechaInicio)} - ${formatDateShort(proyecto.fechaFinalizacion)})`;
    // Intentar predecir poblacin basada en beneficiarios
    const poblacion = proyecto.beneficiarios || '';

    const modalHTML = `
        <div id="modalQuintoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>V. METODOLOGA</h3>
                    <button class="modal-close" onclick="document.getElementById('modalQuintoEntregable').remove()">&times;</button>
                </div>
                <form id="formQuintoEntregable" class="modal-body">
                    <input type="hidden" id="paso5ProyectoId" value="${proyecto.id}">

                    <div class="alert alert-info">
                         Algunos campos se han completado automticamente. Puede editarlos si es necesario.
                    </div>

                    <div class="form-group">
                        <label><strong>Tipo de Investigacion</strong></label>
                        <input type="text" id="p5_tipo" class="form-control" value="${tipoInv}" required>
                    </div>

                    <div class="form-group">
                        <label><strong>Diseo de Investigacion</strong></label>
                        <textarea id="p5_diseno" class="form-control" rows="2" required placeholder="Ej: Experimental, Cuasi-experimental, Descriptivo..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>Alcance de la Investigacion</strong></label>
                        <textarea id="p5_alcance" class="form-control" rows="2" required placeholder="Ej: Exploratorio, Descriptivo, Correlacional, Explicativo..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>Lugar y periodo de la Investigacion</strong></label>
                        <input type="text" id="p5_lugar" class="form-control" value="${lugarPeriodo}" required>
                    </div>

                    <div class="form-group">
                        <label><strong>Instrumentos de recoleccin de datos</strong></label>
                        <textarea id="p5_instrumentos" class="form-control" rows="3" required placeholder="Ej: Encuestas, Entrevistas, Fichas de observacin..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>Poblacin y muestra</strong></label>
                        <textarea id="p5_poblacion" class="form-control" rows="3" required>${poblacion}</textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>Plan de anlisis estadstico de datos</strong></label>
                        <select id="p5_analisis" class="form-control" required>
                            <option value="">-- Seleccione una opcin --</option>
                            <option value="Descriptivo">Anlisis Descriptivo</option>
                            <option value="Inferencial">Anlisis Inferencial</option>
                            <option value="Ambos">Descriptivo e Inferencial</option>
                        </select>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalQuintoEntregable').remove()">Cancelar</button>
                        <button type="submit" class="btn-primary" style="background: #00BCD4;"> Enviar Paso 5</button>
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
    showNotification(' Paso 5 enviado a revisin', 'success');
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
            document.querySelector('#modalQuintoEntregable h3').textContent = ' CORREGIR PASO 5';
        }
    }, 50);
}

window.subirQuintoEntregable = subirQuintoEntregable;
window.editarQuintoEntregable = editarQuintoEntregable;

function cargarCriteriosPaso6(proyecto) {
    const container = document.getElementById('criteriosEvaluacion');

    // Mostrar botn para ver el PDF
    const btnPDF = `
        <div style="margin-bottom:20px; padding:15px; background:#f3e5f5; border:1px solid #e1bee7; border-radius:5px;">
            <strong> Informe Final Adjunto:</strong> ${proyecto.paso6.archivoPDF.nombre}<br>
            <button type="button" onclick="visualizarPDF('${proyecto.id}', '6')" style="margin-top:10px; background:#9C27B0; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:4px;">
                 Ver Informe Completo
            </button>
        </div>
        <h3>Lista de Cotejo (Marque S si cumple)</h3>
    `;

    // Las 35 preguntas
    const preguntas = [
        // I. Datos Generales
        "1. Describe la Linea de Investigacion",
        "2. Describe los beneficiarios del proyecto directos e indirectos",
        "3. Menciona el costo del proyecto",
        "4. Explica la fuente de financiamiento",
        "5. Menciona el lugar de ejecucin",
        // II. Titulo
        "6. Refleja el contenido de la descripcin del problema",
        "7. Es concordante con las variables de estudio nivel y alcance",
        // III. Identificacin de la Problematica
        "8. Describe el problema (causas, caractersticas, consecuencias) con citas",
        "9. La formulacin del problema considera variables y dimensiones",
        "10. El objetivo general tiene relacin con el problema y Titulo",
        "11. Los objetivos especficos relacionan problemas y variables",
        "12. La justificacin social determina el beneficio a la sociedad",
        "13. Establece claramente el alcance geogrfico y temporal",
        // IV. Marco Teorico
        "14. Antecedentes son de tesis/artculos/libros especializados",
        "15. Descripcin de antecedentes resume problema, objetivo y solucin",
        "16. Presenta ideas y teoras claras relacionadas al tema",
        "17. Conceptos utilizados son de las variables y dimensiones",
        // V. Hiptesis
        "18. Hiptesis general da respuesta a priori al problema general",
        "19. Hiptesis especficas dan respuesta a problemas especficos",
        "20. Variables conceptualizadas con cita correspondiente",
        "21. Operacionalizacin: Relacin entre variables y dimensiones",
        "22. Operacionalizacin: Relacin entre dimensin e indicador",
        // VI. Metodologia
        "23. Identifica mtodo general y especfico correctamente",
        "24. Considera y fundamenta el tipo de Investigacion",
        "25. Propone nivel de Investigacion correcto",
        "26. Diseo de Investigacion acorde al nivel",
        "27. Identifica universo y mbito de Investigacion",
        "28. Determina tamao de muestra correctamente",
        "29. Describe tcnica/instrumento con confiabilidad y validez",
        "30. Describe mtodos especficos de Evaluacion de variables",
        "31. Identifica mtodos adecuados de anlisis de datos",
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
                <span class="points">S</span>
            </label>
        </div>
    `).join('');

    container.innerHTML = html;
    updateElementText('puntuacionMaxima', '35'); // Total de preguntas
}

// ===== FUNCIONES AGREGADAS PARA MANEJAR PROYECTOS =====

/* ===========================================================
   PASO 6: INFORME FINAL DE INVESTIGACIÓN
   =========================================================== */

function subirSextoEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    if (proyecto.estadoPaso5 !== 'aprobado') {
        showNotification('⚠️ Debe aprobar el Paso 5 primero', 'error');
        return;
    }

    const modalHTML = `
        <div id="modalSextoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>📄 VI. INFORME FINAL DE INVESTIGACIÓN</h3>
                    <button class="modal-close" onclick="document.getElementById('modalSextoEntregable').remove()">&times;</button>
                </div>
                <form id="formSextoEntregable" class="modal-body">
                    <input type="hidden" id="paso6ProyectoId" value="${proyecto.id}">
                    
                    <div class="alert alert-info">
                        📄 Suba su <strong>Informe Final completo</strong> en formato PDF para la revisión final.
                    </div>

                    <div class="form-group" style="padding: 20px; background: #f9f9f9; border: 2px dashed #ccc; text-align: center;">
                        <label style="display:block; margin-bottom:10px; font-weight:bold;">📎 Archivo PDF del Informe Final *</label>
                        <input type="file" id="p6_pdf" accept=".pdf" required style="margin:auto;">
                        <small style="display:block; margin-top:10px;">Máximo 2MB</small>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalSextoEntregable').remove()">Cancelar</button>
                        <button type="submit" class="btn-primary" style="background: #9C27B0;">🎓 Enviar Informe</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    const d = document.createElement('div'); d.innerHTML = modalHTML; document.body.appendChild(d.firstElementChild);
    document.getElementById('formSextoEntregable').addEventListener('submit', handleGuardarPaso6);
}

function handleGuardarPaso6(e) {
    e.preventDefault();
    const id = document.getElementById('paso6ProyectoId').value;
    const archivoInput = document.getElementById('p6_pdf');
    const archivo = archivoInput.files[0];

    if (!archivo) return showNotification('Debe subir un PDF', 'warning');

    if (archivo.type !== 'application/pdf') {
        showNotification('Solo se permiten archivos PDF', 'warning');
        return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
        showNotification('⚠️ El archivo es muy pesado (Máximo 2MB)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (ev) {
        const proyectos = StorageManager.getItem('proyectos') || [];
        const index = proyectos.findIndex(p => p.id === id);

        proyectos[index].paso = 6;
        proyectos[index].estadoPaso6 = 'pendiente';

        delete proyectos[index].comentariosPaso6;
        delete proyectos[index].puntuacionPaso6;

        proyectos[index].paso6 = {
            fechaEnvio: new Date().toISOString(),
            archivoPDF: {
                nombre: archivo.name,
                tamano: archivo.size,
                fechaSubida: new Date().toISOString(),
                contenido: ev.target.result
            }
        };

        StorageManager.setItem('proyectos', proyectos);
        showNotification('✅ Informe Final enviado exitosamente', 'success');
        document.getElementById('modalSextoEntregable').remove();
        cargarProyectosCategoria();
    };
    reader.readAsDataURL(archivo);
}

function editarSextoEntregable(id) {
    // Llamar a la misma función, será un reemplazo
    subirSextoEntregable(id);
    setTimeout(() => {
        document.querySelector('#modalSextoEntregable h3').textContent = '✏️ CORREGIR INFORME FINAL';
    }, 50);
}

window.subirSextoEntregable = subirSextoEntregable;
window.editarSextoEntregable = editarSextoEntregable;

/* ===========================================================
   PASO 7: ARTÍCULO CIENTÍFICO
   =========================================================== */

function subirSeptimoEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    if (proyecto.estadoPaso6 !== 'aprobado') {
        showNotification('⚠️ Debe tener el Informe Final (Paso 6) aprobado primero', 'error');
        return;
    }

    const modalHTML = `
        <div id="modalSeptimoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>📰 VII. ARTÍCULO CIENTÍFICO</h3>
                    <button class="modal-close" onclick="document.getElementById('modalSeptimoEntregable').remove()">&times;</button>
                </div>
                <form id="formSeptimoEntregable" class="modal-body">
                    <input type="hidden" id="paso7ProyectoId" value="${proyecto.id}">
                    
                    <div class="alert alert-info">
                        📰 Suba su <strong>Artículo Científico</strong> derivado del proyecto de investigación en formato PDF.
                        <br><br>
                        <strong>El artículo debe incluir:</strong>
                        <ul style="margin-top: 10px; text-align: left;">
                            <li>Título y autores</li>
                            <li>Resumen (Abstract)</li>
                            <li>Palabras clave</li>
                            <li>Introducción</li>
                            <li>Metodología</li>
                            <li>Resultados</li>
                            <li>Discusión</li>
                            <li>Conclusiones</li>
                            <li>Referencias bibliográficas (APA)</li>
                        </ul>
                    </div>

                    <div class="form-group" style="padding: 20px; background: #f0f7ff; border: 2px dashed #667eea; text-align: center;">
                        <label style="display:block; margin-bottom:10px; font-weight:bold;">📎 Archivo PDF del Artículo Científico *</label>
                        <input type="file" id="p7_pdf" accept=".pdf" required style="margin:auto;">
                        <small style="display:block; margin-top:10px;">Máximo 2MB</small>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalSeptimoEntregable').remove()">Cancelar</button>
                        <button type="submit" class="btn-primary" style="background: #667eea;">📤 Enviar Artículo</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    const d = document.createElement('div'); d.innerHTML = modalHTML; document.body.appendChild(d.firstElementChild);
    document.getElementById('formSeptimoEntregable').addEventListener('submit', handleGuardarPaso7);
}

function handleGuardarPaso7(e) {
    e.preventDefault();
    const id = document.getElementById('paso7ProyectoId').value;
    const archivoInput = document.getElementById('p7_pdf');
    const archivo = archivoInput.files[0];

    if (!archivo) return showNotification('Debe subir un PDF', 'warning');

    if (archivo.type !== 'application/pdf') {
        showNotification('Solo se permiten archivos PDF', 'warning');
        return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
        showNotification('⚠️ El archivo es muy pesado (Máximo 2MB)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (ev) {
        const proyectos = StorageManager.getItem('proyectos') || [];
        const index = proyectos.findIndex(p => p.id === id);

        if (index === -1) {
            showNotification('⚠️ Proyecto no encontrado', 'error');
            return;
        }

        proyectos[index].paso = 7;
        proyectos[index].estadoPaso7 = 'pendiente';

        delete proyectos[index].comentariosPaso7;
        delete proyectos[index].puntuacionPaso7;

        proyectos[index].paso7 = {
            fechaEnvio: new Date().toISOString(),
            archivoPDF: {
                nombre: archivo.name,
                tamano: archivo.size,
                fechaSubida: new Date().toISOString(),
                contenido: ev.target.result
            }
        };

        StorageManager.setItem('proyectos', proyectos);
        showNotification('✅ Artículo Científico enviado exitosamente', 'success');
        document.getElementById('modalSeptimoEntregable').remove();
        cargarProyectosCategoria();
    };
    reader.readAsDataURL(archivo);
}

function editarSeptimoEntregable(id) {
    subirSeptimoEntregable(id);
    setTimeout(() => {
        document.querySelector('#modalSeptimoEntregable h3').textContent = '✏️ CORREGIR ARTÍCULO CIENTÍFICO';
    }, 50);
}

window.subirSeptimoEntregable = subirSeptimoEntregable;
window.editarSeptimoEntregable = editarSeptimoEntregable;
