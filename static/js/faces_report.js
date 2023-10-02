$(document).ready(function() {
    console.log("Data values:", window.no_reconocido_count, window.no_pertenece_count);

    $('#rostros-table').DataTable({
        "paging": true,
        "searching": true,
        "info": true,
        "order": [[0, "desc"]]
    });

    var data = [{
        values: [window.no_reconocido_count, window.no_pertenece_count],
        labels: ['No reconocido (' + window.no_reconocido_count + ')', 'No pertenece (' + window.no_pertenece_count + ')'],
        type: 'pie',
        marker: { colors: ['red', 'blue'] }
    }];

    var layout = { title: 'Rostros No Reconocidos', height: 400, width: 500 };
    Plotly.newPlot('myChart', data, layout);
});
