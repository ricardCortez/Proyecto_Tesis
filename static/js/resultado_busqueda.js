$(document).ready(function() {
  var usuarioId = $("#seccion").data("usuario-id");  // Almacena el ID de sesión en una variable global

  console.log("ID del usuario fuera:", usuarioId);

  cargarSecciones(usuarioId);

$("#student-search-form").submit(function(e) {
    e.preventDefault();
    var codigo_alumno = $("#codigo_alumno").val();
    var seccion_id = $("#seccion").val();

    // Realizar una sola solicitud a /search_student_unificado
    $.post("/search_student_unificado", { codigo_alumno: codigo_alumno, seccion: seccion_id })
        .done(function(data) {
            console.log(data);
            // Procesar la respuesta unificada de /search_student_unificado
            $("#campo-dinamico").html(data);
        })
        .fail(function() {
            Swal.fire({
                icon: 'error',
                title: 'Error al buscar alumno',
                text: 'El alumno no existe en el sistema.',
            });
        });
});


// Resto del código...
    function cargarSecciones(usuarioId) {
      console.log("ID del usuario dentro:", usuarioId);

      $.get("/obtener_secciones", function(secciones) {
        var selectElement = $("#seccion");

        // Vaciar el menú desplegable actual
        selectElement.empty();

        secciones.forEach(function(seccion) {
          // Crear una nueva opción y agregarla al menú desplegable
          var optionElement = $("<option>")
            .val(seccion.id)
            .text(seccion.nombre_seccion);

          selectElement.append(optionElement);
        });
      });
    }
});