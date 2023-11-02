document.addEventListener('DOMContentLoaded', function() {
    var registrarBtn = document.getElementById('btn-registrar');
    var formElement = document.getElementById('usuarioForm');

    registrarBtn.addEventListener('click', function(event) {
        event.preventDefault();
        console.log("El botón de registrar ha sido pulsado.");

        var codigoAlumnoField = document.getElementById('codigo_alumno');
        var nombreField = document.getElementById('nombre');
        var fechaIngresoField = document.getElementById('fecha_ingreso');
        var cicloAcademicoField = document.getElementById('ciclo_academico');

        if (!codigoAlumnoField.value) {
            Swal.fire('Error', 'El campo Código del Alumno no puede estar vacío.', 'error');
            return;
        }

        if (!/^[Uu]\d{8}$/.test(codigoAlumnoField.value)) {
            Swal.fire('Error', 'El campo Código del Alumno debe comenzar con "U" o "u" seguido de 8 dígitos.', 'error');

            //Swal.fire('Error', 'El campo Código del Alumno solo debe contener números.', 'error');
            return;
        }

        if (!nombreField.value) {
            Swal.fire('Error', 'El campo Nombre no puede estar vacío.', 'error');
            return;
        }

        if (!fechaIngresoField.value) {
            Swal.fire('Error', 'El campo Fecha de Ingreso no puede estar vacío.', 'error');
            return;
        }

        if (!cicloAcademicoField.value) {
            Swal.fire('Error', 'El campo Ciclo Académico no puede estar vacío.', 'error');
            return;
        }

         var today = new Date().toISOString().split('T')[0];
        document.getElementById('ultima_actualizacion_foto').value = today;

        var formData = new FormData(formElement);

        $.ajax({
            type: "POST",
            url: "/registro_usuario",
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.status === "success") {
                    Swal.fire('Éxito', response.message, 'success');
                    // Limpiar el formulario si es necesario
                    formElement.reset();
                } else {
                    Swal.fire('Error', response.message, 'error');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                Swal.fire('Error', 'Ocurrió un error inesperado durante el registro.', 'error');
            }
        });
    });
});
