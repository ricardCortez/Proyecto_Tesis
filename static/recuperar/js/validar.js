document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('correo');
    const validarCaptchaBtn = document.getElementById('validar-captcha-btn');
    const newPasswordFields = document.getElementById('new-password-fields');
    const enviarBtn = document.getElementById('enviar_btn');  // Referencia al botón "Enviar"

    // Ocultar el botón "Enviar" inicialmente
    enviarBtn.style.display = 'none';

    // Al hacer clic en el botón de validar
    validarCaptchaBtn.addEventListener('click', function(event) {
        // Si el captcha es correcto
        let recaptchaValue = grecaptcha.getResponse();
        if(recaptchaValue.length == 0) {
            alert("Por favor, completa el reCAPTCHA.");
            return;
        }

        // Hace que el campo de correo electrónico sea de solo lectura
        emailInput.setAttribute('readonly', true);
        // Mostrar los campos para la nueva contraseña
        newPasswordFields.style.display = 'block';
        // Mostrar el botón "Enviar"
        enviarBtn.style.display = 'block';  // Muestra el botón "Enviar"
    });

    // Al intentar actualizar la contraseña
    document.querySelector('form').addEventListener('submit', function(event) {
        event.preventDefault();

        // Obtener la nueva contraseña y la confirmación
        let nuevaContraseña = document.getElementById('nueva_contraseña').value;
        let confirmación = document.getElementById('confirmación').value;

        if (nuevaContraseña !== confirmación) {
            alert("Las contraseñas no coinciden.");
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
                alert(data.message);
                window.location.href = "/logadm";
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Ha ocurrido un error al intentar actualizar la contraseña.");
        });
    });
});
