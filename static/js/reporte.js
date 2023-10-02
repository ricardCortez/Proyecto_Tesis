$(document).ready(function() {
    // Inicializamos la tabla vacía con DataTables
    var tabla = $('#tabla-reporte').DataTable({
        columns: [
            { data: "codigo_alumno"},
            { data: "nombre" }
        ]
    });

    // Cargar las secciones en el menú desplegable y añadir la opción por defecto
    $('#seccion-select').append('<option value="" selected>Elige una sección</option>'); // Opción por defecto
    $.get("/obtener_secciones", function(secciones) {
        secciones.forEach(function(seccion) {
            $('#seccion-select').append(`<option value="${seccion.id}">${seccion.nombre_seccion}</option>`);
        });
    });

    // Evento para actualizar la tabla al cambiar la selección de sección
$('#seccion-select').on('change', function() {
    var seccionId = $(this).val();
    if (seccionId) {
        $.get(`/get_students_for_section/${seccionId}`, function(data) {
            if (Array.isArray(data)) {
                tabla.clear().rows.add(data).draw();  // Limpia y añade las nuevas filas a la tabla
            } else {
                console.error('La respuesta del servidor no es un array:', data);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error en la petición AJAX:', textStatus, errorThrown);
        });
    } else {
        tabla.clear().draw();  // Limpia la tabla si se selecciona 'Elige una sección'
    }
});

});
