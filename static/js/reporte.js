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

function downloadCSV() {
    // Obtener los datos de la tabla
    var tableData = [];
    $('#tabla-reporte').DataTable().rows().every(function(index, element) {
        var row = this.data();
        tableData.push(row);
    });

    // Realizar la solicitud al servidor para generar el CSV
    $.ajax({
        url: '/generate_reporte_csv',  // Ruta en el servidor que generará el CSV
        type: 'POST',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({ 'tableData': tableData }),
        success: function(data) {
            // Crear un enlace temporal para descargar el CSV
            var blob = new Blob([data], { type: 'text/csv' });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'reporte.csv';
            link.click();
        },
        error: function(error) {
            console.error('Error al descargar el CSV:', error);
        }
    });
}
