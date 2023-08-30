$(document).ready(function() {
    $("#search-form").submit(function(e) {
        e.preventDefault();
        var codigo_alumno = $("#codigo_alumno").val();
        $.post("/search_student_combined", { codigo_alumno: codigo_alumno })
            .done(function(data) {
                $("#campo-dinamico").html(data);

                // Webcam integration
                let webcam = document.getElementById('webcam');
                let canvas = document.getElementById('canvas');
                let captureBtn = document.getElementById('capture-btn');
                let saveBtn = document.getElementById('save-btn');
                let cancelButton = document.createElement('button');  // Botón de cancelar
                cancelButton.id = "cancel-btn";  // Asignando un id al botón
                let imageCaptured = null;

                // Configuración del botón de cancelar
                cancelButton.innerText = "Cancelar";
                cancelButton.addEventListener('click', function() {
                    $("#webcam-section").hide();
                    let stream = webcam.srcObject;
                    let tracks = stream.getTracks();
                    tracks.forEach(function(track) {
                        track.stop();
                    });
                    webcam.srcObject = null;
                });

                $("#update-photo-btn").click(function() {
                    $("#webcam-section").show();
                    $("#webcam-section").append(cancelButton); // Agregar el botón de cancelar
                    navigator.mediaDevices.getUserMedia({ video: true })
                        .then(stream => {
                            webcam.srcObject = stream;
                        })
                        .catch(error => {
                            console.error("Error accessing the webcam:", error);
                        });
                });

                captureBtn.addEventListener('click', function() {
                    const context = canvas.getContext('2d');
                    context.drawImage(webcam, 0, 0, canvas.width, canvas.height);
                    imageCaptured = canvas.toDataURL('image/png');
                    canvas.style.display = 'block';
                    // Oculta la cámara y el canvas una vez que la foto ha sido tomada
                    $("#webcam-section").hide();
                });

                saveBtn.addEventListener('click', function() {
                    if (imageCaptured) {
                        $.post('/update_student_image', { image_data: imageCaptured, codigo_alumno: codigo_alumno })
                            .done(function(response) {
                                if (response.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Imagen guardada',
                                        text: response.message,
                                    });
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: response.message,
                                    });
                                }
                            })
                            .fail(function() {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Hubo un error al guardar la imagen. Por favor, inténtelo de nuevo.',
                                });
                            });
                    } else {
                        Swal.fire({
                            icon: 'warning',
                            title: 'No se capturó ninguna imagen',
                            text: 'Por favor, tome una foto antes de intentar guardar.',
                        });
                    }
                });
            })
            .fail(function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error en la búsqueda. Por favor, inténtelo de nuevo.',
                });
            });
    });
});
