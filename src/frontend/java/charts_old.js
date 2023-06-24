google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  var data = google.visualization.arrayToDataTable([
    ['Year', '%'],
    ['2013',  5],
    ['2014',  6],
    ['2015',  4],
    ['2016',  6]
  ]);

  var options = {
    title: 'Staking APY',
    vAxis: {
      title: 'Percentage',
      minValue: 0,
      maxValue: 10,
      format: '#\'%\'',
      minorGridlines: {
        count: 0
      },
      gridlines: {
        color: 'lightgray', // Set the color of the gridlines
        opacity: 0.0, // Set the opacity of the gridlines (0.0 - 1.0)
        count: 5 // Set the number of desired gridlines (intervals)
      }
    },
    hAxis: {
      title: 'Year'
    },
    backgroundColor: 'transparent',
    colors: ['#cbe7c9'], // Set a custom color for the chart
    chartArea: {
      width: '80%', // Adjust the chart area width
      height: '70%' // Adjust the chart area height
    },
    legend: {
      position: 'none' // Hide the legend
    }
  };

  var chart = new google.visualization.AreaChart(document.getElementById('chart_div'));

  // Function to resize the chart when the window size changes
  function resizeChart() {
    var chartContainer = document.getElementById('chart_div');
    var chartWidth = chartContainer.clientWidth; // Get the current width of the container

    // Calculate the desired height based on the aspect ratio (e.g., 16:9)
    var aspectRatio = 0.5625; // You can adjust this value to your desired aspect ratio
    var maxHeight = 500; // Set the maximum height for the chart
    var chartHeight = Math.min(Math.round(chartWidth * aspectRatio), maxHeight);

    // Set the new height for the chart
    chartContainer.style.height = chartHeight + 'px';

    chart.draw(data, options);
  }

  // Add an event listener to the window resize event
  window.addEventListener('resize', resizeChart);

  // Draw the initial chart
  resizeChart();

}
