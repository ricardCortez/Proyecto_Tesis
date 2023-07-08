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
    $("#loadingSpinner").show();

    $.ajax({
      type: "GET",
      url: '/asignarcubiculo',
      success: function(response){
      $('#numero_cubiculo').text(response.numero_cubiculo)
      // Obtener los datos del formulario
        var formData = $('#start-form').serialize() + '&numero_cubiculo=' + response.numero_cubiculo;

        // Realizar la solicitud AJAX
        $.ajax({
          type: 'POST',
          url: '/start/laboratorio',
          data: formData,
          success: function(response) {
            // Manejar la respuesta del servidor
            console.log(response);
          },
          error: function(xhr, status, error) {
            // Manejar errores de la solicitud
            console.error(error);
          },
          complete: function(){
            $("#loadingSpinner").hide();
          }
        });
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

      console.log("Nombre de la sección:", seccion.nombre_seccion); // Imprimir el nombre de la sección
    });

    seccionSeleccionada = selectElement.val(); // Actualizar la sección seleccionada inicialmente
  });
}

function cargarAsistencia() {
  // Obtener el ID de la sección seleccionada directamente
  var seccionSeleccionadaID = $("#section_name").val();

  // Realizar la solicitud GET para obtener los datos de asistencia
  $.get("/obtener_asistencia_labo", { seccion_id: seccionSeleccionadaID }, function(datosAsistencia) {
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
          .append($("<td>").text(asistencia.numero_cubiculo))
          .append($("<td>").html('<button type="button" class="btnEditarCubiculo" onclick="editarCubiculo(this)">Editar</button>'));

        tablaAsistencia.append(fila);
   });
  });
}

function obtenerIDSeccion(nombreSeccion) {
  var seccionSeleccionadaID = null;

  // Iterar sobre las opciones del menú desplegable para encontrar el ID de la sección correspondiente al nombre seleccionado
  $("#section_name option").each(function() {
    if ($(this).text() === nombreSeccion) {
      seccionSeleccionadaID = $(this).val();
      return false; // Salir del bucle cuando se encuentra el nombre de la sección correspondiente
    }
  });

  return seccionSeleccionadaID;
}


var numerosCubiculo = []; // Asegúrate de llenar este array al cargar la página

function editarCubiculo(button) {
  var fila = $(button).closest("tr");
  var numeroCubiculo = fila.find("td:eq(4)").text();

  fila.find("td:eq(4)").empty();
  var inputField = $("<input>")
    .attr("type", "text")
    .attr("class", "inputCubiculo")
    .val(numeroCubiculo)
    .on('input', function(e) {
      var nuevoCubiculo = $(this).val();
      if (isNaN(nuevoCubiculo) && nuevoCubiculo) {
        Swal.fire({
          icon: 'warning',
          title: 'Oops...',
          text: 'Por favor, ingresa solo numeros para el cubículo'
        });
      }
    });
  fila.find("td:eq(4)").append(inputField);

  var editarButton = fila.find(".btnEditarCubiculo");
  editarButton.text("Actualizar");
  editarButton.attr("onclick", "actualizarCubiculo(this)");
}


function actualizarCubiculo(button) {
  var fila = $(button).closest("tr");
  var codigoAlumno = fila.find("td:eq(0)").text();
  var nuevoCubiculo = fila.find(".inputCubiculo").val();

  // Validar que el número de cubículo no esté vacío y sea un número
  if (!nuevoCubiculo || isNaN(nuevoCubiculo)) {
    Swal.fire({
      icon: 'warning',
      title: 'Oops...',
      text: 'Por favor, ingresa un número válido para el cubículo'
    });
    return;
  }

  // Validar que el número de cubículo no esté en uso
  if (numerosCubiculo.includes(nuevoCubiculo)) {
    Swal.fire({
      icon: 'warning',
      title: 'Oops...',
      text: 'El número de cubículo ingresado ya está en uso'
    });
    return;
  }

  // Realizar la solicitud POST para enviar el nuevo valor del cubículo
  $.post("/actualizar_cubiculo", { codigo_alumno: codigoAlumno, nuevo_numero_cubiculo: nuevoCubiculo }, function(response) {
    if (response.success) {
      fila.find("td:eq(4)").text(nuevoCubiculo);
      numerosCubiculo.push(nuevoCubiculo); // Añadir el nuevo número de cubículo a la lista

      var editarButton = fila.find(".btnEditarCubiculo");
      editarButton.text("Editar");
      editarButton.attr("onclick", "editarCubiculo(this)");

      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'El número de cubículo se ha actualizado exitosamente'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Hubo un error al actualizar el número de cubículo, ya esta asignado'
      });
    }
  }).fail(function() {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Hubo un error al comunicarse con el servidor'
    });
  });
}

function limpiarVistaAsistencia() {
  var tablaAsistencia = $("#tabla_asistencia tbody");

  // Vaciar la tabla actual
  tablaAsistencia.empty();
}
