$(document).ready(function() {
  // Recuperar el rol desde localStorage
  var rol = localStorage.getItem('rol') || 'Invitado';
  console.log("Tipo de Perfil:", rol);

  // Variable para almacenar el estado de validación de reCAPTCHA (ahora es irrelevante, pero lo dejaremos aquí por si lo necesitas en el futuro)
  var isRecaptchaValidated = true;

  // Verificar si se recuperó un rol
  if (rol) {
    // Actualizar el texto del span con el rol seleccionado
    $('#userRole').text(rol);
    // Mostrar el div de reCAPTCHA solo si el rol es "Administrador"
    if (rol === 'Administrador') {
      $('#captcha-div').hide();
    } else {
      $('#captcha-div').hide();
    }
  } else {
    console.log('No se pudo recuperar el rol desde el almacenamiento local');
  }

  // Agregar el listener para convertir el texto a mayúsculas
  const username = document.querySelector('input[name="usuario"]');
  const password = document.querySelector('input[name="contrasena"]');

  username.addEventListener('keyup', function() {
    this.value = this.value.toUpperCase();
  });

  $('form[name="formularioInicioSesion"]').on('submit', function(e) {
    // Evitar que el formulario se envíe de la forma tradicional
    e.preventDefault();

    // Obtener los valores del formulario
    var usuario = username.value;
    var contrasena = password.value;

    // Verificar si los campos están vacíos
    if (usuario === "" || contrasena === "") {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Por favor, complete todos los campos.',
      });
      return;
    }

    // Enviar los datos a tu servidor para la autenticación
    $.ajax({
      type: "POST",
      url: "/login",
      data: {
        'usuario': usuario,
        'contrasena': contrasena,
        'rol': rol
      },
      success: function(data) {
        // Si el inicio de sesión es exitoso, mostrar un mensaje de éxito y redirigir a la página de inicio
        let redirectUrl;
        switch (data.rol) {
          case 'Administrador':
            redirectUrl = '/administrador';
            break;
          case 'Personal administrativo':
            redirectUrl = '/administrativo';
            break;
          case 'Docente':
            redirectUrl = '/docente';
            break;
          default:
            redirectUrl = '/';  // En caso de que el rol devuelto no coincida con ninguno de los esperados, redirige a la página de inicio
        }
        Swal.fire({
          icon: 'success',
          title: 'Inicio de sesión exitoso',
          text: 'Bienvenido!',
          timer: 2000, // Tiempo en milisegundos que se mostrará el mensaje antes de redirigir.
          showConfirmButton: false,
          onClose: () => {
            window.location.href = redirectUrl;
          }
        });
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // Si hay un error (es decir, el inicio de sesión no es exitoso), mostrar un error
        console.log(jqXHR.responseJSON); // Añade esta línea para imprimir la respuesta del servidor
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: jqXHR.responseJSON.message,
        });
      }
    });
  });
});
