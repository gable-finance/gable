// import { getNftIds } from './dashboard'

// google.charts.load('current', { packages: ['corechart'] });
// google.charts.setOnLoadCallback(function () {
//   drawCharts('chart1'); // Display chart1 by default
// });

// // fetch nft info from postgreSQL database
// export async function fetchNftData() {

//   // Define the API URL
//   const apiUrl = 'http://127.0.0.1:5000/api/nft_data';

//   try {
//     // Define the nft_ids parameter
//     let nftIdsInput = await getNftIds();

//     console.log(nftIdsInput)

//     // Create the query string
//     const queryString = nftIdsInput.map(id => `nft_ids=${encodeURIComponent(id)}`).join('&');
//     // const queryString = `nft_ids=${nftIdsInput.join('&nft_ids=')}`;

//     console.log(queryString)

//     // Make the API call
//     const response = await fetch(`${apiUrl}?${queryString}`);

//     console.log(response)

//     if (!response.ok) {
//       throw new Error('Failed to fetch NFT data');
//     }

//     const data = await response.json();

//     // Process the API response data
//     console.log(data);

//     let aggregatedData = {};

//     for (const entry of data) {
//       const timestamp = entry.timestamp;
//       const interest_earnings = entry.interest_earnings;
//       const staking_rewards = entry.staking_rewards;
//       const total_earnings = interest_earnings + staking_rewards;

//       if (!(timestamp in aggregatedData)) {
//         aggregatedData[timestamp] = {
//           staking_rewards: 0,
//           interest_earnings: 0,
//           total_earnings: 0,
//         };
//       }

//       aggregatedData[timestamp].staking_rewards += staking_rewards;
//       aggregatedData[timestamp].interest_earnings += interest_earnings;
//       aggregatedData[timestamp].total_earnings += total_earnings;
//     } 

//     console.log("Aggregated data per timestamp:");
//     console.log(aggregatedData);

//     return aggregatedData;

//   } catch (error) {
//     // Handle any errors
//     console.error(error);
//   }

// }

// // Function to process the table data into three separate DataTables
// async function processTableData() {

//   let dataArray = await fetchNftData();

//   console.log("dataArray:")
//   console.log(dataArray)

//   const dataTable4 = new google.visualization.DataTable();
//   dataTable4.addColumn('string', 'Date');
//   dataTable4.addColumn('number', 'XRD');
  
//   const dataTable5 = new google.visualization.DataTable();
//   dataTable5.addColumn('string', 'Date');
//   dataTable5.addColumn('number', 'XRD');

//   const dataTable6 = new google.visualization.DataTable();
//   dataTable6.addColumn('string', 'Date');
//   dataTable6.addColumn('number', 'XRD');

//   for (const [timestamp, entry] of Object.entries(dataArray)) {
//     const date = new Date(timestamp);
//     const formattedDate = date.toLocaleDateString(); // Format the date as per your requirement
//     const staking_rewards = entry.staking_rewards;
//     const interest_earnings = entry.interest_earnings;
//     const total_earnings = entry.total_earnings;

//     dataTable4.addRow([formattedDate, staking_rewards]);
//     dataTable5.addRow([formattedDate, interest_earnings]);
//     dataTable6.addRow([formattedDate, total_earnings]);
//   }

//   console.log("dataTable4:")
//   console.log(dataTable4)

//   return [dataTable4, dataTable5, dataTable6];
// }

// async function drawCharts(chartId) {

//   let [dataTable4, dataTable5, dataTable6] = await processTableData();

//   var options = {
//     vAxis: {
//       title: 'Percentage',
//       minValue: 0,
//       maxValue: 10,
//       format: "#'%'",
//       minorGridlines: {
//         count: 0,
//       },
//       gridlines: {
//         color: 'lightgray',
//         opacity: 0.0,
//         count: 5,
//       },
//     },
//     hAxis: {
//       title: 'Year',
//     },
//     backgroundColor: 'transparent',
//     colors: ['#cbe7c9'], // Set a custom color for the chart
//     chartArea: {
//       width: '80%',
//       height: '70%',
//     },
//     legend: {
//       position: 'none',
//     },
//   };

//   var chart;

//   if (chartId === 'chart1') {
//     var dataTable = google.visualization.arrayToDataTable([
//       ['Year', '%'],
//       ['2013', 5],
//       ['2014', 6],
//       ['2015', 4],
//       ['2016', 6],
//     ]);
//     chart = new google.visualization.AreaChart(document.getElementById('chart'));
//     chart.draw(dataTable, options);
//   } else if (chartId === 'chart2') {
//     var dataTable = google.visualization.arrayToDataTable([
//       ['Year', '%'],
//       ['2013', 8],
//       ['2014', 7],
//       ['2015', 6],
//       ['2016', 5],
//     ]);
//     chart = new google.visualization.AreaChart(document.getElementById('chart'));
//     chart.draw(dataTable, options);
//   } else if (chartId === 'chart3') {
//     var dataTable = google.visualization.arrayToDataTable([
//       ['Year', '%'],
//       ['2013', 3],
//       ['2014', 4],
//       ['2015', 5],
//       ['2016', 6],
//     ]);
//     chart = new google.visualization.AreaChart(document.getElementById('chart2'));
//     chart.draw(dataTable, options);
//   } else if (chartId === 'chart4') {
//     chart = new google.visualization.AreaChart(document.getElementById('chart2'));
//     chart.draw(dataTable4, options);
//   } else if (chartId === 'chart5') {
//     chart = new google.visualization.AreaChart(document.getElementById('chart2'));
//     chart.draw(dataTable5, options);
//   } else if (chartId === 'chart6') {
//     chart = new google.visualization.AreaChart(document.getElementById('chart2'));
//     chart.draw(dataTable6, options);
//   }

//   // Redraw the chart whenever the window is resized
//   window.addEventListener('resize', function() {
//     chart.draw(dataTable, options);
//   });
// }

// function toggleChart(chartId) {
//   drawCharts(chartId);
// }

// // Event listeners for toggling charts
// var chart1Button = document.getElementById('chart1Btn');
// chart1Button.addEventListener('click', function () {
//   toggleChart('chart1');
// });

// var chart2Button = document.getElementById('chart2Btn');
// chart2Button.addEventListener('click', function () {
//   toggleChart('chart2');
// });

// var chart3Button = document.getElementById('chart3Btn');
// chart3Button.addEventListener('click', function () {
//   toggleChart('chart3');
// });

// // var chart4Button = document.getElementById('chart4-button');
// // chart4Button.addEventListener('click', function () {
// //   toggleChart('chart4');
// // });

// // var chart5Button = document.getElementById('chart5-button');
// // chart5Button.addEventListener('click', function () {
// //   toggleChart('chart5');
// // });

// // var chart6Button = document.getElementById('chart6-button');
// // chart6Button.addEventListener('click', function () {
// //   toggleChart('chart6');
// // });
