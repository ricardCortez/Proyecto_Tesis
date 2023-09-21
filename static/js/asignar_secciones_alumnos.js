
$(document).ready(function() {
    cargarDatosEstudiantes();
});

// Agregar evento de clic al botón de limpiar asignaciones
$("#limpiar-asignaciones").click(function() {
    limpiarAsignacionesEstudiantes();
});

function limpiarAsignacionesEstudiantes() {
    console.log("Botón de limpiar asignaciones clickeado");
    // Realizar una solicitud AJAX para limpiar las asignaciones
    $.ajax({
        url: '/limpiar_asignaciones_estudiantes',
        type: 'POST',
        success: function(response) {
            alert(response.message);
            cargarDatosEstudiantes();  // Recargar los datos para actualizar la lista de secciones no asignadas
        },
        error: function(error) {
            console.log(error);
        }
    });
}

function cargarDatosEstudiantes() {
    $('#tabla-asignacion-estudiante tbody').empty();

    $.get("/obtener_usuarios", function(usuarios) {
        $.get("/obtener_secciones_alumnos", function(secciones) {
            $.get("/obtener_estudiantes_asignados", function(usuarios_asignados) {
                usuarios.forEach(function(usuario) {
                    var fila = '<tr><td>' + usuario.nombre + '</td><td><ul id="seccion-usuario-' + usuario.id + '"';
                    fila += '>';
                    secciones.forEach(function(seccion) {
                        fila += '<li><input type="checkbox" id="seccion-' + seccion.id + '-' + usuario.id + '" value="' + seccion.id + '">';
                        fila += '<label for="seccion-' + seccion.id + '-' + usuario.id + '">' + seccion.nombre_seccion + '</label></li>';
                    });
                    fila += '</ul></td><td><button onclick="asignarUsuario(' + usuario.id + ')">Asignar</button></td></tr>';
                    $('#tabla-asignacion-estudiante tbody').append(fila);
                });

                // Destruye cualquier instancia anterior de DataTables antes de inicializar una nueva
                if ($.fn.dataTable.isDataTable('#tabla-asignacion-estudiante')) {
                    $('#tabla-asignacion-estudiante').DataTable().destroy();
                }

                // Inicializa DataTables una vez que los datos están cargados
                $('#tabla-asignacion-estudiante').DataTable({
                    pageLength: 10,
                    lengthMenu: [10, 20, 30, 50, 100],
                });
            });
        });
    });
}

function asignarUsuario(usuarioId) {
    let seccionesSeleccionadas = $(`input[name='seccion_${usuarioId}']:checked`).map(function() {
        return this.value;
    }).get();

    if (seccionesSeleccionadas.length === 0) {
        alert('No se seleccionó ninguna sección.');
        return;
    }

    $.ajax({
        url: '/asignar_estudiante',
        method: 'POST',
        data: {
            estudiante_id: usuarioId,
            seccion_id: JSON.stringify(seccionesSeleccionadas)
        },
        success: function(response) {
            if (response.status === 'success') {
                cargarDatosEstudiantes();
            } else {
                // Mostrar un mensaje de error (podemos mejorar este mensaje basándonos en el error específico)
                alert(response.message);
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
}

function ocultarSeccionAsignada(usuarioId, seccionId) {
    $("#seccion-" + seccionId + "-" + usuarioId).parent().hide();
}
