var chart; // Declare the chart variable outside the drawChart function
var data1, data2, data3, options; // Declare data variables
var chartIds = ['chart1', 'chart2', 'chart3']; // Array of chart IDs

// Function to toggle the visibility of a chart based on the selected radio button
function toggleChart(chartId) {
  var chartContainers = document.getElementsByClassName('chartContainer');

  for (var i = 0; i < chartContainers.length; i++) {
    var chartContainer = chartContainers[i];
    if (chartContainer.id === chartId + 'Container') {
      chartContainer.style.display = 'block';
      drawChart(chartId); // Call the drawChart function for the selected chart
    } else {
      chartContainer.style.display = 'none';
    }
  }
}

// Add event listeners to the radio buttons
var radioButtons = document.getElementsByName('chartSelection');

for (var i = 0; i < radioButtons.length; i++) {
  radioButtons[i].addEventListener('change', function() {
    toggleChart(this.value);
  });
}

// Initial setup to show the default chart
toggleChart('chart1');

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawCharts);

function drawCharts() {
  // Create the data tables
  data1 = google.visualization.arrayToDataTable([
    ['Year', '%'],
    ['2013',  5],
    ['2014',  6],
    ['2015',  4],
    ['2016',  6]
  ]);

  data2 = google.visualization.arrayToDataTable([
    ['Year', '%'],
    ['2013',  8],
    ['2014',  7],
    ['2015',  6],
    ['2016',  5]
  ]);

  data3 = google.visualization.arrayToDataTable([
    ['Year', '%'],
    ['2013',  3],
    ['2014',  4],
    ['2015',  5],
    ['2016',  6]
  ]);

  options = {
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
        color: 'lightgray',
        opacity: 0.0,
        count: 5
      }
    },
    hAxis: {
      title: 'Year'
    },
    backgroundColor: 'transparent',
    chartArea: {
      width: '80%',
      height: '70%'
    },
    legend: {
      position: 'none'
    }
  };

  // Resize the charts initially
  resizeCharts();
}

// Function to resize the charts when the window size changes
function resizeCharts() {
  for (var i = 0; i < chartIds.length; i++) {
    var chartId = chartIds[i];
    var chartContainer = document.getElementById(chartId + '_div');
    var chartWidth = chartContainer.clientWidth;

    var aspectRatio = 0.5625;
    var maxHeight = 500;
    var chartHeight = Math.min(Math.round(chartWidth * aspectRatio), maxHeight);

    chartContainer.style.height = chartHeight + 'px';
  }

  // Redraw the charts
  chart = new google.visualization.AreaChart(document.getElementById('chart1_div'));
  chart.draw(data1, options);

  chart = new google.visualization.AreaChart(document.getElementById('chart2_div'));
  chart.draw(data2, options);

  chart = new google.visualization.AreaChart(document.getElementById('chart3_div'));
  chart.draw(data3, options);
}

// Add an event listener to the window resize event
window.addEventListener('resize', resizeCharts);
