var seccionSeleccionada = ""; // Variable para almacenar la sección seleccionada

$(document).ready(function() {
  var usuarioId = $("#section_name").data("usuario-id");
  cargarSecciones(usuarioId);

  $("#btnCargarAsistencia").click(function(event) {
    event.preventDefault(); // Evitar que se envíe el formulario

    cargarAsistencia();
  });

  $("#section_name").change(function() {
    seccionSeleccionada = $(this).val(); // Actualizar la sección seleccionada
    limpiarVistaAsistencia();
  });
  $('#start-form').submit(function(event) {
    event.preventDefault(); // Evita la recarga de la página

    // Obtener los datos del formulario
    var formData = $(this).serialize();

    // Realizar la solicitud AJAX
    $.ajax({
        type: 'POST',
        url: '/start/aula',
        data: formData,
        beforeSend: function() {
            // Mostrar el spinner de carga antes de enviar la solicitud
            $("#loadingSpinner").show();
        },
        success: function(response) {
            // Manejar la respuesta del servidor
            console.log(response);
        },
        error: function(xhr, status, error) {
            // Manejar errores de la solicitud
            console.error(error);
        },
        complete: function() {
            // Ocultar el spinner de carga después de completar la solicitud
            $("#loadingSpinner").hide();
        }
    });
});

});

function cargarSecciones(usuarioId) {
  console.log("ID del usuario dentro:", usuarioId);

  $.get("/obtener_secciones", function(secciones) {
    var selectElement = $("#section_name");

    // Vaciar el menú desplegable actual
    selectElement.empty();

    secciones.forEach(function(seccion) {
      // Crear una nueva opción y agregarla al menú desplegable
      var optionElement = $("<option>")
        .val(seccion.id.toString()) // Usar el ID de la sección como valor
        .text(seccion.nombre_seccion);

      selectElement.append(optionElement);
    });

    seccionSeleccionada = selectElement.val();
  });
}

function cargarAsistencia() {
  // Obtener el ID de la sección seleccionada directamente
  var seccionSeleccionadaID = $("#section_name").val();

  // Realizar la solicitud GET para obtener los datos de asistencia
  $.get("/obtener_asistencia", { seccion_id: seccionSeleccionadaID }, function(datosAsistencia) {
    var tablaAsistencia = $("#tabla_asistencia tbody");

    // Vaciar la tabla actual
    tablaAsistencia.empty();

    datosAsistencia.forEach(function(asistencia) {
      // Ya no necesitas verificar si la asistencia sección coincide, ya que la asistencia se filtra en el servidor
      var fila = $("<tr>")
        .append($("<td>").text(asistencia.codigo_alumno))
        .append($("<td>").text(asistencia.nombre_alumno))
        .append($("<td>").text(asistencia.hora))
        .append($("<td>").text(new Date(asistencia.fecha).toLocaleDateString()))

      tablaAsistencia.append(fila);
    });
  });
}


function limpiarVistaAsistencia() {
  var tablaAsistencia = $("#tabla_asistencia tbody");

  // Vaciar la tabla actual
  tablaAsistencia.empty();
}
