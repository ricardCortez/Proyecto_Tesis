document.addEventListener('DOMContentLoaded', function() {
    var rol = localStorage.getItem('rol') || 'Invitado';
    console.log("Tipo de Perfil:", rol);

    const emailInput = document.getElementById('correo');
    const validarCaptchaBtn = document.getElementById('validar-captcha-btn');
    const validarCorreoBtn = document.getElementById('validar-correo-btn');
    const enviarBtn = document.getElementById('enviar_btn');
    const captchaDiv = document.getElementById('captcha-div');

    // Ocultar elementos por defecto
    enviarBtn.style.display = 'none';
    document.getElementById('pin-field').style.display = 'none';
    document.getElementById('validate-pin-btn').style.display = 'none';
    validarCorreoBtn.style.display = 'none';
    validarCaptchaBtn.style.display = 'none';

    if (rol === 'Administrador') {
        captchaDiv.style.display = 'block';
        validarCaptchaBtn.style.display = 'block';
        validarCaptchaBtn.addEventListener('click', function(event) {
            // Verificamos si el campo de correo está vacío
            if (!emailInput.value.trim()) {
                Swal.fire('Atención', 'Por favor, ingrese un correo.', 'warning');
                return;
            }
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

                    // Generar y enviar PIN
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
                            document.getElementById('correo').readOnly = true;
                            document.getElementById('pin-field').style.display = 'block';
                            document.getElementById('validate-pin-btn').style.display = 'block';
                            Swal.fire('¡Éxito!', 'Correo validado correctamente. Se envió un PIN a tu correo.', 'success');
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
    } else {
        // Para Personal administrativo y Docente
        captchaDiv.style.display = 'none'; // Aquí ocultamos el captcha por completo para otros roles.
        validarCorreoBtn.style.display = 'block';
        validarCorreoBtn.addEventListener('click', function(event) {
            // Verificamos si el campo de correo está vacío
            if (!emailInput.value.trim()) {
                Swal.fire('Atención', 'Por favor, ingrese un correo.', 'warning');
                return;
            }
            // Aquí simplemente verificas si el correo es válido
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
                    // Generar y enviar PIN
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
                            document.getElementById('correo').readOnly = true;
                            document.getElementById('pin-field').style.display = 'block';
                            document.getElementById('validate-pin-btn').style.display = 'block';
                            Swal.fire('¡Éxito!', 'Correo validado correctamente. Se envió un PIN a tu correo.', 'success');
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
    }

    // Lógica para validar el PIN
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
