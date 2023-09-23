$(document).ready(function() {

  // Escucha el evento de clic del enlace "1"
$("#enlace-link_1").click(function(e) {
    e.preventDefault();  // Previene el comportamiento por defecto del enlace
    $("#campo-dinamico").empty();  // Vacía el contenido de "campo-dinamico"
    $.ajax({
        url: "/datos_usuario",
        type: "GET",
        success: function(response) {
          $("#campo-dinamico").html(response);

          $(document).on('submit', '#uploadForm', function(event) {
            event.preventDefault();

            const formData = {};
            const formArray = $(this).serializeArray();
            formArray.forEach(item => {
                formData[item.name] = item.value;
            });

            $.ajax({
              url: "/actualizar_usuario",
              type: "POST",
              data: JSON.stringify(formData),
              contentType: "application/json;charset=UTF-8",
              success: function(response) {
                $("#uploadFormResponse").html(response);
              },
              error: function(jqXHR, textStatus, errorThrown) {
                alert("Error al actualizar: " + textStatus);
              }
            });
          });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Error al cargar los datos: " + textStatus);
        }
    });
});

// Escucha el evento de clic del enlace "2"
$("#enlace-link_2").click(function(e) {
  e.preventDefault();
  $("#campo-dinamico").empty();
  // Obtener la URL del template nuevo_registro
  $.ajax({
    url: "/up",
    type: "GET",
    success: function(response) {
      $("#campo-dinamico").html(response);

      $(document).on('submit', '#uploadForm', function(event) {
        event.preventDefault();
        $.ajax({
          url: "/upload",
          type: "POST",
          data: new FormData(this),  // Aquí asumo que estás enviando un formulario
          processData: false,        // Necesario para enviar FormData
          contentType: false,        // Necesario para enviar FormData
          success: function(response) {
            $("#uploadFormResponse").html(response);
          }
        });
      });
    }
  });
});

 // Escucha el evento de clic del enlace "3"
$("#enlace-link_3").click(function(e) {
  e.preventDefault();
  $("#campo-dinamico").empty();

  // Realizar una solicitud GET a "/reg"
  $.ajax({
    url: "/reg",
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

  // Realizar una solicitud GET a "/cargar_registro_usuario"
  $.ajax({
    url: "/cargar_registro_usuario",
    type: "GET",
    success: function(response) {
      $("#campo-dinamico").html(response);

      // Después de agregar el nuevo HTML al DOM, configura el evento de clic.
      $(document).on('click', '#registrar-usuario-btn', function(event) {
        event.preventDefault();

        // Aquí va el código de registro.
        var codigoAlumno = document.getElementById('codigo_alumno').value;
        var nombre = document.getElementById('nombre').value;
        var fechaIngreso = document.getElementById('fecha_ingreso').value;
        var cicloAcademico = document.getElementById('ciclo_academico').value;
        var ultimaActualizacionFoto = document.getElementById('ultima_actualizacion_foto').value;

        // Validación de los campos del formulario
        if (codigoAlumno === '' || nombre === '' || fechaIngreso === '' || cicloAcademico === '' || ultimaActualizacionFoto === '') {
          Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
          return;
        }

        // Realizar una solicitud POST a "/registro_usuario"
        fetch('/registro_usuario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'codigo_alumno': codigoAlumno,
            'nombre': nombre,
            'fecha_ingreso': fechaIngreso,
            'ciclo_academico': cicloAcademico,
            'ultima_actualizacion_foto': ultimaActualizacionFoto
          })
        })
        .then(function(response) {
            return response.text(); // Convert the response to text
        })
        .then(function(mensaje) {
            if (mensaje === "Usuario registrado.") {
                Swal.fire('Éxito', mensaje, 'success');
            } else {
                Swal.fire('Error', mensaje, 'error');
            }
        });
      });
    }
  });
});


// Escucha el evento de clic del enlace "5"
$("#enlace-link_5").click(function(e) {
  e.preventDefault();
  $("#campo-dinamico").empty();

  // Realizar una solicitud GET a "/reg"
  $.ajax({
    url: "/new",
    type: "GET",
    success: function(response) {
      $("#campo-dinamico").html(response);

      // Después de agregar el nuevo HTML al DOM, configura el evento de clic.
      $(document).on('click', '#registrar-btn', function(event) {
        event.preventDefault();
        // Aquí va el código de registro.
            var tipoPerfil = document.getElementById('tipo-perfil').value;
            var tipoDocumento = document.getElementById('tipo-documento').value;
            var numeroDocumento = document.getElementById('numero-documento').value;
            var nombre = document.getElementById('nombre').value;
            var apellidoPaterno = document.getElementById('apellido-paterno').value;
            var apellidoMaterno = document.getElementById('apellido-materno').value;
            var correoElectronico = document.getElementById('correo-electronico').value;
            var celular = document.getElementById('celular').value;
            var sexo = document.getElementById('sexo').value;
            var fechaNacimiento = document.getElementById('fecha-nacimiento').value;
            var claveAsignada = document.getElementById('clave-asignada').value;

            // Validación de los campos del formulario
            if (!/^[0-9]{8}$/.test(numeroDocumento)) {
              Swal.fire('Error', 'Número de documento inválido. Solo se permiten 8 dígitos.', 'error');
              return;
            }
            if (!/^[A-Za-z\s]+$/.test(nombre)) {
              Swal.fire('Error', 'Nombre inválido. Solo se permiten letras.', 'error');
              return;
            }
            if (!/^[A-Za-z\s]+$/.test(apellidoPaterno)) {
              Swal.fire('Error', 'Apellido Paterno inválido. Solo se permiten letras.', 'error');
              return;
            }
            if (!/^[A-Za-z\s]+$/.test(apellidoMaterno)) {
              Swal.fire('Error', 'Apellido Materno inválido. Solo se permiten letras.', 'error');
              return;
            }
            if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(correoElectronico)) {
              Swal.fire('Error', 'Correo Electrónico inválido. Asegúrese de que contiene "@".', 'error');
              return;
            }
            if (!/^[0-9]{9}$/.test(celular)) {
              Swal.fire('Error', 'Número de celular inválido. Solo se permiten 9 dígitos.', 'error');
              return;
            }
            if (fechaNacimiento === '') {
              Swal.fire('Error', 'Seleccione una fecha de nacimiento.', 'error');
              return;
            }
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(claveAsignada)) {
              Swal.fire('Error', 'Clave asignada inválida. Debe contener al menos una letra mayúscula, un número, un símbolo especial y ser de 6 caracteres.', 'error');
              return;
            }
        fetch('/registro', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
          body: new URLSearchParams({
            'tipo_perfil': tipoPerfil,
            'tipo_documento': tipoDocumento,
            'numero_documento': numeroDocumento,
            'nombre': nombre,
            'apellido_paterno': apellidoPaterno,
            'apellido_materno': apellidoMaterno,
            'correo_electronico': correoElectronico,
            'celular': celular,
            'sexo': sexo,
            'fecha_nacimiento': fechaNacimiento,
            'clave_asignada': claveAsignada
          })
        })// Necesario para enviar FormData
          .then(function(response) {
            $("#campo-dinamico").html(response);
          })
      });
    }
  });
});

  // Escucha el evento de clic del enlace "6"
  $("#enlace-link_6").click(function(e) {
      e.preventDefault();  // Previene el comportamiento por defecto del enlace
      $("#campo-dinamico").empty();  // Vacía el contenido de "campo-dinamico"
  });

    // Escucha el evento de clic del enlace "7"
  $("#enlace-link_7").click(function(e) {
    e.preventDefault();  // Previene el comportamiento por defecto del enlace
    $("#campo-dinamico").empty();  // Vacía el contenido de "campo-dinamico"
    // Agrega aquí el código para cargar el contenido de "link 6"
  });

});
