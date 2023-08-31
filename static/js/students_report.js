function attachReportButtonHandler() {
    const tableRows = document.querySelectorAll("#report tbody tr");

    // Almacena el contenido original de las celdas de fecha
    tableRows.forEach(row => {
        const dateCell = row.querySelector("td:last-child");
        dateCell.setAttribute("data-original-content", dateCell.textContent.trim());
    });

    document.getElementById("reportButton").addEventListener("click", showReport);

    function showReport() {
        const yearSelected = document.getElementById("yearSelect").value;
        tableRows.forEach(row => {
            const dateCell = row.querySelector("td:last-child");
            // Restablece el contenido de la celda usando el contenido original almacenado
            dateCell.innerHTML = dateCell.getAttribute("data-original-content");
            const date = new Date(dateCell.textContent.trim());
            if (date.getFullYear() == yearSelected) {
                dateCell.innerHTML += ' <span style="color:green">Actualizado</span>';
            } else {
                dateCell.innerHTML = '<span style="color:red">' + dateCell.textContent + '</span> <span>Necesita actualizar</span>';
            }
        });
        document.getElementById("report").style.display = "block";
    }
}

// Llama a la función inmediatamente para adjuntar el manejador de eventos
attachReportButtonHandler();
