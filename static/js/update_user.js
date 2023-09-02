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
            $('#update_password_button').show();
            $('#updateButton').css('display', 'block');
        });

        // Cancel edit
        $('#cancelButton').click(function() {
            $('.data-input').hide();
            $('#update_password_button').hide();
            $('#updateButton').css('display', 'none');
        });

        // Update password
        $('#update_password_button').click(function() {
            const nueva_contraseña = $('#nueva_contraseña_input').val();
            const repetir_contraseña = $('#repetir_contraseña_input').val();
            const correo = $('#correo_electronico_text').text();

            if (nueva_contraseña !== repetir_contraseña) {
                alert('Las contraseñas no coinciden');
                return;
            }

            $.post('/actualizar_contraseña', {
                nueva_contraseña: nueva_contraseña,
                repetir_contraseña: repetir_contraseña,
                correo: correo
            }, function(data, status) {
                if (status === 'success' && data.success) {
                    alert(data.message);
                } else {
                    alert('Error al actualizar la contraseña');
                }
            });
        });

        // Update user details
        $('#updateButton').click(function() {
            const dni = $('#numero_documento_text').text();
            const correo_electronico = $('#correo_electronico_input').val();
            const celular = $('#celular_input').val();

            $.post('/update_usuario', {
                dni: dni,
                correo_electronico: correo_electronico,
                celular: celular
            }, function(data, status) {
                if (status === 'success') {
                    alert('Datos actualizados correctamente');
                } else {
                    alert('Error al actualizar datos');
                }
            });
        });
    });
