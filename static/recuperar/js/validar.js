document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('correo');
    const validarCaptchaBtn = document.getElementById('validar-captcha-btn');
    const newPasswordFields = document.getElementById('new-password-fields');

    // Ocultar el botón "Enviar" inicialmente
    $('#enviar_btn').hide();

    validarCaptchaBtn.addEventListener('click', function(event) {
        let recaptchaValue = grecaptcha.getResponse();
        if (recaptchaValue.length == 0) {
            Swal.fire('Atención', 'Por favor, completa el reCAPTCHA.', 'warning');
            return;
        }

        emailInput.setAttribute('readonly', true);
        // Mostrar mensaje de éxito del captcha
        Swal.fire('¡Éxito!', 'Captcha validado correctamente.', 'success');

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
        .then(data => {
            if (data.success) {
                document.getElementById('pin-field').style.display = 'block';
                document.getElementById('validate-pin-btn').style.display = 'block';

                const solicitarNuevoPinBtn = document.createElement('button');
                solicitarNuevoPinBtn.textContent = 'Solicitar nuevo PIN';
                solicitarNuevoPinBtn.addEventListener('click', function() {
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
                    .then(data => {
                        if (data.success) {
                            Swal.fire('¡Éxito!', 'Se ha enviado un nuevo PIN a tu correo.', 'success');
                        } else {
                            Swal.fire('Error', 'Hubo un error al enviar el nuevo PIN. Por favor, intenta de nuevo.', 'error');
                        }
                    });
                });

                document.getElementById('pin-field').appendChild(solicitarNuevoPinBtn);
            } else {
                Swal.fire('Error', 'Hubo un error al enviar el PIN. Por favor, intenta de nuevo.', 'error');
            }
        });
    });

    document.querySelector('form').addEventListener('submit', function(event) {
        event.preventDefault();

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
                Swal.fire('¡Éxito!', data.message, 'success').then(() => {
                    window.location.href = "/logadm";
                });
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

$('#validate-pin-btn').click(function () {
    const pinValue = $('#pin').val();
    $.ajax({
        url: '/validar_pin',
        method: 'POST',
        data: JSON.stringify({ pin: pinValue }),
        contentType: 'application/json',
        success: function(response) {
            if (response.success) {
                $('#pin').attr('readOnly', true);
                Swal.fire('¡Éxito!', 'PIN validado correctamente.', 'success');
                $('#new-password-fields').show();
                $('#enviar_btn').show();
            } else {
                Swal.fire('Atención', 'PIN incorrecto. Inténtalo de nuevo.', 'warning');
            }
        },
        error: function() {
            Swal.fire('Error', 'Hubo un error al validar el PIN. Inténtalo de nuevo.', 'error');
        }
    });
});
