/* ====================================
   REPORTES.JS - Sistema de Generación de Reportes PDF
   ==================================== */

// Función para convertir imagen a base64
async function imageToBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error loading image:', error);
        return null;
    }
}

// Crear encabezado estándar para todos los reportes
async function crearEncabezadoReporte(doc, titulo) {
    // Logo en esquina superior derecha
    try {
        const logoBase64 = await imageToBase64('imagen/logocajas.png');
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 160, 10, 35, 35);
        }
    } catch (error) {
        console.log('Logo no disponible');
    }

    // Título del instituto
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('IESTP "AACD"', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Sistema de Gestión de Investigación', 105, 28, { align: 'center' });

    // Título del reporte
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(titulo, 105, 40, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    // Fecha del reporte
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, 20, 53);
    doc.setTextColor(0);

    return 58; // Y position donde debe iniciar el contenido
}

// Reporte Individual de Perfil (Paso 1)
async function generarReporteIndividualPerfil(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto) {
        showNotification('Proyecto no encontrado', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE INDIVIDUAL - PERFIL DE PROYECTO');

    // Información del Proyecto
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL PROYECTO', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const info = [
        ['Título:', proyecto.titulo],
        ['Investigador:', proyecto.investigadorNombre],
        ['Categoría:', getCategoryName(proyecto.categoria)],
        ['Fecha de Creación:', formatDate(proyecto.fechaCreacion)]
    ];

    info.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, 70, yPos);
        yPos += 6;
    });

    yPos += 5;

    // Estado de Evaluación
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('EVALUACIÓN DEL PERFIL', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    if (proyecto.estado) {
        const estadoInfo = [
            ['Estado:', proyecto.estado.toUpperCase()],
            ['Puntuación:', `${proyecto.puntuacion || 0}/100 puntos`],
            ['Evaluador:', proyecto.evaluadorNombre || 'N/A'],
            ['Fecha de Evaluación:', formatDate(proyecto.fechaEvaluacion)]
        ];

        estadoInfo.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, yPos);
            doc.setFont(undefined, 'normal');

            // Color según estado
            if (label === 'Estado:') {
                if (value === 'APROBADO') doc.setTextColor(76, 175, 80);
                else if (value === 'RECHAZADO') doc.setTextColor(244, 67, 54);
                else doc.setTextColor(255, 152, 0);
            }

            doc.text(value, 70, yPos);
            doc.setTextColor(0);
            yPos += 6;
        });

        // Comentarios
        if (proyecto.comentarios) {
            yPos += 3;
            doc.setFont(undefined, 'bold');
            doc.text('Comentarios del Evaluador:', 20, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');
            const splitComments = doc.splitTextToSize(proyecto.comentarios, 170);
            doc.text(splitComments, 20, yPos);
            yPos += splitComments.length * 5;
        }
    } else {
        doc.text('PENDIENTE DE EVALUACIÓN', 70, yPos);
    }

    // Guardar PDF
    doc.save(`Reporte_Perfil_${proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Reporte Grupal de Aprobados (Perfil)
async function generarReporteGrupalAprobadosPerfil(categoria = null) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    let proyectosAprobados = proyectos.filter(p => p.estado === 'aprobado');

    if (categoria) {
        proyectosAprobados = proyectosAprobados.filter(p => p.categoria === categoria);
    }

    if (proyectosAprobados.length === 0) {
        showNotification('No hay proyectos aprobados para mostrar', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE GRUPAL - PERFILES APROBADOS');

    // Resumen
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de Proyectos Aprobados: ${proyectosAprobados.length}`, 20, yPos);
    if (categoria) {
        doc.text(`Categoría: ${getCategoryName(categoria)}`, 20, yPos + 6);
        yPos += 6;
    }
    yPos += 10;

    // Tabla de proyectos
    const tableData = proyectosAprobados.map(p => [
        p.titulo,
        getCategoryName(p.categoria),
        p.investigadorNombre,
        `${p.puntuacion}/100`,
        formatDateShort(p.fechaEvaluacion)
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Título del Proyecto', 'Categoría', 'Investigador', 'Puntuación', 'Fecha Aprobación']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 }
        }
    });

    doc.save(`Reporte_Aprobados_Perfil_${new Date().getTime()}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Reporte de Observados (Perfil)
async function generarReporteObservadosPerfil(categoria = null) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    let proyectosObservados = proyectos.filter(p => p.estado === 'rechazado' || p.estado === 'pendiente');

    if (categoria) {
        proyectosObservados = proyectosObservados.filter(p => p.categoria === categoria);
    }

    if (proyectosObservados.length === 0) {
        showNotification('No hay proyectos observados para mostrar', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE - PERFILES OBSERVADOS');

    // Resumen
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de Proyectos Observados: ${proyectosObservados.length}`, 20, yPos);
    if (categoria) {
        doc.text(`Categoría: ${getCategoryName(categoria)}`, 20, yPos + 6);
        yPos += 6;
    }
    yPos += 10;

    // Tabla de proyectos
    const tableData = proyectosObservados.map(p => [
        p.titulo,
        p.investigadorNombre,
        p.estado ? p.estado.toUpperCase() : 'PENDIENTE',
        p.puntuacion ? `${p.puntuacion}/100` : 'N/A',
        p.fechaLimiteCorreccion ? formatDateShort(p.fechaLimiteCorreccion) : 'N/A'
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Título', 'Investigador', 'Estado', 'Puntuación', 'Fecha Límite']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [244, 67, 54], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 45 },
            2: { cellWidth: 30 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 }
        }
    });

    doc.save(`Reporte_Observados_Perfil_${new Date().getTime()}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Reporte Individual Informe Final (Paso 6)
async function generarReporteIndividualInformeFinal(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto || !proyecto.paso6) {
        showNotification('El proyecto no tiene informe final', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE INDIVIDUAL - INFORME FINAL');

    // Información del Proyecto
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL PROYECTO', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const info = [
        ['Título:', proyecto.titulo],
        ['Investigador:', proyecto.investigadorNombre],
        ['Categoría:', getCategoryName(proyecto.categoria)],
        ['Fecha Envío Informe:', formatDate(proyecto.paso6.fechaEnvio)]
    ];

    info.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, 70, yPos);
        yPos += 6;
    });

    yPos += 5;

    // Estado de Evaluación del Informe
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('EVALUACIÓN DEL INFORME FINAL', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    if (proyecto.estadoPaso6) {
        const estadoInfo = [
            ['Estado:', proyecto.estadoPaso6.toUpperCase()],
            ['Puntuación:', `${proyecto.puntuacionPaso6 || 0}/35 puntos`],
            ['Evaluador:', proyecto.evaluadorNombrePaso6 || 'N/A'],
            ['Fecha de Evaluación:', proyecto.fechaEvaluacionPaso6 ? formatDate(proyecto.fechaEvaluacionPaso6) : 'N/A']
        ];

        estadoInfo.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, yPos);
            doc.setFont(undefined, 'normal');

            if (label === 'Estado:') {
                if (value === 'APROBADO') doc.setTextColor(76, 175, 80);
                else if (value === 'RECHAZADO') doc.setTextColor(244, 67, 54);
                else doc.setTextColor(255, 152, 0);
            }

            doc.text(value, 70, yPos);
            doc.setTextColor(0);
            yPos += 6;
        });

        if (proyecto.comentariosPaso6) {
            yPos += 3;
            doc.setFont(undefined, 'bold');
            doc.text('Comentarios del Evaluador:', 20, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');
            const splitComments = doc.splitTextToSize(proyecto.comentariosPaso6, 170);
            doc.text(splitComments, 20, yPos);
        }
    } else {
        doc.text('PENDIENTE DE EVALUACIÓN', 70, yPos);
    }

    doc.save(`Reporte_InformeFinal_${proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Reporte Grupal Informes Aprobados
async function generarReporteGrupalInformesAprobados() {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const informesAprobados = proyectos.filter(p => p.paso6 && p.estadoPaso6 === 'aprobado');

    if (informesAprobados.length === 0) {
        showNotification('No hay informes finales aprobados', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE GRUPAL - INFORMES FINALES APROBADOS');

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de Informes Aprobados: ${informesAprobados.length}`, 20, yPos);
    yPos += 10;

    const tableData = informesAprobados.map(p => [
        p.titulo,
        p.investigadorNombre,
        getCategoryName(p.categoria),
        `${p.puntuacionPaso6}/35`,
        formatDateShort(p.fechaEvaluacionPaso6)
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Título', 'Investigador', 'Categoría', 'Puntuación', 'Fecha Aprobación']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`Reporte_Informes_Aprobados_${new Date().getTime()}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Reporte Grupal Informes Observados
async function generarReporteGrupalInformesObservados() {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const informesObservados = proyectos.filter(p => p.paso6 && (p.estadoPaso6 === 'rechazado' || p.estadoPaso6 === 'pendiente'));

    if (informesObservados.length === 0) {
        showNotification('No hay informes observados', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE GRUPAL - INFORMES FINALES OBSERVADOS');

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de Informes Observados: ${informesObservados.length}`, 20, yPos);
    yPos += 10;

    const tableData = informesObservados.map(p => [
        p.titulo,
        p.investigadorNombre,
        p.estadoPaso6 ? p.estadoPaso6.toUpperCase() : 'PENDIENTE',
        p.puntuacionPaso6 ? `${p.puntuacionPaso6}/35` : 'N/A',
        p.fechaLimiteCorreccionPaso6 ? formatDateShort(p.fechaLimiteCorreccionPaso6) : 'N/A'
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Título', 'Investigador', 'Estado', 'Puntuación', 'Fecha Límite']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [244, 67, 54], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`Reporte_Informes_Observados_${new Date().getTime()}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Reporte Individual Artículo Científico (Paso 7)
async function generarReporteIndividualArticulo(proyectoId) {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyecto = proyectos.find(p => p.id === proyectoId);

    if (!proyecto || !proyecto.paso7) {
        showNotification('El proyecto no tiene artículo científico', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE INDIVIDUAL - ARTÍCULO CIENTÍFICO');

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL PROYECTO', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const info = [
        ['Título:', proyecto.titulo],
        ['Investigador:', proyecto.investigadorNombre],
        ['Fecha Envío Artículo:', formatDate(proyecto.paso7.fechaEnvio)]
    ];

    info.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, 70, yPos);
        yPos += 6;
    });

    yPos += 5;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('EVALUACIÓN DEL ARTÍCULO CIENTÍFICO', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    if (proyecto.estadoPaso7) {
        const estadoInfo = [
            ['Estado:', proyecto.estadoPaso7.toUpperCase()],
            ['Puntuación:', `${proyecto.puntuacionPaso7 || 0}/100 puntos`],
            ['Evaluador:', proyecto.evaluadorNombrePaso7 || 'N/A'],
            ['Fecha de Evaluación:', proyecto.fechaEvaluacionPaso7 ? formatDate(proyecto.fechaEvaluacionPaso7) : 'N/A']
        ];

        estadoInfo.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, yPos);
            doc.setFont(undefined, 'normal');

            if (label === 'Estado:') {
                if (value === 'APROBADO') doc.setTextColor(76, 175, 80);
                else if (value === 'RECHAZADO') doc.setTextColor(244, 67, 54);
                else doc.setTextColor(255, 152, 0);
            }

            doc.text(value, 70, yPos);
            doc.setTextColor(0);
            yPos += 6;
        });

        if (proyecto.comentariosPaso7) {
            yPos += 3;
            doc.setFont(undefined, 'bold');
            doc.text('Comentarios del Evaluador:', 20, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');
            const splitComments = doc.splitTextToSize(proyecto.comentariosPaso7, 170);
            doc.text(splitComments, 20, yPos);
        }
    } else {
        doc.text('PENDIENTE DE EVALUACIÓN', 70, yPos);
    }

    doc.save(`Reporte_Articulo_${proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Reporte Grupal Artículos Aprobados
async function generarReporteGrupalArticulosAprobados() {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const articulosAprobados = proyectos.filter(p => p.paso7 && p.estadoPaso7 === 'aprobado');

    if (articulosAprobados.length === 0) {
        showNotification('No hay artículos científicos aprobados', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE GRUPAL - ARTÍCULOS CIENTÍFICOS APROBADOS');

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de Artículos Aprobados: ${articulosAprobados.length}`, 20, yPos);
    yPos += 10;

    const tableData = articulosAprobados.map(p => [
        p.titulo,
        p.investigadorNombre,
        getCategoryName(p.categoria),
        `${p.puntuacionPaso7}/100`,
        formatDateShort(p.fechaEvaluacionPaso7)
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Título', 'Investigador', 'Categoría', 'Puntuación', 'Fecha Aprobación']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`Reporte_Articulos_Aprobados_${new Date().getTime()}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Reporte de Faltantes (Proyectos con Paso 6 aprobado pero sin Paso 7)
async function generarReporteFaltantesArticulo() {
    const proyectos = StorageManager.getItem('proyectos') || [];
    const proyectosFaltantes = proyectos.filter(p =>
        p.paso6 &&
        p.estadoPaso6 === 'aprobado' &&
        (!p.paso7 || !p.paso7.archivoPDF)
    );

    if (proyectosFaltantes.length === 0) {
        showNotification('Todos los proyectos con informe aprobado tienen artículo', 'success');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = await crearEncabezadoReporte(doc, 'REPORTE - ARTÍCULOS CIENTÍFICOS FALTANTES');

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(244, 67, 54);
    doc.text(`⚠️ Total de Artículos Faltantes: ${proyectosFaltantes.length}`, 20, yPos);
    doc.setTextColor(0);
    yPos += 7;

    doc.setFont(undefined, 'normal');
    doc.text('(Proyectos con Informe Final aprobado pero sin Artículo Científico)', 20, yPos);
    yPos += 10;

    const tableData = proyectosFaltantes.map(p => [
        p.titulo,
        p.investigadorNombre,
        getCategoryName(p.categoria),
        formatDateShort(p.fechaEvaluacionPaso6),
        calcularDiasDesde(p.fechaEvaluacionPaso6)
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Título', 'Investigador', 'Categoría', 'Fecha Aprobación Informe', 'Días Transcurridos']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [244, 67, 54], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 45 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 }
        }
    });

    doc.save(`Reporte_Articulos_Faltantes_${new Date().getTime()}.pdf`);
    showNotification('Reporte generado exitosamente', 'success');
}

// Función auxiliar para calcular días transcurridos
function calcularDiasDesde(fecha) {
    if (!fecha) return 'N/A';
    const fechaEval = new Date(fecha);
    const hoy = new Date();
    const diferencia = Math.floor((hoy - fechaEval) / (1000 * 60 * 60 * 24));
    return `${diferencia} días`;
}

// Exportar funciones
window.generarReporteIndividualPerfil = generarReporteIndividualPerfil;
window.generarReporteGrupalAprobadosPerfil = generarReporteGrupalAprobadosPerfil;
window.generarReporteObservadosPerfil = generarReporteObservadosPerfil;
window.generarReporteIndividualInformeFinal = generarReporteIndividualInformeFinal;
window.generarReporteGrupalInformesAprobados = generarReporteGrupalInformesAprobados;
window.generarReporteGrupalInformesObservados = generarReporteGrupalInformesObservados;
window.generarReporteIndividualArticulo = generarReporteIndividualArticulo;
window.generarReporteGrupalArticulosAprobados = generarReporteGrupalArticulosAprobados;
window.generarReporteFaltantesArticulo = generarReporteFaltantesArticulo;
