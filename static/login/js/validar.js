$(document).ready(function() {
  // Recuperar el rol desde localStorage
  var rol = localStorage.getItem('rol') || 'Invitado';
  console.log("Tipo de Perfil:", rol);

  // Verificar si se recuperó un rol
  if (rol) {
    // Actualizar el texto del span con el rol seleccionado
    $('#userRole').text(rol);
    // Mostrar el div de reCAPTCHA solo si el rol es "Administrador"
    if (rol === 'Administrador') {
      $('#captcha-div').show();
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

    // Añadir un event listener para el botón "Validar Captcha"
  $('#validar-captcha-btn').on('click', function() {
    validarRecaptcha();
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
        'rol': rol,
        'g-recaptcha-response': grecaptcha.getResponse() // Incluir la respuesta del reCAPTCHA
      },
      success: function(data) {
        // Si el inicio de sesión es exitoso, mostrar un mensaje de éxito y redirigir a la página de inicio
         let redirectUrl;
          switch (data.rol) {
            case 'Administrador':
              redirectUrl = '/administrador';
              break;
            case 'Personal administrativo':
              redirectUrl = '/administrativo';  // Sustituir por la ruta correcta para el personal administrativo
              break;
            case 'Docente':
              redirectUrl = '/docente';  // Sustituir por la ruta correcta para el docente
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
        if (jqXHR.responseJSON.message === 'Inicio de sesión fallido. Por favor verifique su DNI y contraseña.') {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Usuario o contraseña incorrecta.',
          });
          } else if (jqXHR.responseJSON.message === 'El rol seleccionado no coincide con las credenciales proporcionadas.') {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'El rol seleccionado no coincide con las credenciales proporcionadas.',
        });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Por favor, complete todos los campos.',
          });
        }
      }
    });
  });
});
function validarRecaptcha() {
    var recaptchaResponse = grecaptcha.getResponse();
    if (recaptchaResponse) {
      // Enviar la respuesta del reCAPTCHA al servidor para su verificación
      $.ajax({
        type: "POST",
        url: "/verify_recaptcha",
        data: {
          'g-recaptcha-response': recaptchaResponse
        },
        success: function(data) {
          if (data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Recaptcha validado con éxito',
            });
            isRecaptchaValidated = true; // Actualizar la variable a true una vez que el reCAPTCHA es validado con éxito
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Validación de Recaptcha fallida',
              text: 'Por favor, inténtelo de nuevo.',
            });
            grecaptcha.reset();  // Resetear el reCAPTCHA para permitir un nuevo intento
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          Swal.fire({
            icon: 'error',
            title: 'Error en la validación de Recaptcha',
            text: 'Por favor, inténtelo de nuevo.',
          });
          grecaptcha.reset();  // Resetear el reCAPTCHA para permitir un nuevo intento
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Recaptcha no completado',
        text: 'Por favor, complete el Recaptcha.',
      });
    }
  }