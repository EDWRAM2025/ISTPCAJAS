// ============================================
// AGREGAR ESTAS FUNCIONES EN investigador.js
// DESPUÉS DE LA FUNCIÓN setupEventListeners() 
// (aproximadamente después de la línea 46)
// ============================================

// Manejar creación de nuevo proyecto
function handleNuevoProyecto(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const proyectos = StorageManager.getItem('proyectos') || [];

    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFinalizacion').value;

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
        showNotification('La fecha de finalización debe ser posterior a la fecha de inicio', 'warning');
        return;
    }

    const nuevoProyecto = {
        id: generateId(),
        titulo: document.getElementById('tituloProyecto').value.trim(),
        tipoInvestigacion: document.getElementById('tipoInvestigacion').value,
        programaEstudio: document.getElementById('programaEstudio').value,
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

    showNotification('✓ Proyecto creado y reporte generado exitosamente', 'success');
    cerrarModalNuevoProyecto();
    cargarProyectosCategoria();

    // Mostrar el reporte generado
    setTimeout(() => {
        verReporte(nuevoProyecto.id);
    }, 500);
}

// Manejar edición de proyecto
function handleEditarProyecto(e) {
    e.preventDefault();

    const proyectoId = document.getElementById('editProyectoId').value;
    const proyectos = StorageManager.getItem('proyectos') || [];

    const index = proyectos.findIndex(p => p.id === proyectoId);

    if (index !== -1) {
        proyectos[index].titulo = document.getElementById('editTituloProyecto').value.trim();
        proyectos[index].tipoInvestigacion = document.getElementById('editTipoInvestigacion').value;
        proyectos[index].programaEstudio = document.getElementById('editProgramaEstudio').value;
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

        showNotification('✓ Proyecto actualizado y reporte regenerado', 'success');
        cerrarModalEditarProyecto();
        cargarProyectosCategoria();
    }
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

    // Si existe programaEstudio, configurarlo
    if (proyecto.programaEstudio) {
        document.getElementById('editProgramaEstudio').value = proyecto.programaEstudio;
        // Disparar el evento para cargar las líneas de investigación
        const event = new Event('change');
        document.getElementById('editProgramaEstudio').dispatchEvent(event);
        // Esperar un momento para que se carguen las opciones
        setTimeout(() => {
            document.getElementById('editLineaInvestigacion').value = proyecto.lineaInvestigacion;
        }, 50);
    } else if (proyecto.lineaInvestigacion) {
        // Para compatibilidad con proyectos antiguos
        document.getElementById('editLineaInvestigacion').value = proyecto.lineaInvestigacion;
    }

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
