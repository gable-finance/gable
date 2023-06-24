google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(function () {
  drawCharts('chart1'); // Display chart1 by default
});

function drawCharts(chartId) {
  // Create the data table based on the selected chart
  var dataTable;
  if (chartId === 'chart1') {
    dataTable = google.visualization.arrayToDataTable([
      ['Year', '%'],
      ['2013', 5],
      ['2014', 6],
      ['2015', 4],
      ['2016', 6],
    ]);
  } else if (chartId === 'chart2') {
    dataTable = google.visualization.arrayToDataTable([
      ['Year', '%'],
      ['2013', 8],
      ['2014', 7],
      ['2015', 6],
      ['2016', 5],
    ]);
  } else if (chartId === 'chart3') {
    dataTable = google.visualization.arrayToDataTable([
      ['Year', '%'],
      ['2013', 3],
      ['2014', 4],
      ['2015', 5],
      ['2016', 6],
    ]);
  }

  var options = {
    vAxis: {
      title: 'Percentage',
      minValue: 0,
      maxValue: 10,
      format: "#'%'",
      minorGridlines: {
        count: 0,
      },
      gridlines: {
        color: 'lightgray',
        opacity: 0.0,
        count: 5,
      },
    },
    hAxis: {
      title: 'Year',
    },
    backgroundColor: 'transparent',
    colors: ['#cbe7c9'], // Set a custom color for the chart
    chartArea: {
      width: '80%',
      height: '70%',
    },
    legend: {
      position: 'none',
    },
  };

  var chart = new google.visualization.AreaChart(document.getElementById('chart'));

  function drawChart() {
    chart.draw(dataTable, options);
  }

  // Redraw the chart whenever the window is resized
  window.addEventListener('resize', drawChart);

  // Initial draw
  drawChart();
}

function toggleChart(chartId) {
  drawCharts(chartId);
}
