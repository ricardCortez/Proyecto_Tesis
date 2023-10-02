$(document).ready(function() {
    const table = $('#students-table').DataTable({
        "paging": true,
        "searching": true,
        "info": true,
        "order": [[0, "asc"]]
    });

    function showReport() {
        const yearSelected = $('#yearSelect').val();

        table.rows().every(function() {
            const row = $(this.node());
            const dateCell = row.find('td:last-child');
            const originalContent = dateCell.data('original-content') || dateCell.text().trim();
            dateCell.data('original-content', originalContent);

            const date = new Date(originalContent);
            if (date.getFullYear() == yearSelected) {
                dateCell.html(`${originalContent} <span style="color:green">Actualizado</span>`);
            } else {
                dateCell.html(`<span style="color:red">${originalContent}</span> <span>Necesita actualizar</span>`);
            }
        });

        $('#report').show();
    }

    $('#reportButton').on('click', showReport);
});
