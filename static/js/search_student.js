$("#search-form").submit(function(e) {
  e.preventDefault();

  var codigo_alumno = $("#codigo_alumno").val();

  $.post("/search_student", { codigo_alumno: codigo_alumno })
    .done(function(data) {
      $("#campo-dinamico").html(data);

      if (data.ruta_imagen) {
        $("#myImage").attr("src", data.ruta_imagen);
      } else {
        console.log("No se encontraron imágenes para el usuario");
      }
    })
    .fail(function() {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error en la búsqueda. Por favor, inténtelo de nuevo.',
      });
    });
});
