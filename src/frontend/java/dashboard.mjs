import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
// import { StateApi} from '../radix-dapp-toolkit/src/index.js'
import { nftAddress, testDataArray, testApyDataArray } from './global-states.mjs';
import { queryKvs, fetchApyData } from './dashboardGeneric.mjs';
import { rdt } from './radixToolkit.mjs';

// Instantiate Gateway SDK
const stateApi = new StateApi();

// let accountAddress = rdt.walletApi.getWalletData().accounts[0];
let accountAddress;

async function popUp() {
  if (typeof accountAddress == 'undefined') {
    console.log("UNDEFINED")
    document.getElementById('pop-up').style.display = 'flex';
    document.getElementById('pop-up1').style.display = 'flex';
    document.getElementById('pop-up2').style.display = 'none';
  }
  else {
    try {
      let _test = await getNftIds();
      console.log("DEFINED")
      document.getElementById('pop-up').style.display = 'none';
      document.getElementById('pop-up1').style.display = 'none';
      document.getElementById('pop-up2').style.display = 'none';
    } catch(error) {
      console.log("NO SUPPLIER")
      document.getElementById('pop-up').style.display = 'flex';
      document.getElementById('pop-up1').style.display = 'none';
      document.getElementById('pop-up2').style.display = 'flex';
    }
  }
}

rdt.walletApi.walletData$.subscribe((walletData) => {
  console.log("walletData", walletData)

  accountAddress = walletData.accounts[0].address;

  drawCharts2('chart4'); // Call the function that relies on accountAddress
  getNftInfo();
  popUp();
})

document.addEventListener("DOMContentLoaded", function() {
  console.log('test dome');
  popUp();

  // ensure that getNftInfo only gets called once
  if (typeof accountAddress == 'undefined') {
    getNftInfo();
  }
});

google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(function () {
  drawCharts('chart1'); // Display chart1 by default
  drawCharts2('chart4'); // Display chart4 by default
});

// get entity non fungible state > get entity non fungible ids
export async function getNftIds() {
  console.log("Account address: ", accountAddress)

  const stateEntityNonFungiblesPageRequest = {
    address: accountAddress,
    aggregation_level: 'Vault',
  };

  let response = await stateApi.entityNonFungiblesPage({
    stateEntityNonFungiblesPageRequest,
  });

  console.log(accountAddress);
  console.log(typeof accountAddress);
  console.log("Response: ", response);

  // Find the item with the matching resource address
  const item = response.items.find((item) => item.resource_address === nftAddress);

  let vault_address;

  if (item) {
    // Extract the vault value
    const vault = item.vaults.items[0];
    vault_address = vault.vault_address;
    console.log(vault.vault_address);
  } else {
    console.log('Resource address not found in the response.');
  }

  console.log(vault_address);

  const stateEntityNonFungibleIdsPageRequest = {
    address: accountAddress,
    resource_address: nftAddress,
    vault_address: vault_address,
  };

  let response2 = await stateApi.entityNonFungibleIdsPage({
    stateEntityNonFungibleIdsPageRequest,
  });

  console.log(response2);

  // Extract the non_fungible_id values into an array
  let nonFungibleIds = response2.items.map((item) => item);

  console.log(nonFungibleIds);

  return nonFungibleIds
}

// get the nft info (earnings) of the user
async function getNftInfo() {

  console.log('test getnftinfo');

  // Initialize variables to store the sum
  let total_lsu = 0;
  let total_staking_rewards = 0;
  let total_interest_earnings = 0;

  let idArray = [];

  // Call getNftIds() to retrieve the array of IDs

  try {
    idArray = await getNftIds();
  } catch (error) {
    console.error("An error occurred while fetching NFT IDs:", error);
    idArray = []
  }

  console.log("idArray", idArray);

  // Get the reference to the results container element
  const resultsContainer = document.getElementById('results-container');
  // Clear the previous results
  resultsContainer.innerHTML = '';

  if (idArray.length > 0 ) {
    // Process each ID individually
    idArray.forEach(async (id) => {

      console.log("IDSS", id)

      let [lsu_amount, staking_rewards, interest_earnings] = await queryKvs(id);

      console.log(lsu_amount, staking_rewards, interest_earnings)

      // Convert the strings to numbers and round to two decimal points
      lsu_amount = parseFloat(lsu_amount).toFixed(2);
      staking_rewards = parseFloat(staking_rewards).toFixed(2);
      interest_earnings = parseFloat(interest_earnings).toFixed(2);

      console.log(lsu_amount, staking_rewards, interest_earnings)

      // Update the sum variables
      total_lsu += parseFloat(lsu_amount);
      total_staking_rewards += parseFloat(staking_rewards);
      total_interest_earnings += parseFloat(interest_earnings);

      console.log(total_lsu, total_staking_rewards, total_interest_earnings)

      // Calculate the total XRD
      // const total_xrd = (parseFloat(staking_rewards) + parseFloat(staking_rewards) + parseFloat(interest_earnings)).toFixed(2);

      // Create HTML elements to display the results
      const resultElement = document.createElement('div');
      resultElement.classList.add('dashboard-div');
      resultElement.innerHTML = `
        <h1 class="stats-h1">${id}</h1>
        <h1 class="stats-h1">${lsu_amount} LSU</h1>
        <h1 class="stats-h1">${staking_rewards} XRD</h1>
        <h1 class="stats-h1">${interest_earnings} XRD</h1>
      `;

      // Append the result element to the results container
      resultsContainer.appendChild(resultElement);

      // Update the HTML placeholders with the calculated sums
      document.getElementById('total-lsu').textContent = (total_lsu.toFixed(2) + ' LSU');
      document.getElementById('total-staking-rewards').textContent = (total_staking_rewards.toFixed(2) + ' XRD');
      document.getElementById('total-interest-earnings').textContent = (total_interest_earnings.toFixed(2) + ' XRD');

    });
  } else {
      // Create HTML elements to display the results
      const resultElement = document.createElement('div');
      resultElement.classList.add('dashboard-div');
      resultElement.innerHTML = `
        <h1 class="stats-h1">-</h1>
        <h1 class="stats-h1">-</h1>
        <h1 class="stats-h1">-</h1>
        <h1 class="stats-h1">-</h1>
      `;

      // Append the result element to the results container
      resultsContainer.appendChild(resultElement);

      // Update the HTML placeholders with the calculated sums
      document.getElementById('total-lsu').textContent = '-';
      document.getElementById('total-staking-rewards').textContent = '-';
      document.getElementById('total-interest-earnings').textContent = '-';
  }
}

// Function to process the table data into three separate DataTables
async function processApyData() {
  const dataArray = await fetchApyData() ?? testApyDataArray;

  console.log("dataArray APY data:");
  console.log(dataArray);

  const dataTable1 = new google.visualization.DataTable();
  dataTable1.addColumn('date', 'Date');
  dataTable1.addColumn('number', '%');

  const dataTable2 = new google.visualization.DataTable();
  dataTable2.addColumn('date', 'Date');
  dataTable2.addColumn('number', '%');

  const dataTable3 = new google.visualization.DataTable();
  dataTable3.addColumn('date', 'Date');
  dataTable3.addColumn('number', '%');

  for (const [key, entry] of Object.entries(dataArray)) {
    const timestamp = entry.timestamp;
    const date = new Date(timestamp);
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
    const interest_earnings_apy = entry.interest_earnings_apy;
    const staking_rewards_apy = entry.staking_rewards_apy;
    const total_earnings_apy = entry.total_earnings_apy;
  
    dataTable1.addRow([formattedDate, staking_rewards_apy]);
    dataTable2.addRow([formattedDate, interest_earnings_apy]);
    dataTable3.addRow([formattedDate, total_earnings_apy]);
  }
  

  console.log("dataTable1:");
  console.log(dataTable1);

  return [dataTable1, dataTable2, dataTable3];
}

// processApyData();

async function drawCharts(chartId) {

  const [dataTable1, dataTable2, dataTable3] = await processApyData();

  const options = {
    vAxis: {
      title: 'Percentage',
      minorGridlines: {
        count: 0,
      },
      gridlines: {
        color: 'lightgray',
        opacity: 0.2,
      },
    },
    hAxis:{
      title: 'Date',
      gridlines: {
        color: 'transparent',
      },
      format: 'yyyy-MM-dd'
    },
    backgroundColor: 'transparent',
    colors: ['#90a7ac'],
    chartArea: {
      width: '70%',
      height: '60%',
    },
    legend: {
      position: 'none',
    },
    animation: {
      duration: 1000, // Set animation duration (milliseconds)
      easing: 'out', // Animation easing function
    },
    pointSize: 3, // Adjust the size of the data point markers (dots)
  };

  console.log("distinct dates");
  console.log(dataTable1.getDistinctValues(0));

  let chart;

  if (chartId === 'chart1') {
    chart = new google.visualization.AreaChart(document.getElementById('chart'));
    chart.draw(dataTable1, options);
  } else if (chartId === 'chart2') {
    chart = new google.visualization.AreaChart(document.getElementById('chart'));
    chart.draw(dataTable2, options);
  } else if (chartId === 'chart3') {
    chart = new google.visualization.AreaChart(document.getElementById('chart'));
    chart.draw(dataTable3, options);
  }

  // Redraw the chart whenever the window is resized
  window.addEventListener('resize', function () {
    chart = new google.visualization.AreaChart(document.getElementById('chart'));
    chart.draw(dataTable1, options);
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


// fetch nft info from postgreSQL database
async function fetchNftData() {
  // Define the API URL
  const apiUrl = 'http://192.168.1.65:8000/api/nft_data';

  try {
    // Retrieve the non-fungible IDs
    const nftIdsInput = await getNftIds();

    console.log(nftIdsInput);

    // Create the query string
    const queryString = nftIdsInput.map((id) => `nft_ids=${encodeURIComponent(id)}`).join('&');

    console.log(queryString);

    // Make the API call
    const response = await fetch(`${apiUrl}?${queryString}`);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch NFT data');
    }

    const data = await response.json();

    // Process the API response data
    console.log("NFT DATA:", data);

    const processedData = [];

    for (const entry of data) {
      const timestamp = entry.timestamp;
      const interest_earnings = entry.interest_earnings;
      const staking_rewards = entry.staking_rewards;
      const total_earnings = interest_earnings + staking_rewards;

      const result = {
        timestamp,
        interest_earnings,
        staking_rewards,
        total_earnings
      };

      processedData.push(result);
    }
   
    console.log("Aggregated data per timestamp:");
    console.log(processedData);

    return processedData;
  } catch (error) {
    // Handle any errors
    console.error("NFT DATA ERROR", error);
  }
}

// Function to process the table data into three separate DataTables
async function processTableData() {
  const dataArray = await fetchNftData() ?? testDataArray;

  console.log("dataArray:");
  console.log(dataArray);

  const dataTable4 = new google.visualization.DataTable();
  dataTable4.addColumn('date', 'Date');
  dataTable4.addColumn('number', 'XRD');

  const dataTable5 = new google.visualization.DataTable();
  dataTable5.addColumn('date', 'Date');
  dataTable5.addColumn('number', 'XRD');

  const dataTable6 = new google.visualization.DataTable();
  dataTable6.addColumn('date', 'Date');
  dataTable6.addColumn('number', 'XRD');

  for (const [timestamp, entry] of Object.entries(dataArray)) {
    const timestamp = entry.timestamp;
    const date = new Date(timestamp);
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    console.log(formattedDate)

    const staking_rewards = entry.staking_rewards;
    const interest_earnings = entry.interest_earnings;
    const total_earnings = entry.total_earnings;

    dataTable4.addRow([formattedDate, staking_rewards]);
    dataTable5.addRow([formattedDate, interest_earnings]);
    dataTable6.addRow([formattedDate, total_earnings]);
  }

  console.log("dataTable4:");
  console.log(dataTable4);

  return [dataTable4, dataTable5, dataTable6];
}

async function drawCharts2(chartId) {
  const [dataTable4, dataTable5, dataTable6] = await processTableData();

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
      title: 'Date',
      gridlines: {
        color: 'transparent',
      },
      format: 'YYYY-MM-dd'
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
    pointSize: 3, // Adjust the size of the data point markers (dots)
  };

  let chart;

  if (chartId === 'chart4') {
    chart = new google.visualization.AreaChart(document.getElementById('chart2'));
    chart.draw(dataTable4, options);
  } else if (chartId === 'chart5') {
    chart = new google.visualization.AreaChart(document.getElementById('chart2'));
    chart.draw(dataTable5, options);
  } else if (chartId === 'chart6') {
    chart = new google.visualization.AreaChart(document.getElementById('chart2'));
    chart.draw(dataTable6, options);
  }

  // Redraw the chart whenever the window is resized
  window.addEventListener('resize', function () {
    chart = new google.visualization.AreaChart(document.getElementById('chart2'));
    chart.draw(dataTable4, options);
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