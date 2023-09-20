    $(document).ready(function() {
        // Search user by DNI
        $('#search_button').click(function() {
            const dni = $('#search_dni').val();
            $.post('/buscar_usuario_por_dni', { dni: dni }, function(data, status) {
                if (status === 'success' && data) {
                    // Display user details
                    $('#tipo_perfil_text').text(data.tipo_perfil);
                    $('#numero_documento_text').text(data.numero_documento);
                    $('#nombre_text').text(data.nombre);
                    $('#apellido_paterno_text').text(data.apellido_paterno);
                    $('#apellido_materno_text').text(data.apellido_materno);
                    $('#correo_electronico_text').text(data.correo_electronico);
                    $('#celular_text').text(data.celular);
                    $('.user-details').show();
                } else {
                    alert('Usuario no encontrado');
                }
            });
        });

        // Edit user details
        $('#editButton').click(function() {
            $('.data-input').show();
            $('#updateButton').css('display', 'block');
            $('#editButton').hide();
            $('#cancelButton').show();
        });

        // Cancel edit
        $('#cancelButton').click(function() {
            $('.data-input').hide();
            $('#updateButton').css('display', 'none');
            $('#editButton').show();
            $('#cancelButton').hide()
        });


       // Update user details
        $('#updateButton').click(async function() {
    const dni = $('#numero_documento_text').text();
    const correo_electronico = $('#correo_electronico_input').val();
    const celular = $('#celular_input').val();

    // Validación del correo electrónico
    if (!correo_electronico.includes('@')) {
        Swal.fire('Error', 'Por favor, ingrese un correo electrónico válido.', 'error');
        return;
    }

    // Validación del número de celular
    if (!/^\d{9}$/.test(celular)) {
        Swal.fire('Error', 'Por favor, ingrese un número de celular válido de 9 dígitos.', 'error');
        return;
    }

    try {
        const response = await $.post('/update_usuario', {
            dni: dni,  // Incluye el dni en la solicitud
            correo_electronico: correo_electronico,
            celular: celular
        });

        if (response.message === 'Datos actualizados correctamente') {
            Swal.fire('Éxito', 'Datos actualizados correctamente', 'success');
        } else {
            Swal.fire('Error', 'Error al actualizar datos', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Error al enviar la solicitud: ' + error, 'error');
    }
});

    });

// Función para mostrar u ocultar la sección de actualización de contraseña
function toggleUpdatePasswordSection() {
    const updatePasswordSection = document.getElementById('updatePasswordSection');
    if (updatePasswordSection.style.display === 'none') {
        updatePasswordSection.style.display = 'block';
        updatePasswordButton.textContent = 'Cancelar';
    } else {
        updatePasswordSection.style.display = 'none';
        updatePasswordButton.textContent = 'actualizar Contraseña';
    }
}

// Función para actualizar la contraseña
async function updatePassword() {
    const nuevaContraseña = document.getElementById('nueva_contraseña').value;
    const confirmacionContraseña = document.getElementById('confirmacion_contraseña').value;

    // Validar que los campos no estén vacíos
    if (!nuevaContraseña || !confirmacionContraseña) {
        Swal.fire('Error', 'Ambos campos son obligatorios.', 'error');
        return;
    }

    // Validar que las contraseñas coincidan
    if (nuevaContraseña !== confirmacionContraseña) {
        Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
        return;
    }

    // Enviar la solicitud de actualización de contraseña al servidor
    try {
        const response = await fetch('/actualizar_contraseña', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nueva_contraseña: nuevaContraseña,
                confirmacion_contraseña: confirmacionContraseña
            })
        });

        // Procesar la respuesta del servidor
        const data = await response.json();
        if (response.status === 200) {
            Swal.fire('¡Éxito!', 'Contraseña actualizada correctamente.', 'success');
        } else {
            Swal.fire('Error', 'Error al actualizar la contraseña.', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Ocurrió un error al enviar la solicitud.', 'error');
    }
}
