
document.addEventListener('DOMContentLoaded', function() {
    var registrarBtn = document.getElementById('usuarioForm');
    registrarBtn.addEventListener('submit', function(event) {
        console.log("El botón de registrar ha sido pulsado.");

        // Get the form fields
        var codigoAlumnoField = document.getElementById('codigo_alumno');
        var nombreField = document.getElementById('nombre');
        var fechaIngresoField = document.getElementById('fecha_ingreso');
        var cicloAcademicoField = document.getElementById('ciclo_academico');
        var ultimaActualizacionFotoField = document.getElementById('ultima_actualizacion_foto');

        // Check if any of the fields are empty
        if (!codigoAlumnoField.value || !nombreField.value || !fechaIngresoField.value || !cicloAcademicoField.value || !ultimaActualizacionFotoField.value) {
            // Prevent the default form submission behavior
            event.preventDefault();

            // Show an alert message using SweetAlert2
            Swal.fire('Error', 'Por favor, complete todos los campos antes de enviar.', 'error');
        }
    });
});
