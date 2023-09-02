document.addEventListener("DOMContentLoaded", function() {
    const passwordModal = document.getElementById('passwordModal');
    const closeModalButton = document.getElementById('closeModal');
    const changePasswordButton = document.getElementById('changePassword');
    const savePasswordButton = document.getElementById('savePassword');

    function showPasswordModal() {
        passwordModal.style.display = "block";
    }

    function hidePasswordModal() {
        passwordModal.style.display = "none";
    }

    closeModalButton.addEventListener('click', function() {
        hidePasswordModal();
    });

    changePasswordButton.addEventListener('click', function() {
        showPasswordModal();
    });

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