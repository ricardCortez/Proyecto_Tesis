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
            });
        });
    });
}

function asignarUsuario(usuarioId) {
    var seccionIds = []; // Array para almacenar los ID de las secciones seleccionadas
    $("#seccion-usuario-" + usuarioId + " input:checked").each(function() {
        seccionIds.push($(this).val()); // Agregar el ID de la sección seleccionada al array
    });

    seccionIds.forEach(function(seccionId) { // Recorrer el array y asignar cada sección individualmente
        $.ajax({
            url: '/asignar_estudiante',
            type: 'POST',
            data: {
                'estudiante_id': usuarioId,
                'seccion_id': seccionId
            },
            success: function(response) {
                alert(response.message);
                cargarDatosEstudiantes();
                ocultarSeccionAsignada(usuarioId, seccionId); // Ocultar la sección asignada
            },
            error: function(error) {
                console.log(error);
            }
        });
    });
}

function ocultarSeccionAsignada(usuarioId, seccionId) {
    $("#seccion-" + seccionId + "-" + usuarioId).parent().hide();
}
