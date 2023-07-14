$('form').submit(function(e) {
    let nombre = $('#nombre').val();
    let codigo_alumno = $('#codigo_alumno').val();

    if (!nombre) {
        e.preventDefault();  // Prevenir la sumisión del formulario
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se proporcionó el nombre',
        });
        return;
    }

    if (!codigo_alumno) {
        e.preventDefault();  // Prevenir la sumisión del formulario
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se proporcionó el código de alumno',
        });
        return;
    }

    // Validar que el código de alumno comienza con una letra seguida de 9 dígitos
    if (!/^[a-zA-Z]\d{9}$/.test(codigo_alumno)) {
        e.preventDefault();  // Prevenir la sumisión del formulario
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El código de alumno debe comenzar con una letra seguida de exactamente 9 dígitos',
    });
    return;
}


    $.ajax({
        url: '/add',  // Cambia esto a la ruta correcta de tu servidor.
        type: 'POST',  // o el método que estés utilizando
        data: {
            nombre: nombre,
            codigo_alumno: codigo_alumno
        },
        beforeSend: function() {
            // Mostrar el spinner de carga antes de enviar la solicitud
            $("#loadingSpinner").show();
        },
        success: function(response) {
            // Aquí manejamos la respuesta en caso de éxito.
            // Actualizar la interfaz de usuario según sea necesario.
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'El alumno fue agregado correctamente',
            });
        },
        error: function(error) {
            // Aquí manejamos la respuesta en caso de error.
            // Actualizar la interfaz de usuario para mostrar el mensaje de error.
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.responseJSON.error,
            });
        },
        complete: function() {
            // Ocultar el spinner de carga después de completar la solicitud
            $("#loadingSpinner").hide();
        }
    });

    e.preventDefault(); // Prevenir la sumisión del formulario después de la solicitud AJAX
});
