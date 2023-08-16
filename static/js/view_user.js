document.addEventListener("DOMContentLoaded", function() {

    const buttons = document.querySelectorAll("button");

    // Logic for "Cancelar" buttons
    const cancelButtons = document.querySelectorAll(".cancel-button");
    cancelButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.preventDefault();
            const fieldName = this.previousElementSibling.previousElementSibling.name;
            const textElement = document.getElementById(`${fieldName}_text`);
            const inputElement = document.getElementById(`${fieldName}_input`);

            // Reset input value to the original text value
            inputElement.value = textElement.textContent;

            // Switch back to display mode
            textElement.style.display = "inline";
            inputElement.style.display = "none";
            this.previousElementSibling.textContent = "Editar";
            this.style.display = "none";  // Hide the "Cancelar" button
        });
    });


    buttons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.preventDefault();
            const previousSibling = this.previousElementSibling;
if (!previousSibling) return;
const fieldName = previousSibling.name;
            const textElement = document.getElementById(`${fieldName}_text`);
            const inputElement = document.getElementById(`${fieldName}_input`);

            // Si el campo es "clave_asignada", muestra el modal
            if (fieldName === "clave_asignada") {
                showPasswordModal();
                return;
            }

            // Si el inputElement no existe o el campo no es editable, simplemente retorna
            if (!inputElement) {
                return;
            }

            if (inputElement.style.display === "none" || inputElement.style.display === "") {
                textElement.style.display = "none";
                inputElement.style.display = "inline";
                inputElement.focus();
                this.textContent = "Guardar";
                this.nextElementSibling.style.display = "inline";
            } else {
                updateUser(fieldName, inputElement.value, function(success) {
                    if (success) {
                        textElement.textContent = inputElement.value;
                        textElement.style.display = "inline";
                        inputElement.style.display = "none";
                        button.textContent = "Editar";
                    } else {
                        Swal.fire("Error", "Error al actualizar", "error");
                    }
                });
            }
        });
    });

    const passwordModal = document.getElementById('passwordModal');
    const changePasswordButton = document.getElementById('changePassword');
    const closeModalButton = document.getElementById('closeModal');
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

    savePasswordButton.addEventListener('click', function() {
        const newPassword = document.getElementById('newPassword').value;
        const repeatPassword = document.getElementById('repeatPassword').value;

        if (newPassword === repeatPassword) {
            if (validatePassword(newPassword)) {
                updateUser('clave_asignada', newPassword, function(success) {
                    if (success) {
                        document.getElementById('clave_asignada_text').textContent = '******';
                        hidePasswordModal();
                        Swal.fire("Éxito", "Contraseña actualizada con éxito", "success");
                    } else {
                        Swal.fire("Error", "Error al actualizar contraseña", "error");
                    }
                });
            } else {
                Swal.fire("Error", "La contraseña no cumple con los requisitos.", "error");
            }
        } else {
            Swal.fire("Error", "Las contraseñas no coinciden.", "error");
        }
    });

    function validatePassword(password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        return regex.test(password);
    }

    function updateUser(field, value, callback) {
        fetch('/actualizar_usuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field: field,
                value: value
            })
        })
        .then(response => response.json())
        .then(data => {
            callback(data.success);
        });
    }
});
