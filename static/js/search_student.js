$(document).ready(function() {
    $("#search-form").submit(function(e) {
        e.preventDefault();
        var codigo_alumno = $("#codigo_alumno").val();

        // Validación del formato de código de alumno
        var regex = /^[uU]\d{8,9}$/;
        if (!regex.test(codigo_alumno)) {
            Swal.fire({
                icon: 'warning',
                title: 'Formato Incorrecto',
                text: 'Por favor, ingrese un código válido. Debe ser "U" seguido de 9 dígitos.',
            });
            return; // Terminar aquí si no cumple con el formato
        }

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
                    webcam.style.display = "block";  // Muestra la webcam nuevamente
                    canvas.style.display = "none";  // Oculta el canvas
                    const context = canvas.getContext('2d');
                    context.clearRect(0, 0, canvas.width, canvas.height);  // Limpia el canvas
                    imageCaptured = null;  // Limpia la imagen capturada

                    // Detiene la transmisión de la webcam
                    let stream = webcam.srcObject;
                    let tracks = stream.getTracks();
                    tracks.forEach(function(track) {
                        track.stop();
                    });
                    webcam.srcObject = null;

                    // Vuelve a iniciar la webcam
                    navigator.mediaDevices.getUserMedia({ video: true })
                        .then(stream => {
                            webcam.srcObject = stream;
                        })
                        .catch(error => {
                            console.error("Error accessing the webcam:", error);
                        });
                });


                $("#update-photo-btn").click(function() {
                    $("#webcam-section").show();
                    $("#webcam-section").append(cancelButton);
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
                    webcam.style.display = "none";  // Oculta la webcam
                });

saveBtn.addEventListener('click', function() {
    if (imageCaptured) {
        // Muestra el spinner
        document.getElementById("spinner").style.display = "block";

        $.post('/update_student_image', { image_data: imageCaptured, codigo_alumno: codigo_alumno })
            .done(function(response) {
                Swal.fire({
                    title: 'Por favor espere...',
                    allowOutsideClick: false,
                    onBeforeOpen: () => {
                        Swal.showLoading();
                    },
                    preConfirm: () => {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                // Oculta el spinner
                                document.getElementById("spinner").style.display = "none";

                                if (response.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Imagen guardada',
                                        text: 'Foto actualizada'
                                    });

                                    // Ocultar la cámara y el canvas después de guardar la foto
                                    $("#webcam-section").hide();
                                    let stream = webcam.srcObject;
                                    let tracks = stream.getTracks();
                                    tracks.forEach(function(track) {
                                        track.stop();
                                    });
                                    webcam.srcObject = null;
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: response.message
                                    });
                                }
                                resolve();
                            }, 500);  // Tiempo de espera antes de ocultar el spinner y mostrar el mensaje emergente
                        });
                    }
                });
            })
            .fail(function() {
                // Oculta el spinner
                document.getElementById("spinner").style.display = "none";

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un error al guardar la imagen. Por favor, inténtelo de nuevo.'
                });
            });
    } else {
        Swal.fire({
            icon: 'warning',
            title: 'No se capturó ninguna imagen',
            text: 'Por favor, tome una foto antes de intentar guardar.'
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

