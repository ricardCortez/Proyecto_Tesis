
$(document).ready(function() {
    // Inicializamos la tabla con DataTables
    var tabla = $('#tabla-reporte').DataTable({
        ajax: {
            url: "/get_students_sections",
            dataSrc: ""
        },
        columns: [
            { data: "codigo_alumno"},
            { data: "nombre" },
            { data: "secciones" }
        ]
    });

    // Cargar las secciones en el menú desplegable
    $.get("/get_sections", function(secciones) {
        secciones.forEach(function(seccion) {
            $('#seccion-select').append(`<option value="${seccion.id}">${seccion.nombre_seccion}</option>`);
        });
    });

    // Evento para actualizar la tabla al cambiar la selección de sección
    $('#seccion-select').on('change', function() {
        var seccionId = $(this).val();
        tabla.ajax.url(`/get_students_for_section/${seccionId}`).load();
    });
});
