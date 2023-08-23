document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('correo');
    const validarCaptchaBtn = document.getElementById('validar-captcha-btn');
    const enviarBtn = document.getElementById('enviar_btn');  // Referencia al botón "Enviar"

    // Ocultar el botón "Enviar" inicialmente
    enviarBtn.style.display = 'none';

    validarCaptchaBtn.addEventListener('click', function(event) {
        // Verificar si el correo existe
        fetch('/verificar_correo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo: emailInput.value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Si el correo existe, validar el captcha
                let recaptchaValue = grecaptcha.getResponse();
                if (recaptchaValue.length == 0) {
                    Swal.fire('Atención', 'Por favor, completa el reCAPTCHA.', 'warning');
                    return;
                }

                // Si el captcha es válido
                emailInput.setAttribute('readonly', true);
                Swal.fire('¡Éxito!', 'Captcha validado correctamente.', 'success');

                // Hacer una solicitud AJAX para generar y enviar el PIN
                fetch('/generar_pin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        correo: emailInput.value
                    })
                })
                .then(response => response.json())
                .then(pinData => {
                    if (pinData.success) {
                        // Mostrar el campo del PIN y los botones asociados
                        document.getElementById('pin-field').style.display = 'block';
                        document.getElementById('validate-pin-btn').style.display = 'block';
                    } else {
                        Swal.fire('Error', 'Hubo un error al enviar el PIN. Por favor, intenta de nuevo.', 'error');
                    }
                });

            } else {
                Swal.fire('Atención', 'Correo no registrado.', 'warning');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'Ocurrió un error al verificar el correo. Inténtalo de nuevo.', 'error');
        });
    });

    // Lógica para validar el PIN
    $('#validate-pin-btn').click(function () {
        const pinValue = $('#pin').val();
        $.ajax({
            url: '/validar_pin',  // Endpoint que valida el PIN
            method: 'POST',
            data: JSON.stringify({ pin: pinValue }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {  // Si el PIN es válido
                    $('#pin').attr('readOnly', true);
                    Swal.fire('¡Éxito!', 'PIN validado correctamente.', 'success');
                    $('#new-password-fields').show();
                    enviarBtn.style.display = 'block';
                } else {
                    Swal.fire('Error', 'PIN incorrecto. Inténtalo de nuevo.', 'error');
                }
            },
            error: function() {
                Swal.fire('Error', 'Hubo un error al validar el PIN. Inténtalo de nuevo.', 'error');
            }
        });
    });

    // Al intentar actualizar la contraseña
    document.querySelector('form').addEventListener('submit', function(event) {
        event.preventDefault();

        // Obtener la nueva contraseña y la confirmación
        let nuevaContraseña = document.getElementById('nueva_contraseña').value;
        let confirmación = document.getElementById('confirmación').value;

        if (nuevaContraseña !== confirmación) {
            Swal.fire('Atención', 'Las contraseñas no coinciden.', 'warning');
            return;
        }

        let formData = new URLSearchParams();
        formData.append('nueva_contraseña', nuevaContraseña);
        formData.append('repetir_contraseña', confirmación);
        formData.append('correo', document.getElementById('correo').value);

        fetch('/actualizar_contraseña', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire('¡Éxito!', data.message, 'success');
                window.location.href = "/logadm";
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'Ha ocurrido un error al intentar actualizar la contraseña.', 'error');
        });
    });
});
