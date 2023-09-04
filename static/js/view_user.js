document.addEventListener("DOMContentLoaded", function() {
    const passwordModal = document.getElementById('passwordModal');
    const closeModalButton = document.getElementById('closeModal');
    const changePasswordButton = document.getElementById('changePasswordButton');
    const savePasswordButton = document.getElementById('savePasswordButton');

    function showPasswordModal() {
        passwordModal.style.display = "block";
    }

    function hidePasswordModal() {
        passwordModal.style.display = "none";
    }

    closeModalButton.addEventListener('click', function() {
        hidePasswordModal();
    });

    changePasswordButton.addEventListener('click', function(event) {
        event.preventDefault();  // Evitar el comportamiento predeterminado
        showPasswordModal();
    });
});

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

function handlePasswordChange() {
    console.log("handlePasswordChange funcion llamada.");
    var nueva_contraseña = $("#newPassword").val();
    var confirmacion_contraseña = $("#repeatPassword").val();

    // Validate the input
    console.log("revisando campos vacios");
    if (!nueva_contraseña || !confirmacion_contraseña) {
        Swal.fire('Error', 'Ambos campos son obligatorios.', 'error');
        return;
    }

    console.log("Las contraseñas no coinciden");
    if (nueva_contraseña !== confirmacion_contraseña) {
        Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
        return;
    }

    $.ajax({
        url: '/actualizar_contraseña',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ nueva_contraseña: nueva_contraseña, confirmacion_contraseña: confirmacion_contraseña }),
        success: function(response) {
            if (response.message) {
                Swal.fire('¡Éxito!', 'Contraseña actualizada correctamente.', 'success');
                $("#passwordModal").hide();
            } else {
                Swal.fire('Error', 'Error al actualizar la contraseña.', 'error');
            }
        },
        error: function(error) {
            Swal.fire('Error', 'Ocurrió un error al enviar la solicitud.', 'error');
        }
    });
}

$("#savePassword").click(handlePasswordChange);
