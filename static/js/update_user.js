$(document).ready(function() {

    function toggleEdit() {
        let isEditing = $("#edit_update_button").text() === "Actualizar";

        if (isEditing) {
            // Recoger los valores de los campos editados
            let dataToUpdate = {
                dni: $("#numero_documento_text").text(),
                nombre: $("#nombre_input").val(),
                apellido_paterno: $("#apellido_paterno_input").val(),
                apellido_materno: $("#apellido_materno_input").val(),
                correo_electronico: $("#correo_electronico_input").val(),
                celular: $("#celular_input").val(),
                fecha_naimiento: $("#fecha_naimiento_input").val()
            };

            // Enviar una solicitud al servidor para actualizar los datos
            $.post("/update_usuario", dataToUpdate)
                .done(function(data) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Éxito',
                        text: 'Datos actualizados correctamente.',
                    });
                })
                .fail(function() {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Ocurrió un error al actualizar los datos.',
                    });
                });

            // Cambiar el texto del botón
            $("#edit_update_button").text("Editar");

            // Ocultar el botón de cancelar
            $("#cancel_button").hide();
            // Mostrar los spans y ocultar los inputs
            $("[id$='_text']").show();
            $("[id$='_input']").hide();

        } else {
            // Mostrar los inputs y ocultar los spans
            $("[id$='_text']").hide();
            $("[id$='_input']").show();

            // Cambiar el texto del botón
            $("#edit_update_button").text("Actualizar");

            // Mostrar el botón de cancelar
            $("#cancel_button").show();
        }
    }

    function cancelEdit() {
        // Mostrar los spans y ocultar los inputs
        $("[id$='_text']").show();
        $("[id$='_input']").hide();

        // Cambiar el texto del botón de edición
        $("#edit_update_button").text("Editar");

        // Ocultar el botón de cancelar
        $("#cancel_button").hide();
    }

    function searchUserByDNI() {
        var dni_usuario = $("#search_dni").val();

        $.post("/buscar_usuario_por_dni", { dni: dni_usuario })
            .done(function(data) {
                // Si la solicitud es exitosa, actualiza los campos del formulario con los resultados de la búsqueda
                $("#tipo_perfil_text").text(data.tipo_perfil);
                $("#numero_documento_text").text(data.numero_documento);
                $("#nombre_text").text(data.nombre);
                $("#apellido_paterno_text").text(data.apellido_paterno);
                $("#apellido_materno_text").text(data.apellido_materno);
                $("#correo_electronico_text").text(data.correo_electronico);
                $("#celular_text").text(data.celular);
                $("#fecha_naimiento_text").text(data.fecha_naimiento);

                // Mostrar el div con clase .field que contiene los resultados
                $(".field").show();

                // Mostrar el botón "Editar/Actualizar"
                $("#edit_update_button").show();
            })
            .fail(function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error en la búsqueda o no se encontró un usuario con ese DNI.',
                });
            });
    }
function changePassword() {
        let newPassword = $("#newPassword").val();
        let repeatPassword = $("#repeatPassword").val();

        if (newPassword !== repeatPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas no coinciden.',
            });
            return;
        }

        // Aquí enviamos la contraseña al servidor para actualizarla
        $.post("/update_usuario", { clave_asignada: newPassword })
            .done(function(data) {
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Contraseña actualizada correctamente.',
                });
                // Cerrar la modal
                $("#passwordModal").hide();
            })
            .fail(function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un error al actualizar la contraseña.',
                });
            });
    }

    // Mostrar la modal cuando se hace clic en el botón de cambio de contraseña
    $("#changePassword").click(function() {
        $("#passwordModal").show();
    });

    // Cerrar la modal cuando se hace clic en el botón de cierre
    $("#closeModal").click(function() {
        $("#passwordModal").hide();
    });

    // Llamar a la función changePassword cuando se hace clic en el botón de guardar en la modal
    $("#savePassword").click(changePassword);

    // Resto de los eventos
    $("#search_button").click(searchUserByDNI);
    $("#edit_update_button").click(toggleEdit);
    $("#cancel_button").click(cancelEdit);
});