// import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
// import { nft_address } from './global-states.js';
// import { accountAddress } from './accountAddress.js'
// import { getState } from './dashboardGeneric.js';

// // Instantiate Gateway SDK`
// const stateApi = new StateApi();
// // const accountAddress = data.accountAddress;

// // call functions
// document.addEventListener('DOMContentLoaded', async () => {

//   // await getNftInfo();
//   document.getElementById('get-nft-info').addEventListener('click', async () => {
//     getNftInfo();
//   });

//   if (typeof accountAddress !== 'undefined') {
//     getNftInfo();
//   }
// });

// // get entity non fungible state > get entity non fungible ids
// export async function getNftIds() {
//   console.log(accountAddress)

//   const stateEntityNonFungiblesPageRequest = {
//     address: accountAddress,
//     aggregation_level: 'Vault',
//   };

//   let response = await stateApi.entityNonFungiblesPage({
//     stateEntityNonFungiblesPageRequest,
//   });

//   console.log(accountAddress);
//   console.log(typeof accountAddress);
//   console.log(response);

//   // Find the item with the matching resource address
//   const item = response.items.find((item) => item.resource_address === nft_address);

//   let vault_address;

//   if (item) {
//     // Extract the vault value
//     const vault = item.vaults.items[0];
//     vault_address = vault.vault_address;
//     console.log(vault.vault_address);
//   } else {
//     console.log('Resource address not found in the response.');
//   }

//   console.log(vault_address);

//   const stateEntityNonFungibleIdsPageRequest = {
//     address: accountAddress,
//     resource_address: nft_address,
//     vault_address: vault_address,
//   };

//   let response2 = await stateApi.entityNonFungibleIdsPage({
//     stateEntityNonFungibleIdsPageRequest,
//   });

//   console.log(response2);

//   // Extract the non_fungible_id values into an array
//   let nonFungibleIds = response2.items.map((item) => item.non_fungible_id);

//   console.log(nonFungibleIds);

//   return nonFungibleIds
// }

// // get the nft info (earnings) of the user
// async function getNftInfo() {

//   // Initialize variables to store the sum
//   let total_lsu = 0;
//   let total_staking_rewards = 0;
//   let total_interest_earnings = 0;

//   let nft_local_id = document.getElementById('nft-local-id').value;

//   // Function to check if the key starts and ends with a hashtag
//   function isValidKey(key) {
//     return key.startsWith('#') && key.endsWith('#');
//   }

//   // Get the reference to the error message element
//   const errorMessageElement = document.getElementById('error-message');

//   // Validate the user input
//   if (nft_local_id && !isValidKey(nft_local_id)) {
//     // Display the error message
//     displayErrorMessage('Invalid key format. Key must start and end with a hashtag (#).');
//   } else {
//     let idArray = [];

//     // Check if nft_local_id is provided
//     if (nft_local_id) {
//       // Split the nft_local_id string into an array of IDs
//       idArray = nft_local_id.replace(/\s/g, '').split(',');
//     } else {
//       // Call getNftIds() to retrieve the array of IDs
//       idArray = await getNftIds();
//       console.log(idArray);
//     }

//     // Get the reference to the results container element
//     const resultsContainer = document.getElementById('results-container');
//     // Clear the previous results
//     resultsContainer.innerHTML = '';

//     // Proceed only if there are IDs to process
//     if (idArray.length > 0) {
//       let state = await getState();

//       // Access the map directly assuming it's at index 6
//       let map = state.fields[6];

//       // Retrieve the values from the map using the key
//       const mapEntries = map.entries;

//       // Process each ID individually
//       idArray.forEach((id) => {
//         // Find the entry in the map with the matching key
//         const foundEntry = mapEntries.find((entry) => entry[0] === id);

//         if (foundEntry) {
//           const values = foundEntry[1];

//           // let supplied_epoch = values[0];
//           let lsu_amount = values[1];
//           let staking_rewards = values[2];
//           let interest_earnings = values[3];

//           // Convert the strings to numbers and round to two decimal points
//           lsu_amount = parseFloat(lsu_amount).toFixed(2);
//           staking_rewards = parseFloat(staking_rewards).toFixed(2);
//           interest_earnings = parseFloat(interest_earnings).toFixed(2);

//           // Update the sum variables
//           total_lsu += parseFloat(lsu_amount);
//           total_staking_rewards += parseFloat(staking_rewards);
//           total_interest_earnings += parseFloat(interest_earnings);

//           // Calculate the total XRD
//           const total_xrd = (parseFloat(staking_rewards) + parseFloat(staking_rewards) + parseFloat(interest_earnings)).toFixed(2);

//           // Create HTML elements to display the results
//           const resultElement = document.createElement('div');
//           resultElement.classList.add('dashboard-div');
//           resultElement.innerHTML = `
//             <h1 class="stats-h1">${id}</h1>
//             <h1 class="stats-h1">${lsu_amount} LSU</h1>
//             <h1 class="stats-h1">${staking_rewards} XRD</h1>
//             <h1 class="stats-h1">${interest_earnings} XRD</h1>
//           `;

//           // Append the result element to the results container
//           resultsContainer.appendChild(resultElement);

//         } else {
//           console.log(`Entry not found for ID ${id}.`);
//           displayErrorMessage(`Entry not found for ID ${id}.`);
//         }
//       });

//     } else {
//       console.log('Entry not found.');
//       displayErrorMessage('Entry not found.');
//     }
//   }

//   // Update the HTML placeholders with the calculated sums
//   document.getElementById('total-lsu').textContent = (total_lsu.toFixed(2) + ' LSU');
//   document.getElementById('total-staking-rewards').textContent = (total_staking_rewards.toFixed(2) + ' XRD');
//   document.getElementById('total-interest-earnings').textContent = (total_interest_earnings.toFixed(2) + ' XRD');

// }

// // Display error message
// function displayErrorMessage(message) {
//   // Get the error message elements
//   const errorMessage = document.getElementById('error-message');
//   const errorText = document.getElementById('error-text');
//   const closeButton = document.getElementById('close-button');

//   // Set the error message text
//   errorText.textContent = message;

//   // Show the error message
//   errorMessage.style.display = 'block';

//   // Add click event listener to the close button
//   closeButton.addEventListener('click', hideErrorMessage);
// }

// // Hide error message
// function hideErrorMessage() {
//   // Get the error message element
//   const errorMessage = document.getElementById('error-message');

//   // Hide the error message
//   errorMessage.style.display = 'none';
// }

google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(function () {
  drawCharts('chart1'); // Display chart1 by default
  drawCharts2('chart4'); // Display chart4 by default
});


async function drawCharts(chartId) {
  const options = {
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
    colors: ['#90a7ac'],
    chartArea: {
      width: '80%',
      height: '70%',
    },
    legend: {
      position: 'none',
    },
  };

  let chart;
  let dataTable;

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

  chart = new google.visualization.AreaChart(document.getElementById('chart'));
  chart.draw(dataTable, options);

  // Redraw the chart whenever the window is resized
  window.addEventListener('resize', function () {
    chart = new google.visualization.AreaChart(document.getElementById('chart'));
    chart.draw(dataTable, options);
  });
}

// Event listeners for toggling charts
document.getElementById('chart1Btn').addEventListener('click', function () {
  drawCharts('chart1');
});

document.getElementById('chart2Btn').addEventListener('click', function () {
  drawCharts('chart2');
});

document.getElementById('chart3Btn').addEventListener('click', function () {
  drawCharts('chart3');
});


// // fetch nft info from postgreSQL database
// export async function fetchNftData() {
//   // Define the API URL
//   const apiUrl = 'http://127.0.0.1:5000/api/nft_data';

//   try {
//     // Retrieve the non-fungible IDs
//     const nftIdsInput = await getNftIds();

//     console.log(nftIdsInput);

//     // Create the query string
//     const queryString = nftIdsInput.map((id) => `nft_ids=${encodeURIComponent(id)}`).join('&');

//     console.log(queryString);

//     // Make the API call
//     const response = await fetch(`${apiUrl}?${queryString}`);

//     console.log(response);

//     if (!response.ok) {
//       throw new Error('Failed to fetch NFT data');
//     }

//     const data = await response.json();

//     // Process the API response data
//     console.log(data);

//     const aggregatedData = {};

//     for (const entry of data) {
//       const timestamp = entry.timestamp;
//       const interest_earnings = entry.interest_earnings;
//       const staking_rewards = entry.staking_rewards;
//       const total_earnings = interest_earnings + staking_rewards;

//       if (!aggregatedData[timestamp]) {
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
//   const dataArray = await fetchNftData();

//   console.log("dataArray:");
//   console.log(dataArray);

//   const dataTable4 = new google.visualization.DataTable();
//   dataTable4.addColumn('date', 'Date');
//   dataTable4.addColumn('number', 'XRD');

//   const dataTable5 = new google.visualization.DataTable();
//   dataTable5.addColumn('date', 'Date');
//   dataTable5.addColumn('number', 'XRD');

//   const dataTable6 = new google.visualization.DataTable();
//   dataTable6.addColumn('date', 'Date');
//   dataTable6.addColumn('number', 'XRD');

//   for (const [timestamp, entry] of Object.entries(dataArray)) {
//     const date = new Date(timestamp);
//     const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

//     const staking_rewards = entry.staking_rewards;
//     const interest_earnings = entry.interest_earnings;
//     const total_earnings = entry.total_earnings;

//     dataTable4.addRow([formattedDate, staking_rewards]);
//     dataTable5.addRow([formattedDate, interest_earnings]);
//     dataTable6.addRow([formattedDate, total_earnings]);
//   }

//   console.log("dataTable4:");
//   console.log(dataTable4);

//   return [dataTable4, dataTable5, dataTable6];
// }

async function drawCharts2(chartId) {
//   const [dataTable4, dataTable5, dataTable6] = await processTableData();

  const options = {
    vAxis: {
      title: 'XRD',
      minorGridlines: {
        count: 0,
      },
      gridlines: {
        color: 'lightgray',
        opacity: 0.0,
      },
    },
    hAxis:{
      title: 'Year',
      gridlines: {
        color: 'transparent',
      },
    },
    backgroundColor: 'transparent',
    colors: ['#afc7cd'],
    chartArea: {
      width: '80%',
      height: '70%',
    },
    legend: {
      position: 'none',
    },
  };

  console.log("distinct dates");

  let chart;
  let dataTable;

  if (chartId === 'chart4') {
    dataTable = google.visualization.arrayToDataTable([
        ['Year', 'XRD'],
        ['2013', 12345],
        ['2014', 23456],
        ['2015', 29543],
        ['2016', 38212],
    ]);
  } else if (chartId === 'chart5') {
    dataTable = google.visualization.arrayToDataTable([
        ['Year', 'XRD'],
        ['2013', 1345],
        ['2014', 3456],
        ['2015', 6543],
        ['2016', 8212],
    ]);
  } else if (chartId === 'chart6') {
    dataTable = google.visualization.arrayToDataTable([
        ['Year', 'XRD'],
        ['2013', 22345],
        ['2014', 32456],
        ['2015', 37543],
        ['2016', 56212],
    ]);
  }

  chart = new google.visualization.AreaChart(document.getElementById('chart2'));
  chart.draw(dataTable, options);

  // Redraw the chart whenever the window is resized
  window.addEventListener('resize', function () {
    chart = new google.visualization.AreaChart(document.getElementById('chart2'));
    chart.draw(dataTable, options);
  });

}

// Event listeners for toggling charts
document.getElementById('chart4Btn').addEventListener('click', function () {
  drawCharts2('chart4');
});

document.getElementById('chart5Btn').addEventListener('click', function () {
  drawCharts2('chart5');
});

document.getElementById('chart6Btn').addEventListener('click', function () {
  drawCharts2('chart6');
});