$(document).ready(function() {
    let originalValues = {};

    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function updateOriginalValues() {
        originalValues = {
            nombre: $("#nombre_input").val(),
            apellido_paterno: $("#apellido_paterno_input").val(),
            apellido_materno: $("#apellido_materno_input").val(),
            correo_electronico: $("#correo_electronico_input").val(),
            celular: $("#celular_input").val(),
            fecha_nacimiento: $("#fecha_nacimiento_input").val()
        };
    }

    function toggleEdit() {
        const isEditing = $("#edit_update_button").text() === "Actualizar";

        if (isEditing) {
            // Si se está editando, actualizamos los datos
            const dataToUpdate = {
                dni: $("#numero_documento_text").text(),
                ...originalValues
            };

            $.post('/update_usuario', dataToUpdate)
                .done(function() {
                    Swal.fire({
                        icon: 'success',
                        title: 'Éxito',
                        text: 'Datos actualizados correctamente.'
                    });
                })
                .fail(function() {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Ocurrió un error al actualizar los datos.'
                    });
                });

            $("#edit_update_button").text("Editar");
            $("#cancel_button").hide();
            $("[id$='_text']").show();
            $("[id$='_input']").hide();

        } else {
            // Si no se está editando, pasamos a modo edición
            $("[id$='_text']").hide();
            $("[id$='_input']").show();
            $("#edit_update_button").text("Actualizar");
            $("#cancel_button").show();
        }
    }

    function cancelEdit() {
        for (const key in originalValues) {
            $(`#${key}_input`).val(originalValues[key]);
        }
        $("[id$='_text']").show();
        $("[id$='_input']").hide();
        $("#edit_update_button").text("Editar");
        $("#cancel_button").hide();
    }

    function searchUserByDNI() {
        const dni_usuario = $("#search_dni").val();

        $.post('/buscar_usuario_por_dni', { dni: dni_usuario })
            .done(function(data) {
                for (const key in data) {
                    if (key === "fecha_nacimiento") {
                        $(`#${key}_text`).text(formatDate(data[key]));
                        $(`#${key}_input`).val(formatDate(data[key]));
                    } else if (key === "clave_asignada") {
                        // Si es la contraseña, mostramos asteriscos
                        $(`#${key}_text`).text("*****");
                    } else {
                        $(`#${key}_text`).text(data[key]);
                        $(`#${key}_input`).val(data[key]);
                    }
                }

                $(".field").show();
                $("#edit_update_button").show();

                updateOriginalValues();
            })
            .fail(function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error en la búsqueda o no se encontró un usuario con ese DNI.'
                });
            });
    }

    function changePassword() {
        const newPassword = $("#newPassword").val();
        const repeatPassword = $("#repeatPassword").val();

        if (newPassword !== repeatPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas no coinciden.'
            });
            return;
        }

        $.post('/update_usuario', { clave_asignada: newPassword })
            .done(function() {
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Contraseña actualizada correctamente.'
                });
                $("#passwordModal").hide();
            })
            .fail(function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un error al actualizar la contraseña.'
                });
            });
    }

    // Inicializamos valores originales
    updateOriginalValues();

    // Event bindings
    $("#search_button").click(searchUserByDNI);
    $("#edit_update_button").click(toggleEdit);
    $("#cancel_button").click(cancelEdit);
    $("#changePassword").click(function() { $("#passwordModal").show(); });
    $("#closeModal").click(function() { $("#passwordModal").hide(); });
    $("#savePassword").click(changePassword);
});

// Modal functionality
$(document).ready(function() {
    // Open the modal
    $("#changePasswordButton").click(function() {
        $("#passwordModal").show();
    });

    // Close the modal
    $("#closeModal").click(function() {
        $("#passwordModal").hide();
    });

    // Close the modal when clicking outside of the modal content
    $(window).click(function(event) {
        if ($(event.target).is("#passwordModal")) {
            $("#passwordModal").hide();
        }
    });
});
