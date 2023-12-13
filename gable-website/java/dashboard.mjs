import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
import { nftAddress, testDataArray, testApyDataArray, rootApiUrl } from './global-states.mjs';
import { queryKvs, fetchApyData, fetchFlashloanData, fetchTvlData, getState, getCurrentTvlAmount } from './dashboardGeneric.mjs';
import { rdt } from './radixToolkit.mjs';

// Instantiate Gateway SDK
const stateApi = new StateApi();

let accountAddress = rdt.walletApi.getWalletData().accounts[0];
// let accountAddress = 'account_rdx12yw9pv3qc5jafedkau2yglejp2ghcltgrh82su8n0mqlg0u2k75mv0';

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

  drawUserCharts('chart4'); // Call the function that relies on accountAddress
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
  drawApyCharts('chart1'); // Display chart1 by default
  drawUserCharts('chart4'); // Display chart4 by default
  drawFlashloanCharts('chart999'); // Display chart999 by default
  drawTvlCharts('chart997');
  drawLiquidityCharts();
});


function createOptions(hTitle, width, height, format) {
  return {
    vAxis: {
      minorGridlines: {
        count: 0,
      },
      gridlines: {
        color: 'lightgray',
        opacity: 0.2,
      },
      format: format,
      textPosition: 'in',
    },
    hAxis: {
      title: hTitle,
      gridlines: {
        color: 'transparent',
      },
      format: 'yyyy-MM-dd',
    },
    backgroundColor: 'transparent',
    colors: [`#90a7ac`],
    chartArea: {
      width: width,
      height: height,
      // backgroundColor: '#90a7ac'
    },
    legend: {
      position: 'none',
    },
    animation: {
      duration: 500, // Set animation duration (milliseconds)
      easing: 'linear',
      startup: true,
    },
    pointSize: 3, // Adjust the size of the data point markers (dots)
  };
}


// get entity non fungible state > get entity non fungible ids
export async function getNftIds() {

  const stateEntityNonFungiblesPageRequest = {
    address: accountAddress,
    aggregation_level: 'Vault',
  };

  let response = await stateApi.entityNonFungiblesPage({
    stateEntityNonFungiblesPageRequest,
  });

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

  // Initialize variables to store the sum
  let total_lsu = 0;
  let total_staking_rewards = 0;
  let total_interest_earnings = 0;

  let idArray = [];

  try {
    idArray = await getNftIds();
  } catch (error) {
    console.error("An error occurred while fetching NFT IDs:", error);
    idArray = []
  }

  // Get the reference to the results container element
  const resultsContainer = document.getElementById('results-container');
  // Clear the previous results
  resultsContainer.innerHTML = '';

  if (idArray.length > 0 ) {

    let state = await getState();

    console.log("state: ",state);

    let indexMap = state.fields[4];

    let rewards_liquidity = parseFloat(state.fields[9].value);

    let lsu_total_pool_amount = await getCurrentTvlAmount();

    let proportion_rewards = rewards_liquidity/lsu_total_pool_amount;

    console.log("rewardsLiquidity, lsu_total_pool_amount, proportion_rewards: ", 
      rewards_liquidity, lsu_total_pool_amount, proportion_rewards);

    // Process each ID individually
    idArray.forEach(async (id) => {

      let [box_nr, lsu_amount, staking_rewards, interest_earnings] = await queryKvs(id);

      // Parse values as floats
      lsu_amount = parseFloat(lsu_amount);
      staking_rewards = parseFloat(staking_rewards);
      interest_earnings = parseFloat(interest_earnings);

      let box_info;

      for (const entryKey in indexMap.entries) {
        const entry = indexMap.entries[entryKey];
        if (entry.key.value === box_nr) {
          box_info = entry.value.elements;
        }
      }
      
      let box_lsu_amount = parseFloat(box_info[1].value);
      let box_staking_rewards_distributed = parseFloat(box_info[2].value);
      let box_staking_rewards_undistributed = parseFloat(box_info[3].value);
      let box_interest_earnings_undistributed = parseFloat(box_info[5].value);

      console.log(box_lsu_amount, box_staking_rewards_distributed, box_staking_rewards_undistributed, box_interest_earnings_undistributed);

      let relative_lsu_stake = lsu_amount / box_lsu_amount;

      let relative_xrd_stake;
      
      if (box_staking_rewards_distributed > 0) {
        relative_xrd_stake = staking_rewards / box_staking_rewards_distributed
      } else {
        relative_xrd_stake = relative_lsu_stake
      }

      console.log(relative_lsu_stake, relative_xrd_stake)

      staking_rewards += box_staking_rewards_undistributed * relative_lsu_stake;

      interest_earnings += box_interest_earnings_undistributed * relative_xrd_stake;
      
      console.log("resources after: ", box_nr, lsu_amount, staking_rewards, interest_earnings)

      staking_rewards += lsu_amount * proportion_rewards;

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

  // Assess if the fetchedData returns NULL, undefined or empty
  const fetchedData = await fetchApyData();
  const dataArray = fetchedData && fetchedData.length > 0 ? fetchedData : testApyDataArray;

  console.log("testApyDataArray APY data:");
  console.log(testApyDataArray);

  console.log("dataArray APY data:");
  console.log(dataArray);

  const dataTable1 = new google.visualization.DataTable();
  dataTable1.addColumn('date', 'Date');
  dataTable1.addColumn('number', 'value');

  const dataTable2 = new google.visualization.DataTable();
  dataTable2.addColumn('date', 'Date');
  dataTable2.addColumn('number', 'value');

  const dataTable3 = new google.visualization.DataTable();
  dataTable3.addColumn('date', 'Date');
  dataTable3.addColumn('number', 'value');

  for (const [key, entry] of Object.entries(dataArray)) {
    const timestamp = entry.timestamp;
    const date = new Date(timestamp);
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
    const interest_earnings_apy = entry.interest_earnings_apy / 100;
    const staking_rewards_apy = entry.staking_rewards_apy / 100;
    const total_earnings_apy = entry.total_earnings_apy / 100;
  
    dataTable1.addRow([formattedDate, staking_rewards_apy]);
    dataTable2.addRow([formattedDate, interest_earnings_apy]);
    dataTable3.addRow([formattedDate, total_earnings_apy]);
  }
  

  console.log("dataTable1:");
  console.log(dataTable1);

  return [dataTable1, dataTable2, dataTable3];
}

var apyChart;

async function drawApyCharts(chartId) {

  const [dataTable1, dataTable2, dataTable3] = await processApyData();

  let dataTable;
  let options;
  let hTitle = 'Date';
  let width = '80%';
  let height = '60%';
  let format = 'percent'

  options = createOptions(hTitle, width, height, format)

  var container = document.getElementById('chart');

  if (chartId === 'chart1') {
    dataTable = dataTable1
  } else if (chartId === 'chart2') {
    dataTable = dataTable2
  } else if (chartId === 'chart3') {
    dataTable = dataTable3
  }

  if (!apyChart) {
    apyChart = new google.visualization.AreaChart(container);
  }

  apyChart.draw(dataTable, options);

  // Redraw the chart whenever the window is resized
  window.addEventListener('resize', function () {
    apyChart.draw(dataTable, options);
  });
}

// Event listeners for toggling charts
document.getElementById('chart1Btn').addEventListener('click', function () {
  drawApyCharts('chart1');
});

document.getElementById('chart2Btn').addEventListener('click', function () {
  drawApyCharts('chart2');
});

document.getElementById('chart3Btn').addEventListener('click', function () {
  drawApyCharts('chart3');
});





// fetch nft info from postgreSQL database
async function fetchNftData() {
  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/nft_data`;

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

var userChart;

async function drawUserCharts(chartId) {

  const [dataTable1, dataTable2, dataTable3] = await processTableData();

  let dataTable;
  let options;
  let hTitle = 'Date';
  let width = '80%';
  let height = '60%';
  let format = 'short'

  options = createOptions(hTitle, width, height, format)

  var container = document.getElementById('chart2');

  if (chartId === 'chart4') {
    dataTable = dataTable1
  } else if (chartId === 'chart5') {
    dataTable = dataTable2
  } else if (chartId === 'chart6') {
    dataTable = dataTable3
  }

  if (!userChart) {
    userChart = new google.visualization.AreaChart(container);
  }

  userChart.draw(dataTable, options);

  // Redraw the chart whenever the window is resized
  window.addEventListener('resize', function () {
    userChart.draw(dataTable, options);
  });
}

// Event listeners for toggling charts
document.getElementById('chart4Btn').addEventListener('click', function () {
  drawUserCharts('chart4');
});

document.getElementById('chart5Btn').addEventListener('click', function () {
  drawUserCharts('chart5');
});

document.getElementById('chart6Btn').addEventListener('click', function () {
  drawUserCharts('chart6');
});





// Function to process the table data into three separate DataTables
async function processFlashloanData() {

  const dataArray = await fetchFlashloanData();

  console.log("dataArray flashloan data:");
  console.log(dataArray);

  const dataTable1 = new google.visualization.DataTable();
  dataTable1.addColumn('date', 'Date');
  dataTable1.addColumn('number', '#');

  const dataTable2 = new google.visualization.DataTable();
  dataTable2.addColumn('date', 'Date');
  dataTable2.addColumn('number', 'XRD');

  for (const [key, entry] of Object.entries(dataArray)) {
    const date = new Date(entry.date);
    // const date = new Date(date);
    // const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
    const sum_total_xrd = entry.sum_volume_loans;
    const sum_volume_loans = entry.sum_total_xrd;
  
    dataTable1.addRow([date, sum_total_xrd]);
    dataTable2.addRow([date, sum_volume_loans]);
  }

  console.log("fetchFlashloanData dataTable1:");
  console.log(dataTable1);

  return [dataTable1, dataTable2];
}

var flashloanChart;

async function drawFlashloanCharts(chartId) {

  const [dataTable1, dataTable2] = await processFlashloanData();

  // let chart;
  let dataTable;
  let hTitle = 'Date';
  let width = '75%';
  let height = '70%';
  let format = 'short'

  var container = document.getElementById('chart-flashloan');

  if (chartId === 'chart999') {
    dataTable = dataTable1
  } else if (chartId === 'chart998') {
    dataTable = dataTable2
  }

  let options = createOptions(hTitle, width, height, format)

  if (!flashloanChart) {
    flashloanChart = new google.visualization.AreaChart(container);
  }
  
  flashloanChart.draw(dataTable, options);

  // Redraw the chart whenever the window is resized
  window.addEventListener('resize', function () {
    flashloanChart.draw(dataTable, options);
  });
}

// Event listeners for toggling charts
document.getElementById('chart999Btn').addEventListener('click', function () {
  drawFlashloanCharts('chart999');
});

document.getElementById('chart998Btn').addEventListener('click', function () {
  drawFlashloanCharts('chart998');
});






// Function to process the table data into three separate DataTables
async function processTvlData() {

  const dataArray = await fetchTvlData();

  console.log("dataArray flashloan data:");
  console.log(dataArray);

  const dataTable1 = new google.visualization.DataTable();
  dataTable1.addColumn('date', 'Date');
  dataTable1.addColumn('number', 'LSU');

  const dataTable2 = new google.visualization.DataTable();
  dataTable2.addColumn('date', 'Date');
  dataTable2.addColumn('number', 'LSU');

  const dataTable3 = new google.visualization.DataTable();
  dataTable3.addColumn('date', 'Date');
  dataTable3.addColumn('number', 'XRD');

  for (const [key, entry] of Object.entries(dataArray)) {
    const date = new Date(entry.date);
  
    const lsu_total = parseInt(entry.lsu_total);
    const stake = parseInt(entry.stake);
    const liquidity_total = parseInt(entry.liquidity_total);
    
    dataTable1.addRow([date, lsu_total]);
    dataTable2.addRow([date, stake]);
    dataTable3.addRow([date, liquidity_total]);
  }

  return [dataTable1, dataTable2, dataTable3 ];
}

var tvlChart;

async function drawTvlCharts(chartId) {
  try {
    const [dataTable1, dataTable2, _dataTable3 ] = await processTvlData();

    console.log("dataTable1:", dataTable1);
    console.log("dataTable2:", dataTable2);

    let dataTable;
    let options;
    let hTitle = 'Date';
    let width = '75%';
    let height = '70%';
    let format = 'short';

    var container = document.getElementById('chart-tvl');

    if (chartId === 'chart997') {
      dataTable = dataTable1
      options = createOptions(hTitle, width, height, format)
    } else if (chartId === 'chart996') {
      dataTable = dataTable2
      options = createOptions(hTitle, width, height, format)
    }

    if (!tvlChart) {
      tvlChart = new google.visualization.AreaChart(container);
    }

    tvlChart.draw(dataTable, options);

    // Redraw the chart whenever the window is resized
    window.addEventListener('resize', function () {
      tvlChart.draw(dataTable, options);
    });

  } catch(error) {
    console.error("Error processing TVL data:", error);
  }
}

// Event listeners for toggling charts
document.getElementById('chart997Btn').addEventListener('click', function () {
  drawTvlCharts('chart997');
});

document.getElementById('chart996Btn').addEventListener('click', function () {
  drawTvlCharts('chart996');
});


var liquidityChart;

async function drawLiquidityCharts() {
  try {
    const [_dataTable1, _dataTable2, dataTable3 ] = await processTvlData();

    let dataTable = dataTable3;
    let hTitle = 'Date';
    let width = '75%';
    let height = '70%';
    let format = '0';

    let options = createOptions(hTitle, width, height, format)

    var container = document.getElementById('chart-liquidity');

    if (!liquidityChart) {
      liquidityChart = new google.visualization.AreaChart(container);
    }

    liquidityChart.draw(dataTable, options);

    // Redraw the chart whenever the window is resized
    window.addEventListener('resize', function () {
      liquidityChart.draw(dataTable, options);
    });

  } catch(error) {
    console.error("Error processing liquidity data:", error);
  }
}