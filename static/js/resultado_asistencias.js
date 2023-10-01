$(document).ready(function() {
    $("#student-search-form").submit(function(e) {
        e.preventDefault();
        var codigo_alumno = $("#codigo_alumno").val();

        // Realizar una sola solicitud a /resultado_asistencias
        $.post("/resultado_asistencias", { codigo_alumno: codigo_alumno })
            .done(function(data) {
                // Procesar la respuesta y actualizar el DOM
                $("#campo-dinamico").html(data);

                // Llamar a la función para inicializar DataTables
                inicializarDataTables();
            })
            .fail(function() {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Error en la búsqueda', });
            });
    });
});

// Función para inicializar DataTables
function inicializarDataTables() {
    $('.asistencias-table').DataTable();
}
