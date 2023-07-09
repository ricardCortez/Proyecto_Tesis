$(document).ready(function() {
  // Obtener la lista de docentes y sus secciones mediante una petición AJAX
  $.ajax({
    url: '/get_teachers_sections',
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      // Recorrer los datos obtenidos y construir la tabla
      data.forEach(function(docente) {
        var row = '<tr>' +
          '<td>' + docente.numero_documento + '</td>' +
          '<td>' + docente.nombre + '</td>';

        if (docente.secciones.length > 0) {
          var secciones = docente.secciones.map(function(seccion) {
            return '<li>' + seccion + '</li>';
          }).join('');

          row += '<td><ul>' + secciones + '</ul></td>';
        } else {
          row += '<td>No secciones asignadas</td>';
        }

        row += '</tr>';

        $('tbody').append(row);
      });
    },
    error: function() {
      console.log('Error al obtener la lista de docentes y secciones.');
    }
  });
});
