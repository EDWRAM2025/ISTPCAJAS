/* ====================================
   EVALUADOR.JS - Módulo Evaluador
   ==================================== */

let currentEvaluationCategory = null;
let currentEvaluationProject = null;
let currentPasoEvaluacion = 1;

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.includes('dashboard-evaluador')) {
        checkRole(['evaluador']);
        updateUserInfo();
        loadEvaluadorStats();
        loadPendingCounts();
    }

    if (window.location.pathname.includes('evaluar-proyecto')) {
        checkRole(['evaluador']);
        setupEvaluationForm();
    }
});

// Cargar estadísticas del evaluador
function loadEvaluadorStats() {
    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];

    // Filtramos proyectos que le tocan a este evaluador
    const evaluados = proyectos.filter(p =>
        p.evaluadorId === user.id ||
        p.evaluadorIdPaso2 === user.id ||
        p.evaluadorIdPaso3 === user.id ||
        p.evaluadorIdPaso4 === user.id
    );

    // CORREGIDO: Ahora cuenta si el Paso 4 está pendiente
    const pendientes = proyectos.filter(p =>
        p.estado === 'pendiente' ||
        p.estadoPaso2 === 'pendiente' ||
        p.estadoPaso3 === 'pendiente' ||
        p.estadoPaso4 === 'pendiente' ||
        p.estadoPaso5 === 'pendiente' ||
        p.estadoPaso6 === 'pendiente' // <--- AGREGADO
    ).length;

    // Cuenta aprobados (si la fase actual está aprobada)
    const aprobados = evaluados.filter(p =>
        (p.paso === 4 && p.estadoPaso4 === 'aprobado') ||
        (p.paso === 3 && p.estadoPaso3 === 'aprobado') ||
        (p.paso === 2 && p.estadoPaso2 === 'aprobado') ||
        (p.paso === 1 && p.estado === 'aprobado')
    ).length;

    const rechazados = evaluados.filter(p =>
        p.estado === 'rechazado' ||
        p.estadoPaso2 === 'rechazado' ||
        p.estadoPaso3 === 'rechazado' ||
        p.estadoPaso4 === 'rechazado'
    ).length;

    updateElementText('totalEvaluaciones', evaluados.length);
    updateElementText('evaluacionesPendientes', pendientes);
    updateElementText('evaluacionesAprobadas', aprobados);
    updateElementText('evaluacionesRechazadas', rechazados);
    updateElementText('pendingCount', pendientes);
}

// Cargar proyectos pendientes por categoría
function loadPendingCounts() {
    const proyectos = StorageManager.getItem('proyectos') || [];

    // CORREGIDO: Agregado p.estadoPaso4 === 'pendiente'
    const countPending = (cat) => proyectos.filter(p =>
        p.categoria === cat &&
        (
            p.estado === 'pendiente' ||
            p.estadoPaso2 === 'pendiente' ||
            p.estadoPaso3 === 'pendiente' ||
            p.estadoPaso4 === 'pendiente' ||
            p.estadoPaso5 === 'pendiente' ||
            p.estadoPaso6 === 'pendiente' // <--- AGREGADO
        )
    ).length;

    updateElementText('pending-investigacion-aplicada', countPending('investigacion-aplicada'));
    updateElementText('pending-innovacion-tecnologica', countPending('innovacion-tecnologica'));
    updateElementText('pending-innovacion-pedagogica', countPending('innovacion-pedagogica'));
}

// Abrir categoría para evaluar
function abrirCategoriaEvaluador(categoria) {
    currentEvaluationCategory = categoria;
    window.location.href = `categoria-proyectos.html?categoria=${categoria}`;
}

// Evaluar proyecto
function evaluarProyecto(proyectoId) {
    window.location.href = `evaluar-proyecto.html?id=${proyectoId}`;
}

// Cargar proyecto para evaluar
// Función principal que carga los datos y decide qué mostrar
function cargarProyectoParaEvaluar() {
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get('id');

    if (!proyectoId) {
        showNotification('Proyecto no especificado', 'error');
        setTimeout(() => volverCategoriaEvaluador(), 2000);
        return;
    }

    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto) {
        showNotification('Proyecto no encontrado', 'error');
        setTimeout(() => volverCategoriaEvaluador(), 2000);
        return;
    }

    currentEvaluationProject = proyecto;

    // 1. Determinar qué paso evaluar (prioridad: paso más reciente pendiente)
    if (proyecto.paso === 7 && proyecto.estadoPaso7 === 'pendiente') {
        currentPasoEvaluacion = 7;
    }
    else if (proyecto.paso === 6 && proyecto.estadoPaso6 === 'pendiente') {
        currentPasoEvaluacion = 6;
    }
    else if (proyecto.paso === 5 && proyecto.estadoPaso5 === 'pendiente') {
        currentPasoEvaluacion = 5;
    }
    else if (proyecto.paso === 4 && proyecto.estadoPaso4 === 'pendiente') {
        currentPasoEvaluacion = 4;
    }
    else if (proyecto.paso === 3 && proyecto.estadoPaso3 === 'pendiente') {
        currentPasoEvaluacion = 3;
    }
    else if (proyecto.paso === 2 && proyecto.estadoPaso2 === 'pendiente') {
        currentPasoEvaluacion = 2;
    }
    else if (proyecto.estado === 'pendiente') {
        currentPasoEvaluacion = 1;
    } else {
        currentPasoEvaluacion = proyecto.paso; // Modo solo lectura
    }

    // 2. ACTUALIZAR UI
    updateElementText('proyectoTitulo', proyecto.titulo);
    updateElementText('proyectoInvestigador', proyecto.investigadorNombre);
    updateElementText('proyectoFecha', formatDate(proyecto.fechaCreacion));
    updateElementText('proyectoCategoria', getCategoryName(proyecto.categoria));
    updateElementText('proyectoPaso', `Fase ${currentPasoEvaluacion}`);

    const tituloEvaluacion = document.getElementById('tituloEvaluacion');
    if (tituloEvaluacion) {
        const titulos = {
            1: 'Fase 1: Información General',
            2: 'Fase 2: Perfil de Proyecto',
            3: 'Fase 3: Problemática',
            4: 'Fase 4: Marco Teórico',
            5: 'Fase 5: Metodología',
            6: 'Fase 6: Informe Final',
            7: 'Fase 7: Artículo Científico'
        };
        tituloEvaluacion.textContent = titulos[currentPasoEvaluacion] || 'Evaluación';
    }

    document.getElementById('proyectoId').value = proyectoId;
    document.getElementById('pasoAEvaluar').value = currentPasoEvaluacion;

    // 3. CARGAR CRITERIOS
    const container = document.getElementById('criteriosEvaluacion');
    container.innerHTML = '';

    if (currentPasoEvaluacion === 1) cargarCriteriosPaso1(proyecto);
    else if (currentPasoEvaluacion === 2) cargarCriteriosPaso2(proyecto);
    else if (currentPasoEvaluacion === 3) cargarCriteriosPaso3(proyecto);
    else if (currentPasoEvaluacion === 4) cargarCriteriosPaso4(proyecto);
    else if (currentPasoEvaluacion === 5) cargarCriteriosPaso5(proyecto);
    else if (currentPasoEvaluacion === 6) cargarCriteriosPaso6(proyecto);
    else if (currentPasoEvaluacion === 7) cargarCriteriosPaso7(proyecto);
}

// Cargar criterios Paso 1
function cargarCriteriosPaso1(proyecto) {
    const criteriosContainer = document.getElementById('criteriosEvaluacion');

    const criterios = [
        { titulo: 'Título del Proyecto', valor: proyecto.titulo, puntos: 10 },
        { titulo: 'Tipo de Investigación', valor: proyecto.tipoInvestigacion === 'aplicada' ? 'Aplicada' : 'Innovación', puntos: 10 },
        { titulo: 'Línea de Investigación', valor: formatLineaInvestigacion(proyecto.lineaInvestigacion), puntos: 15 },
        { titulo: 'Integrantes del Proyecto', valor: proyecto.integrantes, puntos: 10 },
        { titulo: 'Objetivo del Proyecto', valor: proyecto.objetivoProyecto, puntos: 25 },
        { titulo: 'Beneficiarios', valor: proyecto.beneficiarios, puntos: 10 },
        { titulo: 'Localización', valor: proyecto.localizacion, puntos: 10 },
        { titulo: 'Fechas de Ejecución', valor: `Inicio: ${formatDate(proyecto.fechaInicio)} - Fin: ${formatDate(proyecto.fechaFinalizacion)}`, puntos: 10 }
    ];

    criteriosContainer.innerHTML = criterios.map((criterio, index) => `
        <div class="criterion-item">
            <div class="criterion-content">
                <h4>${criterio.titulo}</h4>
                <p class="criterion-value">${criterio.valor}</p>
            </div>
            <label class="checkbox-container">
                <input type="checkbox" name="eval-criterio-${index}" value="${criterio.puntos}">
                <span class="checkmark"></span>
                <span class="points">${criterio.puntos} pts</span>
            </label>
        </div>
    `).join('');
}

// Cargar criterios Paso 2
function cargarCriteriosPaso2(proyecto) {
    const criteriosContainer = document.getElementById('criteriosEvaluacion');

    if (!proyecto.paso2) {
        criteriosContainer.innerHTML = '<p style="color: red;">Error: No se encontraron datos del Paso 2</p>';
        return;
    }
    function cargarCriteriosPaso3(proyecto) {
        const criteriosContainer = document.getElementById('criteriosEvaluacion');

        if (!proyecto.paso3) {
            criteriosContainer.innerHTML = '<p style="color: red;">Error: No se encontraron datos del Paso 3</p>';
            return;
        }

        // 5 Criterios de 20 puntos cada uno
        const criterios = [
            {
                titulo: '2.1. Identificación del Problema',
                valor: proyecto.paso3.identificacion,
                puntos: 20,
                desc: 'Claridad en la descripción del problema y sus causas.'
            },
            {
                titulo: '2.2. Formulación del Problema',
                valor: proyecto.paso3.formulacion,
                puntos: 20,
                desc: 'Correcta formulación general y específica.'
            },
            {
                titulo: '2.3. Objetivos',
                valor: proyecto.paso3.objetivos,
                puntos: 20,
                desc: 'Uso de verbos en infinitivo y coherencia.'
            },
            {
                titulo: '2.4. Justificación Social',
                valor: proyecto.paso3.justificacion,
                puntos: 20,
                desc: 'Relevancia y necesidad del proyecto.'
            },
            {
                titulo: '2.5. Limitaciones',
                valor: proyecto.paso3.limitaciones,
                puntos: 20,
                desc: 'Identificación clara de las limitaciones.'
            }
        ];

        criteriosContainer.innerHTML = criterios.map((criterio, index) => `
        <div class="criterion-item">
            <div class="criterion-content">
                <h4>${criterio.titulo}</h4>
                <p class="criterion-value" style="white-space: pre-wrap;">${criterio.valor}</p>
                <small style="color:#666;">${criterio.desc || ''}</small>
            </div>
            <label class="checkbox-container">
                <input type="checkbox" name="eval-criterio-${index}" value="${criterio.puntos}">
                <span class="checkmark"></span>
                <span class="points">${criterio.puntos} pts</span>
            </label>
        </div>
    `).join('');

        // Actualizar puntuación máxima visual
        const puntuacionMaxima = criterios.reduce((sum, c) => sum + c.puntos, 0);
        updateElementText('puntuacionMaxima', puntuacionMaxima);
    }

    // Criterios comunes para todas las categorías
    const criteriosComunes = [
        { id: '1.1', titulo: '1.1. Título del Proyecto', valor: proyecto.paso2.titulo, puntos: 10 },
        { id: '1.2', titulo: '1.2. Investigador(es)', valor: proyecto.paso2.investigadores, puntos: 10 },
        { id: '1.3', titulo: '1.3. Programa(s) de Estudios', valor: proyecto.paso2.programa, puntos: 12 },
        { id: '1.4', titulo: '1.4. Línea de Investigación', valor: proyecto.paso2.lineaInvestigacion, puntos: 12 },
        { id: '1.5', titulo: '1.5. Número de Beneficiarios', valor: proyecto.paso2.beneficiarios, puntos: 15 },
        { id: '1.6', titulo: '1.6. Costo del Proyecto', valor: proyecto.paso2.costo, puntos: 13 },
        { id: '1.7', titulo: '1.7. Lugar de Ejecución', valor: proyecto.paso2.lugar, puntos: 13 },
        { id: '1.8', titulo: '1.8. Fuente de Financiamiento', valor: proyecto.paso2.financiamiento, puntos: 15 }
    ];

    let criterios = [...criteriosComunes];

    // Agregar criterio 1.9 solo para Innovación Tecnológica
    if (proyecto.categoria === 'innovacion-tecnologica') {
        criterios.push({
            id: '1.9',
            titulo: '1.9. Correo Institucional del Investigador',
            valor: proyecto.paso2.correo || 'No especificado',
            puntos: 10
        });

        // Ajustar puntos para que sumen 100
        criterios = [
            { id: '1.1', titulo: '1.1. Título del Proyecto', valor: proyecto.paso2.titulo, puntos: 10 },
            { id: '1.2', titulo: '1.2. Investigador(es)', valor: proyecto.paso2.investigadores, puntos: 10 },
            { id: '1.3', titulo: '1.3. Programa(s) de Estudios', valor: proyecto.paso2.programa, puntos: 11 },
            { id: '1.4', titulo: '1.4. Línea de Investigación', valor: proyecto.paso2.lineaInvestigacion, puntos: 11 },
            { id: '1.5', titulo: '1.5. Número de Beneficiarios', valor: proyecto.paso2.beneficiarios, puntos: 13 },
            { id: '1.6', titulo: '1.6. Costo del Proyecto', valor: proyecto.paso2.costo, puntos: 12 },
            { id: '1.7', titulo: '1.7. Lugar de Ejecución', valor: proyecto.paso2.lugar, puntos: 11 },
            { id: '1.8', titulo: '1.8. Fuente de Financiamiento', valor: proyecto.paso2.financiamiento, puntos: 12 },
            { id: '1.9', titulo: '1.9. Correo Institucional', valor: proyecto.paso2.correo, puntos: 10 }
        ];
    }

    criteriosContainer.innerHTML = criterios.map((criterio, index) => `
        <div class="criterion-item">
            <div class="criterion-content">
                <h4>${criterio.titulo}</h4>
                <p class="criterion-value">${criterio.valor}</p>
            </div>
            <label class="checkbox-container">
                <input type="checkbox" name="eval-criterio-${index}" value="${criterio.puntos}">
                <span class="checkmark"></span>
                <span class="points">${criterio.puntos} pts</span>
            </label>
        </div>
    `).join('');

    // Actualizar puntuación máxima
    const puntuacionMaxima = criterios.reduce((sum, c) => sum + c.puntos, 0);
    updateElementText('puntuacionMaxima', puntuacionMaxima);
}

// Cargar criterios Paso 3 (NUEVO)
function cargarCriteriosPaso3(proyecto) {
    const criteriosContainer = document.getElementById('criteriosEvaluacion');

    if (!proyecto.paso3) {
        criteriosContainer.innerHTML = '<p style="color: red;">Error: No se encontraron datos del Paso 3</p>';
        return;
    }

    // 5 Criterios de 20 puntos cada uno = 100 puntos
    const criterios = [
        {
            titulo: '2.1. Identificación del Problema',
            valor: proyecto.paso3.identificacion,
            puntos: 20,
            desc: 'Claridad en la descripción del problema y sus causas.'
        },
        {
            titulo: '2.2. Formulación del Problema',
            valor: proyecto.paso3.formulacion,
            puntos: 20,
            desc: 'Correcta formulación general y específica.'
        },
        {
            titulo: '2.3. Objetivos',
            valor: proyecto.paso3.objetivos,
            puntos: 20,
            desc: 'Uso de verbos en infinitivo y coherencia.'
        },
        {
            titulo: '2.4. Justificación Social',
            valor: proyecto.paso3.justificacion,
            puntos: 20,
            desc: 'Relevancia y necesidad del proyecto.'
        },
        {
            titulo: '2.5. Limitaciones',
            valor: proyecto.paso3.limitaciones,
            puntos: 20,
            desc: 'Identificación clara de las limitaciones.'
        }
    ];

    criteriosContainer.innerHTML = criterios.map((criterio, index) => `
        <div class="criterion-item">
            <div class="criterion-content">
                <h4>${criterio.titulo}</h4>
                <p class="criterion-value" style="white-space: pre-wrap;">${criterio.valor}</p>
                <small style="color:#666;">${criterio.desc}</small>
            </div>
            <label class="checkbox-container">
                <input type="checkbox" name="eval-criterio-${index}" value="${criterio.puntos}">
                <span class="checkmark"></span>
                <span class="points">${criterio.puntos} pts</span>
            </label>
        </div>
    `).join('');

    // Actualizar puntuación máxima visual
    const puntuacionMaxima = criterios.reduce((sum, c) => sum + c.puntos, 0);
    updateElementText('puntuacionMaxima', puntuacionMaxima);
}

function cargarCriteriosPaso4(proyecto) {
    const criteriosContainer = document.getElementById('criteriosEvaluacion');

    // Verificación de seguridad
    if (!proyecto.paso4) {
        criteriosContainer.innerHTML = '<div class="alert alert-danger">Error: No se encontraron los datos del Paso 4.</div>';
        return;
    }

    // Definición de los 5 criterios (20 puntos cada uno = 100)
    const criterios = [
        {
            titulo: '3.1. Antecedentes del estudio',
            valor: proyecto.paso4.antecedentes,
            puntos: 20
        },
        {
            titulo: '2.2. Bases teóricas - científicas',
            valor: proyecto.paso4.bases,
            puntos: 20
        },
        {
            titulo: '3.3. Definición de términos básicos',
            valor: proyecto.paso4.definicion,
            puntos: 20
        },
        {
            titulo: '4.1. Cuadro de operacionalización',
            valor: proyecto.paso4.cuadro,
            puntos: 20
        },
        {
            titulo: '4.2. Hipótesis (G. E.)',
            valor: proyecto.paso4.hipotesis,
            puntos: 20
        }
    ];

    // Renderizar en pantalla
    renderCriterios(criteriosContainer, criterios);
}

function cargarCriteriosPaso5(proyecto) {
    const container = document.getElementById('criteriosEvaluacion');
    if (!proyecto.paso5) return container.innerHTML = '<p class="error">Sin datos Paso 5</p>';

    const criterios = [
        { titulo: 'Tipo de investigación', valor: proyecto.paso5.tipo, puntos: 10 },
        { titulo: 'Diseño de investigación', valor: proyecto.paso5.diseno, puntos: 15 },
        { titulo: 'Alcance de la investigación', valor: proyecto.paso5.alcance, puntos: 15 },
        { titulo: 'Lugar y periodo', valor: proyecto.paso5.lugar, puntos: 15 },
        { titulo: 'Instrumentos de recolección', valor: proyecto.paso5.instrumentos, puntos: 15 },
        { titulo: 'Población y muestra', valor: proyecto.paso5.poblacion, puntos: 15 },
        { titulo: 'Plan de análisis (Descriptivo/Inferencial)', valor: proyecto.paso5.analisis, puntos: 15 }
    ];
    // Total 100 pts
    renderCriterios(container, criterios);
}
// Formatear línea de investigación
function formatLineaInvestigacion(linea) {
    const nombres = {
        'ingenieria-sistemas': 'Ingeniería de Sistemas',
        'ingenieria-industrial': 'Ingeniería Industrial',
        'administracion': 'Administración de Empresas',
        'contabilidad': 'Contabilidad',
        'derecho': 'Derecho',
        'medicina': 'Medicina',
        'enfermeria': 'Enfermería',
        'arquitectura': 'Arquitectura',
        'educacion': 'Educación',
        'psicologia': 'Psicología'
    };
    return nombres[linea] || linea;
}

// Configurar formulario de evaluación
function setupEvaluationForm() {
    // El setup se hará después de cargar los criterios
    setTimeout(() => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][name^="eval-"]');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                calcularPuntuacion();
            });
        });

        // Form submit
        const form = document.getElementById('formEvaluacion');
        if (form) {
            form.addEventListener('submit', handleEvaluacion);
        }

        // Configurar fecha mínima
        const fechaInput = document.getElementById('fechaLimiteCorreccion');
        if (fechaInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            fechaInput.min = tomorrow.toISOString().split('T')[0];
        }
    }, 500);
}

// Calcular puntuación
function calcularPuntuacion() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name^="eval-"]');
    let total = 0;
    let maxPuntos = 0;

    checkboxes.forEach(checkbox => {
        maxPuntos += parseInt(checkbox.value);
        if (checkbox.checked) {
            total += parseInt(checkbox.value);
        }
    });

    // Actualizar display
    updateElementText('puntuacionTotal', total);

    // Determinar estado
    const estadoElement = document.getElementById('estadoEvaluacion');
    const fechaLimiteSection = document.getElementById('fechaLimiteSection');
    const fechaInput = document.getElementById('fechaLimiteCorreccion');

    // Umbral de aprobación: 70%
    const umbralAprobacion = Math.ceil(maxPuntos * 0.7);

    if (total >= umbralAprobacion) {
        estadoElement.textContent = '✓ APROBADO';
        estadoElement.style.color = '#4CAF50';
        if (fechaLimiteSection) {
            fechaLimiteSection.style.display = 'none';
            if (fechaInput) fechaInput.removeAttribute('required');
        }
    } else {
        estadoElement.textContent = '✗ RECHAZADO - Debe establecer fecha límite';
        estadoElement.style.color = '#f44336';
        if (fechaLimiteSection) {
            fechaLimiteSection.style.display = 'block';
            if (fechaInput) fechaInput.setAttribute('required', 'required');
        }
    }

    return total;
}

// Manejar envío de evaluación
function handleEvaluacion(e) {
    e.preventDefault();

    const proyectoId = document.getElementById('proyectoId').value;
    const pasoAEvaluar = parseInt(document.getElementById('pasoAEvaluar').value);
    const puntuacion = calcularPuntuacion();
    const comentarios = document.getElementById('comentariosEvaluador').value.trim();
    const user = getCurrentUser();

    const proyectos = StorageManager.getItem('proyectos') || [];
    const index = proyectos.findIndex(p => p.id === proyectoId);

    if (index === -1) {
        showNotification('Proyecto no encontrado', 'error');
        return;
    }

    // Calcular umbral de aprobación (70% de la puntuación máxima)
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name^="eval-"]');
    let maxPuntos = 0;
    checkboxes.forEach(checkbox => {
        maxPuntos += parseInt(checkbox.value);
    });

    const umbralAprobacion = Math.ceil(maxPuntos * 0.7);
    const estado = puntuacion >= umbralAprobacion ? 'aprobado' : 'rechazado';

    // Si está rechazado, validar fecha límite
    let fechaLimite = null;
    if (estado === 'rechazado') {
        fechaLimite = document.getElementById('fechaLimiteCorreccion').value;

        if (!fechaLimite) {
            showNotification('⚠️ Por favor, establece una fecha límite para la corrección', 'warning');
            document.getElementById('fechaLimiteCorreccion').focus();
            return;
        }

        const fechaSeleccionada = new Date(fechaLimite);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaSeleccionada <= hoy) {
            showNotification('⚠️ La fecha límite debe ser posterior a hoy', 'warning');
            document.getElementById('fechaLimiteCorreccion').focus();
            return;
        }
    }

    const nombreEvaluador = `${user.nombre} ${user.apellido}`;
    const fechaHoy = new Date().toISOString();

    // --- GUARDADO SEGÚN EL PASO (CORREGIDO) ---

    // 1. GUARDAR PASO 1
    if (pasoAEvaluar === 1) {
        proyectos[index].puntuacion = puntuacion;
        proyectos[index].estado = estado;
        proyectos[index].comentarios = comentarios;
        proyectos[index].evaluadorId = user.id;
        proyectos[index].evaluadorNombre = nombreEvaluador;
        proyectos[index].fechaEvaluacion = fechaHoy;

        if (estado === 'rechazado') {
            proyectos[index].fechaLimiteCorreccion = fechaLimite;
        }
    }
    // 2. GUARDAR PASO 2
    else if (pasoAEvaluar === 2) {
        proyectos[index].puntuacionPaso2 = puntuacion;
        proyectos[index].estadoPaso2 = estado;
        proyectos[index].comentariosPaso2 = comentarios;
        proyectos[index].evaluadorIdPaso2 = user.id;
        proyectos[index].evaluadorNombrePaso2 = nombreEvaluador;
        proyectos[index].fechaEvaluacionPaso2 = fechaHoy;

        if (estado === 'rechazado') {
            proyectos[index].fechaLimiteCorreccionPaso2 = fechaLimite;
        }
    }
    // 3. GUARDAR PASO 3
    else if (pasoAEvaluar === 3) {
        proyectos[index].puntuacionPaso3 = puntuacion;
        proyectos[index].estadoPaso3 = estado;
        proyectos[index].comentariosPaso3 = comentarios;
        proyectos[index].evaluadorIdPaso3 = user.id;
        proyectos[index].evaluadorNombrePaso3 = nombreEvaluador;
        proyectos[index].fechaEvaluacionPaso3 = fechaHoy;

        if (estado === 'rechazado') {
            proyectos[index].fechaLimiteCorreccionPaso3 = fechaLimite;
        }
    }

    else if (pasoAEvaluar === 4) {
        proyectos[index].puntuacionPaso4 = puntuacion;
        proyectos[index].estadoPaso4 = estado;
        proyectos[index].comentariosPaso4 = comentarios;
        proyectos[index].evaluadorIdPaso4 = user.id;
        proyectos[index].evaluadorNombrePaso4 = `${user.nombre} ${user.apellido}`;
        proyectos[index].fechaEvaluacionPaso4 = new Date().toISOString();
        if (estado === 'rechazado') proyectos[index].fechaLimiteCorreccionPaso4 = fechaLimite;
    }
    // NUEVO BLOQUE PASO 5
    else if (pasoAEvaluar === 5) {
        proyectos[index].puntuacionPaso5 = puntuacion;
        proyectos[index].estadoPaso5 = estado;
        proyectos[index].comentariosPaso5 = comentarios;
        proyectos[index].evaluadorIdPaso5 = user.id;
        proyectos[index].evaluadorNombrePaso5 = `${user.nombre} ${user.apellido}`;
        proyectos[index].fechaEvaluacionPaso5 = new Date().toISOString();
        if (estado === 'rechazado') proyectos[index].fechaLimiteCorreccionPaso5 = fechaLimite;
    }

    else if (pasoAEvaluar === 6) {
        proyectos[index].puntuacionPaso6 = puntuacion;
        proyectos[index].estadoPaso6 = estado;
        proyectos[index].comentariosPaso6 = comentarios;
        proyectos[index].evaluadorIdPaso6 = user.id;
        proyectos[index].evaluadorNombrePaso6 = `${user.nombre} ${user.apellido}`;
        proyectos[index].fechaEvaluacionPaso6 = new Date().toISOString();
        if (estado === 'rechazado') proyectos[index].fechaLimiteCorreccionPaso6 = fechaLimite;
    }
    // NUEVO: PASO 7 - ARTÍCULO CIENTÍFICO
    else if (pasoAEvaluar === 7) {
        proyectos[index].puntuacionPaso7 = puntuacion;
        proyectos[index].estadoPaso7 = estado;
        proyectos[index].comentariosPaso7 = comentarios;
        proyectos[index].evaluadorIdPaso7 = user.id;
        proyectos[index].evaluadorNombrePaso7 = `${user.nombre} ${user.apellido}`;
        proyectos[index].fechaEvaluacionPaso7 = new Date().toISOString();
        if (estado === 'rechazado') proyectos[index].fechaLimiteCorreccionPaso7 = fechaLimite;
    }

    StorageManager.setItem('proyectos', proyectos);

    // Mensaje dinámico corregido
    const mensajePaso = `Fase ${pasoAEvaluar}`;
    showNotification(
        `✓ ${mensajePaso} ${estado === 'aprobado' ? 'aprobada' : 'rechazada'} correctamente`,
        estado === 'aprobado' ? 'success' : 'info'
    );

    setTimeout(() => {
        volverCategoriaEvaluador();
    }, 2000);



}

// Ver mis evaluaciones
function verMisEvaluaciones(e) {
    if (e) e.preventDefault();

    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];
    const misEvaluaciones = proyectos.filter(p =>
        p.evaluadorId === user.id || p.evaluadorIdPaso2 === user.id
    );

    let modalHTML = `
        <div id="modalMisEvaluaciones" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Mis Evaluaciones</h3>
                    <button class="modal-close" onclick="cerrarModalMisEvaluaciones()">&times;</button>
                </div>
                <div class="modal-body">
                    ${misEvaluaciones.length === 0 ?
            '<p style="text-align: center; padding: 40px; color: #718096;">No has evaluado proyectos aún</p>' :
            `<div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Investigador</th>
                                        <th>Categoría</th>
                                        <th>Paso 1</th>
                                        <th>Paso 2</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${misEvaluaciones.map(p => `
                                        <tr>
                                            <td>${p.titulo}</td>
                                            <td>${p.investigadorNombre}</td>
                                            <td>${getCategoryName(p.categoria)}</td>
                                            <td>
                                                ${p.evaluadorId === user.id ?
                    `${getStatusBadge(p.estado)}<br><small>${p.puntuacion}/100</small>` :
                    '-'
                }
                                            </td>
                                            <td>
                                                ${p.evaluadorIdPaso2 === user.id ?
                    `${getStatusBadge(p.estadoPaso2)}<br><small>${p.puntuacionPaso2}/100</small>` :
                    '-'
                }
                                            </td>
                                            <td>${formatDateShort(p.fechaEvaluacion || p.fechaEvaluacionPaso2)}</td>
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

// Cerrar modal evaluaciones
function cerrarModalMisEvaluaciones() {
    const modal = document.getElementById('modalMisEvaluaciones');
    if (modal) {
        modal.remove();
    }
}

// Volver a categoría
function volverCategoriaEvaluador() {
    if (currentEvaluationProject) {
        window.location.href = `categoria-proyectos.html?categoria=${currentEvaluationProject.categoria}`;
    } else {
        window.location.href = 'dashboard-evaluador.html';
    }
}

// Función auxiliar
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Exportar funciones
window.abrirCategoriaEvaluador = abrirCategoriaEvaluador;
window.evaluarProyecto = evaluarProyecto;
window.cargarProyectoParaEvaluar = cargarProyectoParaEvaluar;
window.verMisEvaluaciones = verMisEvaluaciones;
window.cerrarModalMisEvaluaciones = cerrarModalMisEvaluaciones;
window.volverCategoriaEvaluador = volverCategoriaEvaluador;


// Función auxiliar para dibujar el HTML de los criterios
function renderCriterios(container, criterios) {
    container.innerHTML = criterios.map((c, i) => `
        <div class="criterion-item">
            <div class="criterion-content">
                <h4>${c.titulo}</h4>
                <p class="criterion-value" style="white-space: pre-wrap;">${c.valor}</p>
            </div>
            <label class="checkbox-container">
                <input type="checkbox" name="eval-criterio-${i}" value="${c.puntos}">
                <span class="checkmark"></span>
                <span class="points">${c.puntos} pts</span>
            </label>
        </div>
    `).join('');

    const max = criterios.reduce((sum, c) => sum + c.puntos, 0);
    updateElementText('puntuacionMaxima', max);
}

/* ===========================================================
   FUNCIONES NUEVAS: PASO 6 (INFORME FINAL)
   =========================================================== */

function subirSextoEntregable(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    const modalHTML = `
        <div id="modalSextoEntregable" class="modal active" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>VI. INFORME FINAL DE INVESTIGACIÓN</h3>
                    <button class="modal-close" onclick="document.getElementById('modalSextoEntregable').remove()">&times;</button>
                </div>
                <form id="formSextoEntregable" class="modal-body">
                    <input type="hidden" id="paso6ProyectoId" value="${proyecto.id}">
                    
                    <div class="alert alert-info">
                        📄 Suba su <strong>Informe Final completo</strong> en formato PDF para la revisión final.
                    </div>

                    <div class="form-group" style="padding: 20px; background: #f9f9f9; border: 2px dashed #ccc; text-align: center;">
                        <label style="display:block; margin-bottom:10px; font-weight:bold;">Archivo PDF del Informe Final *</label>
                        <input type="file" id="p6_pdf" accept=".pdf" required style="margin:auto;">
                        <small style="display:block; margin-top:10px;">Máximo 10MB</small>
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

    // Convertir PDF a Base64
    const reader = new FileReader();
    reader.onload = function (ev) {
        const proyectos = StorageManager.getItem('proyectos') || [];
        const index = proyectos.findIndex(p => p.id === id);

        proyectos[index].paso = 6;
        proyectos[index].estadoPaso6 = 'pendiente';

        // Limpiar datos previos
        delete proyectos[index].comentariosPaso6;
        delete proyectos[index].puntuacionPaso6;

        proyectos[index].paso6 = {
            fechaEnvio: new Date().toISOString(),
            archivoPDF: {
                nombre: archivo.name,
                contenido: ev.target.result // Base64
            }
        };

        StorageManager.setItem('proyectos', proyectos);
        showNotification('✓ Informe Final enviado exitosamente', 'success');
        document.getElementById('modalSextoEntregable').remove();
        cargarProyectosCategoria();
    };
    reader.readAsDataURL(archivo);
}

function editarSextoEntregable(id) {
    subirSextoEntregable(id);
    setTimeout(() => {
        document.querySelector('#modalSextoEntregable h3').textContent = '✏️ CORREGIR INFORME FINAL';
    }, 50);
}

// Exportar
window.subirSextoEntregable = subirSextoEntregable;
window.editarSextoEntregable = editarSextoEntregable;
// --- FUNCIÓN FALTANTE PARA MOSTRAR EL FORMULARIO DEL PASO 6 ---
function cargarCriteriosPaso6(proyecto) {
    const container = document.getElementById('criteriosEvaluacion');

    // Verificación de seguridad
    if (!proyecto.paso6 || !proyecto.paso6.archivoPDF) {
        container.innerHTML = '<div class="alert alert-danger">Error: No se encontró el archivo del Informe Final.</div>';
        return;
    }

    // Botón para ver el PDF dentro de la evaluación
    const btnPDF = `
        <div style="margin-bottom:20px; padding:15px; background:#f3e5f5; border:1px solid #e1bee7; border-radius:5px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <strong>📄 Informe Final Adjunto:</strong> <br>
                    <span style="font-size:0.9em; color:#666;">${proyecto.paso6.archivoPDF.nombre}</span>
                </div>
                <button type="button" onclick="visualizarPDF('${proyecto.id}', '6')" style="background:#9C27B0; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:4px; font-weight:bold;">
                    👁️ Ver PDF
                </button>
            </div>
        </div>
        <h4 style="margin-bottom:15px; border-bottom:2px solid #eee; padding-bottom:10px;">Lista de Cotejo (35 Puntos)</h4>
    `;

    // Las 35 preguntas que solicitaste
    const preguntas = [
        "1. Describe la línea de investigación",
        "2. Describe los beneficiarios del proyecto directos e indirectos",
        "3. Menciona el costo del proyecto",
        "4. Explica la fuente de financiamiento",
        "5. Menciona el lugar de ejecución",
        "6. Refleja el contenido de la descripción del problema",
        "7. Es concordante con las variables de estudio nivel y alcance",
        "8. Describe el problema (causas, características, consecuencias) con citas",
        "9. La formulación del problema considera variables y dimensiones",
        "10. El objetivo general tiene relación con el problema y título",
        "11. Los objetivos específicos relacionan problemas y variables",
        "12. La justificación social determina el beneficio a la sociedad",
        "13. Establece claramente el alcance geográfico y temporal",
        "14. Antecedentes son de tesis/artículos/libros especializados",
        "15. Descripción de antecedentes resume problema, objetivo y solución",
        "16. Presenta ideas y teorías claras relacionadas al tema",
        "17. Conceptos utilizados son de las variables y dimensiones",
        "18. Hipótesis general da respuesta a priori al problema general",
        "19. Hipótesis específicas dan respuesta a problemas específicos",
        "20. Variables conceptualizadas con cita correspondiente",
        "21. Operacionalización: Relación entre variables y dimensiones",
        "22. Operacionalización: Relación entre dimensión e indicador",
        "23. Identifica método general y específico correctamente",
        "24. Considera y fundamenta el tipo de investigación",
        "25. Propone nivel de investigación correcto",
        "26. Diseño de investigación acorde al nivel",
        "27. Identifica universo y ámbito de investigación",
        "28. Determina tamaño de muestra correctamente",
        "29. Describe técnica/instrumento con confiabilidad y validez",
        "30. Describe métodos específicos de evaluación de variables",
        "31. Identifica métodos adecuados de análisis de datos",
        "32. Cronograma establece acciones para cumplir objetivos",
        "33. Establece el presupuesto del proyecto",
        "34. Referencias establecidas de acuerdo a normas APA",
        "35. Considera anexos exigidos en orden"
    ];

    // Generar HTML de la lista de cotejo (Cada check vale 1 punto)
    // Nota: Usamos un estilo más compacto porque son muchas preguntas
    let listaHTML = preguntas.map((p, i) => `
        <div class="criterion-item" style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; display:flex; align-items:center; justify-content:space-between;">
            <div style="flex:1; font-size:0.85em; padding-right:10px;">${p}</div>
            <label class="checkbox-container" style="margin:0;">
                <input type="checkbox" name="eval-criterio-${i}" value="1"> <!-- Valor 1 punto -->
                <span class="checkmark"></span>
            </label>
        </div>
    `).join('');

    container.innerHTML = btnPDF + listaHTML;

    // Actualizar puntuación máxima visual
    updateElementText('puntuacionMaxima', '35');
}

// --- FUNCIÓN PARA VER PDF (Soporta Paso 2 y Paso 6) ---
function visualizarPDF(proyectoId, paso) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(pr => pr.id === proyectoId);

    if (!proyecto) {
        showNotification('Proyecto no encontrado', 'error');
        return;
    }

    // 1. Determinar qué PDF buscar
    let pdf = null;
    let tituloFase = "";

    // Convertimos a string por seguridad
    const pasoStr = String(paso);

    if (pasoStr === '7') {
        if (proyecto.paso7 && proyecto.paso7.archivoPDF) {
            pdf = proyecto.paso7.archivoPDF;
            tituloFase = "Artículo Científico";
        }
    } else if (pasoStr === '6') {
        if (proyecto.paso6 && proyecto.paso6.archivoPDF) {
            pdf = proyecto.paso6.archivoPDF;
            tituloFase = "Informe Final";
        }
    } else {
        // Por defecto busca en paso 2 (Perfil)
        if (proyecto.paso2 && proyecto.paso2.archivoPDF) {
            pdf = proyecto.paso2.archivoPDF;
            tituloFase = "Perfil de Proyecto";
        }
    }

    // 2. Si no hay PDF, mostrar error
    if (!pdf) {
        showNotification('❌ No hay documento PDF disponible para esta fase', 'warning');
        return;
    }

    // 3. Generar el Modal de visualización
    const modalHTML = `
        <div id="modalVisualizarPDF" class="modal active" style="display: flex;">
            <div class="modal-content modal-large" style="max-width: 90%; max-height: 95vh;">
                <div class="modal-header">
                    <h3>📄 ${tituloFase}: ${pdf.nombre}</h3>
                    <button type="button" class="modal-close" onclick="document.getElementById('modalVisualizarPDF').remove()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div style="padding: 15px; background: #f7fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.9em;">
                        <strong>Archivo:</strong> ${pdf.nombre} <br>
                        <strong>Tamaño:</strong> ${(pdf.tamano / 1024).toFixed(2)} KB <br>
                        <strong>Fecha:</strong> ${formatDate(pdf.fechaSubida || new Date())}
                    </div>
                    <div style="height: 70vh; overflow: hidden; background: #525659;">
                        <iframe 
                            src="${pdf.contenido}" 
                            style="width: 100%; height: 100%; border: none;"
                            type="application/pdf"
                        ></iframe>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('modalVisualizarPDF').remove()">Cerrar</button>
                    <a href="${pdf.contenido}" download="${pdf.nombre}" class="btn-primary" style="text-decoration: none;">
                        💾 Descargar
                    </a>
                </div>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
}

// Asegurar que la función sea global para que el onclick del HTML la encuentre
window.visualizarPDF = visualizarPDF;

/* ===========================================================
   FUNCIONES DE EVALUACIÓN - PASO 7 (ARTÍCULO CIENTÍFICO)
   =========================================================== */

function cargarCriteriosPaso7(proyecto) {
    const container = document.getElementById('criteriosEvaluacion');

    // Verificación de seguridad
    if (!proyecto.paso7 || !proyecto.paso7.archivoPDF) {
        container.innerHTML = '<div class="alert alert-danger">❌ Error: No se encontró el artículo científico.</div>';
        return;
    }

    // Botón para ver el PDF
    const btnPDF = `
        <div style="margin-bottom:20px; padding:15px; background:#f0f7ff; border:1px solid #667eea; border-radius:5px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <strong>📰 Artículo Científico Adjunto:</strong> <br>
                    <span style="font-size:0.9em; color:#666;">${proyecto.paso7.archivoPDF.nombre}</span>
                </div>
                <button type="button" onclick="visualizarPDF('${proyecto.id}', '7')" style="background:#667eea; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:4px; font-weight:bold;">
                    👁️ Ver Artículo PDF
                </button>
            </div>
        </div>
        <h4 style="margin-bottom:15px; border-bottom:2px solid #eee; padding-bottom:10px;">Criterios de Evaluación del Artículo Científico</h4>
    `;

    // Criterios de evaluación del artículo (cada uno vale puntos específicos para sumar 100)
    const criterios = [
        {
            titulo: '1. Título del Artículo',
            desc: 'Es claro, conciso y refleja el contenido del artículo',
            puntos: 10
        },
        {
            titulo: '2. Resumen (Abstract)',
            desc: 'Presenta problema, metodología, resultados y conclusiones de manera concisa',
            puntos: 10
        },
        {
            titulo: '3. Palabras Clave',
            desc: 'Son relevantes y facilitan la búsqueda del artículo',
            puntos: 5
        },
        {
            titulo: '4. Introducción',
            desc: 'Presenta el problema, justificación y objetivos claramente',
            puntos: 15
        },
        {
            titulo: '5. Marco Teórico/Revisión Literatura',
            desc: 'Incluye antecedentes y fundamentos teóricos relevantes con citas apropiadas',
            puntos: 10
        },
        {
            titulo: '6. Metodología',
            desc: 'Describe claramente el diseño, muestra, instrumentos y procedimientos',
            puntos: 15
        },
        {
            titulo: '7. Resultados',
            desc: 'Presenta los hallazgos de forma clara con tablas/gráficos apropiados',
            puntos: 15
        },
        {
            titulo: '8. Discusión',
            desc: 'Analiza e interpreta los resultados en relación con la teoría',
            puntos: 10
        },
        {
            titulo: '9. Conclusiones',
            desc: 'Son coherentes con los objetivos y resultados del estudio',
            puntos: 5
        },
        {
            titulo: '10. Referencias Bibliográficas',
            desc: 'Están completas y siguen el formato APA correctamente',
            puntos: 5
        }
    ];

    container.innerHTML = btnPDF + criterios.map((criterio, index) => `
        <div class="criterion-item">
            <div class="criterion-content">
                <h4>${criterio.titulo}</h4>
                <p style="color: #666; font-size: 0.9em; margin-top: 5px;">${criterio.desc}</p>
            </div>
            <label class="checkbox-container">
                <input type="checkbox" name="eval-criterio-${index}" value="${criterio.puntos}">
                <span class="checkmark"></span>
                <span class="points">${criterio.puntos} pts</span>
            </label>
        </div>
    `).join('');

    // Actualizar puntuación máxima visual
    const puntuacionMaxima = criterios.reduce((sum, c) => sum + c.puntos, 0);
    updateElementText('puntuacionMaxima', puntuacionMaxima);
}

// Exportar
window.cargarCriteriosPaso7 = cargarCriteriosPaso7;

/* ===========================================================
   INTERFAZ DE REPORTES PDF
   =========================================================== */

function mostrarSeccionReportes(e) {
    if (e) e.preventDefault();

    const modalHTML = `
        <div id="modalReportes" class="modal active" style="display: flex;">
            <div class="modal-content modal-large" style="max-width: 90%; max-height: 95vh;">
                <div class="modal-header">
                    <h3>\ud83d\udcca Generaci\u00f3n de Reportes PDF</h3>
                    <button class="modal-close" onclick="cerrarModalReportes()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <!-- Tabs de Reportes -->
                    <div class="tabs-container" style="margin-bottom: 20px;">
                        <button class="tab-btn active" onclick="cambiarTabReporte('perfil')">
                            \ud83d\udcc4 Perfil de Proyectos
                        </button>
                        <button class="tab-btn" onclick="cambiarTabReporte('informe')">
                            \ud83d\udcdd Informes Finales
                        </button>
                        <button class="tab-btn" onclick="cambiarTabReporte('articulo')">
                            \ud83d\udcf0 Art\u00edculos Cient\u00edficos
                        </button>
                    </div>

                    <!-- Contenido Tab Perfil -->
                    <div id="tab-perfil" class="tab-content active">
                        <h4 style="margin-bottom: 15px; color: #667eea;">Reportes de Perfil de Proyectos (Paso 1)</h4>
                        <div class="reportes-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                            <div class="reporte-card">
                                <h5>\ud83d\udc64 Reporte Individual</h5>
                                <p style="font-size: 0.9em; color: #666;">Generar reporte de evaluaci\u00f3n de un investigador espec\u00edfico</p>
                                <button class="btn-primary" onclick="solicitarProyectoIndividual('perfil')" style="margin-top: 10px; width: 100%;">
                                    Generar
                                </button>
                            </div>
                            <div class="reporte-card">
                                <h5>\ud83d\udc65 Reporte Grupal Aprobados</h5>
                                <p style="font-size: 0.9em; color: #666;">Lista de proyectos aprobados por categor\u00eda</p>
                                <button class="btn-primary" onclick="solicitarCategoriaReporte('aprobadosPerfil')" style="margin-top: 10px; width: 100%; background: #4CAF50;">
                                    Generar
                                </button>
                            </div>
                            <div class="reporte-card">
                                <h5>\u26a0\ufe0f Reporte Observados</h5>
                                <p style="font-size: 0.9em; color: #666;">Proyectos rechazados o pendientes</p>
                                <button class="btn-primary" onclick="solicitarCategoriaReporte('observadosPerfil')" style="margin-top: 10px; width: 100%; background: #FF9800;">
                                    Generar
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Contenido Tab Informe -->
                    <div id="tab-informe" class="tab-content" style="display: none;">
                        <h4 style="margin-bottom: 15px; color: #9C27B0;">Reportes de Informes Finales (Paso 6)</h4>
                        <div class="reportes-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                            <div class="reporte-card">
                                <h5>\ud83d\udc64 Reporte Individual</h5>
                                <p style="font-size: 0.9em; color: #666;">Evaluaci\u00f3n de informe final de un investigador</p>
                                <button class="btn-primary" onclick="solicitarProyectoIndividual('informe')" style="margin-top: 10px; width: 100%;">
                                    Generar
                                </button>
                            </div>
                            <div class="reporte-card">
                                <h5>\u2705 Informes Aprobados</h5>
                                <p style="font-size: 0.9em; color: #666;">Lista de informes finales aprobados</p>
                                <button class="btn-primary" onclick="generarReporteGrupalInformesAprobados()" style="margin-top: 10px; width: 100%; background: #4CAF50;">
                                    Generar
                                </button>
                            </div>
                            <div class="reporte-card">
                                <h5>\ud83d\udcdd Informes Observados</h5>
                                <p style="font-size: 0.9em; color: #666;">Informes rechazados o pendientes</p>
                                <button class="btn-primary" onclick="generarReporteGrupalInformesObservados()" style="margin-top: 10px; width: 100%; background: #FF9800;">
                                    Generar
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Contenido Tab Art\u00edculo -->
                    <div id="tab-articulo" class="tab-content" style="display: none;">
                        <h4 style="margin-bottom: 15px; color: #667eea;">Reportes de Art\u00edculos Cient\u00edficos (Paso 7)</h4>
                        <div class="reportes-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                            <div class="reporte-card">
                                <h5>\ud83d\udc64 Reporte Individual</h5>
                                <p style="font-size: 0.9em; color: #666;">Evaluaci\u00f3n de art\u00edculo cient\u00edfico</p>
                                <button class="btn-primary" onclick="solicitarProyectoIndividual('articulo')" style="margin-top: 10px; width: 100%;">
                                    Generar
                                </button>
                            </div>
                            <div class="reporte-card">
                                <h5>\ud83c\udf89 Art\u00edculos Aprobados</h5>
                                <p style="font-size: 0.9em; color: #666;">Lista de art\u00edculos aprobados</p>
                                <button class="btn-primary" onclick="generarReporteGrupalArticulosAprobados()" style="margin-top: 10px; width: 100%; background: #4CAF50;">
                                    Generar
                                </button>
                            </div>
                            <div class="reporte-card">
                                <h5>\ud83d\udd0d Faltantes de Art\u00edculo</h5>
                                <p style="font-size: 0.9em; color: #666;">Proyectos con Paso 6 aprobado sin art\u00edculo</p>
                                <button class="btn-primary" onclick="generarReporteFaltantesArticulo()" style="margin-top: 10px; width: 100%; background: #f44336;">
                                    Generar
                                </button>
                            </div>
                        </div>
                    </div>

                    <style>
                        .tabs-container {
                            display: flex;
                            gap: 10px;
                            border-bottom: 2px solid #e2e8f0;
                        }
                        .tab-btn {
                            padding: 12px 20px;
                            border: none;
                            background: transparent;
                            cursor: pointer;
                            font-weight: 500;
                            color: #64748b;
                            border-bottom: 3px solid transparent;
                            transition: all 0.3s;
                        }
                        .tab-btn:hover {
                            color: #0f172a;
                            background: #f8fafc;
                        }
                        .tab-btn.active {
                            color: #667eea;
                            border-bottom-color: #667eea;
                        }
                        .reporte-card {
                            padding: 20px;
                            border: 2px solid #e2e8f0;
                            border-radius: 8px;
                            transition: all 0.3s;
                        }
                        .reporte-card:hover {
                            border-color: #667eea;
                            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
                        }
                        .reporte-card h5 {
                            margin: 0 0 10px 0;
                            color: #1e293b;
                        }
                    </style>
                </div>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
}

function cerrarModalReportes() {
    const modal = document.getElementById('modalReportes');
    if (modal) modal.remove();
}

function cambiarTabReporte(tipo) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Mostrar el tab seleccionado
    document.getElementById(`tab-${tipo}`).style.display = 'block';
    event.target.classList.add('active');
}

function solicitarProyectoIndividual(tipo) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    let proyectosFiltrados = [];

    if (tipo === 'perfil') {
        proyectosFiltrados = proyectos.filter(p => p.estado !== undefined);
    } else if (tipo === 'informe') {
        proyectosFiltrados = proyectos.filter(p => p.paso6 && p.estadoPaso6);
    } else if (tipo === 'articulo') {
        proyectosFiltrados = proyectos.filter(p => p.paso7 && p.estadoPaso7);
    }

    if (proyectosFiltrados.length === 0) {
        showNotification(`No hay proyectos disponibles para este tipo de reporte`, 'warning');
        return;
    }

    // Crear prompt para seleccionar proyecto
    const opciones = proyectosFiltrados.map((p, i) =>
        `${i + 1}. ${p.titulo} - ${p.investigadorNombre}`
    ).join('\\n');

    const seleccion = prompt(`Seleccione el n\u00famero del proyecto:\\n\\n${opciones}`);

    if (seleccion) {
        const index = parseInt(seleccion) - 1;
        if (index >= 0 && index < proyectosFiltrados.length) {
            const proyectoId = proyectosFiltrados[index].id;

            if (tipo === 'perfil') {
                generarReporteIndividualPerfil(proyectoId);
            } else if (tipo === 'informe') {
                generarReporteIndividualInformeFinal(proyectoId);
            } else if (tipo === 'articulo') {
                generarReporteIndividualArticulo(proyectoId);
            }
        } else {
            showNotification('Selecci\u00f3n inv\u00e1lida', 'error');
        }
    }
}

function solicitarCategoriaReporte(tipo) {
    const opciones = `
1. Investigaci\u00f3n Aplicada
2. Innovaci\u00f3n Tecnol\u00f3gica
3. Innovaci\u00f3n Pedag\u00f3gica
4. Todas las categor\u00edas
`;

    const seleccion = prompt(`Seleccione la categor\u00eda:\\n${opciones}`);

    if (seleccion) {
        let categoria = null;
        switch (seleccion) {
            case '1': categoria = 'investigacion-aplicada'; break;
            case '2': categoria = 'innovacion-tecnologica'; break;
            case '3': categoria = 'innovacion-pedagogica'; break;
            case '4': categoria = null; break;
            default:
                showNotification('Selecci\u00f3n inv\u00e1lida', 'error');
                return;
        }

        if (tipo === 'aprobadosPerfil') {
            generarReporteGrupalAprobadosPerfil(categoria);
        } else if (tipo === 'observadosPerfil') {
            generarReporteObservadosPerfil(categoria);
        }
    }
}

// Exportar funciones
window.mostrarSeccionReportes = mostrarSeccionReportes;
window.cerrarModalReportes = cerrarModalReportes;
window.cambiarTabReporte = cambiarTabReporte;
window.solicitarProyectoIndividual = solicitarProyectoIndividual;
window.solicitarCategoriaReporte = solicitarCategoriaReporte;

