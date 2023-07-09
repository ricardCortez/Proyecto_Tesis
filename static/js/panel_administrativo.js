$(document).ready(function() {

  // Escucha el evento de clic del enlace "1"
  $("#enlace-link_1").click(function(e) {
    e.preventDefault();  // Previene el comportamiento por defecto del enlace
    $("#campo-dinamico").empty();  // Vacía el contenido de "campo-dinamico"
    // Agrega aquí el código para cargar el contenido de "link 1"
  });

  // Escucha el evento de clic del enlace "2"
  $("#enlace-link_2").click(function(e) {
    e.preventDefault();  // Previene el comportamiento por defecto del enlace
    $("#campo-dinamico").empty();  // Vacía el contenido de "campo-dinamico"
    $.ajax({
      url: "/per",  // La ruta de tu servidor que devuelve el HTML de attendance_aula
      type: "GET",
      success: function(response) {
        $("#campo-dinamico").html(response);
      }
    });
  });

  // Escucha el evento de clic del enlace "3"
  $("#enlace-link_3").click(function(e) {
    e.preventDefault();  // Previene el comportamiento por defecto del enlace
    $("#campo-dinamico").empty();  // Vacía el contenido de "campo-dinamico"
    $.ajax({
      url: "/doc",  // La ruta de tu servidor que devuelve el HTML de attendance_laboratorio
      type: "GET",
      success: function(response) {
        $("#campo-dinamico").html(response);
      }
    });
  });

  // Escucha el evento de clic del enlace "4"
  $("#enlace-link_4").click(function(e) {
    e.preventDefault();
  $("#campo-dinamico").empty();
      $.ajax({
        url: '/reporte_asistencia',
        type: 'GET',
        success: function(data) {
          $("#campo-dinamico").html(data);
        },
        error: function(error) {
          console.log('Ha ocurrido un error al cargar el template', error);
        }
      });
  });

  // Escucha el evento de clic del enlace "5"
  $("#enlace-link_5").click(function(e) {
    e.preventDefault();
  $("#campo-dinamico").empty();
      $.ajax({
        url: '/reporte',
        type: 'GET',
        success: function(data) {
          $("#campo-dinamico").html(data);
        },
        error: function(error) {
          console.log('Ha ocurrido un error al cargar el template', error);
        }
      });
  });

  // Escucha el evento de clic del enlace "6"
  $("#enlace-link_6").click(function(e) {
      e.preventDefault();  // Previene el comportamiento por defecto del enlace
      $("#campo-dinamico").empty();
      $.ajax({
        url: '/search',
        type: 'GET',
        success: function(data) {
          $("#campo-dinamico").html(data);
        },
        error: function(error) {
          console.log('Ha ocurrido un error al cargar el template', error);
        }
      });
  });

    // Escucha el evento de clic del enlace "7"
  $("#enlace-link_7").click(function(e) {
    e.preventDefault();
  $("#campo-dinamico").empty();
      $.ajax({
        url: '/reporte docente',
        type: 'GET',
        success: function(data) {
          $("#campo-dinamico").html(data);
        },
        error: function(error) {
          console.log('Ha ocurrido un error al cargar el template', error);
        }
      });
  });

});
