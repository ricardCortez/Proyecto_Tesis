document.addEventListener("DOMContentLoaded", function() {

    const buttons = document.querySelectorAll("button");

    buttons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.preventDefault();
            const fieldName = this.previousElementSibling.name;
            const textElement = document.getElementById(`${fieldName}_text`);
            const inputElement = document.getElementById(`${fieldName}_input`);

            if (inputElement.style.display === "none" || inputElement.style.display === "") {
                textElement.style.display = "none";
                inputElement.style.display = "inline";
                inputElement.focus();
                this.textContent = "Guardar";
            } else {
                updateUser(fieldName, inputElement.value, function(success) {
                    if (success) {
                        textElement.textContent = fieldName === 'clave_asignada' ? '******' : inputElement.value;
                        textElement.style.display = "inline";
                        inputElement.style.display = "none";
                        button.textContent = "Editar";
                    } else {
                        alert("Error al actualizar");
                    }
                });
            }
        });
    });
});

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
