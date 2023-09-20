$(window).on('load', function() {
  $(document).on('submit', '#uploadForm', function(event) {
    event.preventDefault();
    var formData = new FormData(this);
    var csvFile = $('#csvFile').val();

    if (csvFile === '') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione un archivo CSV.'
      });
      return;
    }

    $('#submitBtn').prop('disabled', true);

    Swal.fire({
      title: 'Subiendo archivo...',
      onBeforeOpen: function() {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(response) {
        if (response.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: response.message,
            preConfirm: () => {
              if (response.omitted_records && response.omitted_records.length > 0) {
                Swal.fire({
                  icon: 'info',
                  title: 'Registros Omitidos',
                  html: response.omitted_records.join('<br>'),  // Mostrar los mensajes de registros omitidos como una lista
                  footer: 'Los registros anteriores fueron omitidos durante la subida'
                });
              }
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message
          });
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al subir el archivo: ' + errorThrown
        });
      },
      complete: function() {
        $('#submitBtn').prop('disabled', false);
      }
    });
  });
});
