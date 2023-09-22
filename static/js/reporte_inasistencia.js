$(document).ready(function() {
    var tabla = $('#tabla-jalados').DataTable({
        data: [], // Inicializa la tabla con un conjunto de datos vacío
        columns: [
            { data: null }, // Deja esta columna en blanco para el índice numérico
            { data: 'codigo_alumno' },
            { data: 'nombre' },
            { data: 'estado' ,
                createdRow: function(row, data, dataIndex) {
                    // Agregar la clase 'red-text' al estado si cumple con cierta condición
                    if (data.estado === 'Jalado por Inasistencia') {
                        $('td:eq(3)', row).css('background-color', 'red');
                    }
                }
            }
        ],
        rowCallback: function(row, data, index) {
            // Agregar el índice numérico a la primera celda de cada fila
            $('td:eq(0)', row).html(index + 1);
        }
    });

    // Función para cargar las secciones
    function get_sections() {
        $.ajax({
            url: '/get_sections',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                // Imprimir las secciones en la consola para depuración
                console.log('Secciones:', data);

                // Llenar la lista desplegable con las secciones
                const select = $('#seccion-select');
                data.forEach(function(section) {
                    select.append($('<option>', {
                        value: section.id,
                        text: section.nombre_seccion
                    }));
                });
            },
            error: function(error) {
                console.error('Error al cargar las secciones', error);
            }
        });
    }

    // Agregar evento de cambio a la lista desplegable de secciones
    $('#seccion-select').on('change', function() {
        var selectedSectionId = $(this).val();

        // Si se selecciona una sección, cargar estudiantes por sección
        if (selectedSectionId) {
            // Actualizar la URL de la solicitud AJAX para obtener estudiantes por sección
            $.ajax({
                url: '/get_students_failed_by_section/' + selectedSectionId,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    // Cargar los datos en la tabla
                    tabla.clear().rows.add(data).draw();
                },
                error: function(error) {
                    console.error('Error al cargar estudiantes por sección', error);
                }
            });
        } else {
            // Si no se selecciona ninguna sección, dejar la tabla vacía
            tabla.clear().draw();
        }
    });

    // Llamar a la función para cargar las secciones al inicio
    get_sections();
});
