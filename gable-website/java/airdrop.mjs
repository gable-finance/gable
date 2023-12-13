import { rootApiUrl } from './global-states.mjs';

google.charts.load('current', { packages: ['corechart'] });

google.charts.setOnLoadCallback(function () {
  showUpdateDate();
});

function createOptions(hTitle, width, height) {
  return {
    vAxis: {
      minorGridlines: {
        count: 0,
      },
      gridlines: {
        color: 'lightgray',
        opacity: 0.2,
      },
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

// fetch apy data from the API
export async function fetchUserData(accountAddress) {
  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/airdrop_data`;

  // Create the query string
  const queryString = `account_address=${encodeURIComponent(accountAddress)}`;

  console.log(queryString);

  try {
    // Make the API call
    const response = await fetch(`${apiUrl}?${queryString}`);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch supplier airdrop data');
    }

    const data = await response.json();

    console.log("data.length: ", data.length);

    if (data.length === 0) {
      // Throw an error if data is empty
      throw new Error('Account address not found as supplier');
    }

    // Process the API response data
    console.log("airdrop user data:", data);

    let airdropped;

    const apiUrl2 = `${rootApiUrl}/api/airdropped_data`;
    // const apiUrl2 = `http://localhost:8000/api/airdropped_data`;

    try {
      // Make the API call
      const response2 = await fetch(`${apiUrl2}?${queryString}`);
  
      console.log(response2);
  
      if (response2.ok) {
        const data2 = await response2.json();
        console.error("data2:", data2);
        airdropped = data2.airdropped_amount;
      } else {
        airdropped = 0;
      }
    } catch (error) {
      // Handle any errors
      console.error("An error occurred:", error);
      // Set airdropped to 0 in case of an error
      airdropped = 0;
    }

    const user_data = {
      date: data[0].date,
      entity_address: data[0].entity_address,
      balance_change_unlock: data[0].balance_change_unlock,
      balance_change_lock: data[0].balance_change_lock,
      balance_change_sum: data[0].balance_change_sum,
      airdropped: airdropped,
      airdrop: data[0].airdrop
    };

    console.log("airdrop user data:", user_data);
    console.log("airdropped user data:", airdropped);

    return user_data;

  } catch (error) {
    // Handle any errors    
    throw error;
  }
}

// get the amount of liquidity in the pool from state
export async function showUserData(accountAddress) {
  try {
    const userData = await fetchUserData(accountAddress);

    const entity_address = userData.entity_address;
    const balance_change_unlock = parseFloat(userData.balance_change_unlock).toFixed(2);
    const balance_change_lock = parseFloat(userData.balance_change_lock).toFixed(2);
    const balance_change_sum = parseFloat(userData.balance_change_sum).toFixed(2);
    const airdropped_amount = parseFloat(userData.airdropped).toFixed(2);
    const airdrop_amount = parseFloat(userData.airdrop).toFixed(2);
    const next_airdropped_amount = airdrop_amount - airdropped_amount;

    console.log("airdropped_amount:", airdropped_amount);

    const accountElement = document.getElementById('account');
    const lsuLockedElement = document.getElementById('lsu-locked');
    const lsuUnlockedElement = document.getElementById('lsu-unlocked');
    const lsuTotalElement = document.getElementById('lsu-total');
    const previousAirdropAmountElement = document.getElementById('previous-airdrop-amount');
    const nextAirdropAmountElement = document.getElementById('next-airdrop-amount');
    const totalAirdropAmountElement = document.getElementById('airdrop-amount');

    accountElement.innerText = 'account_...' + entity_address.substring(entity_address.length - 5);
    lsuLockedElement.innerText = parseFloat(balance_change_lock).toLocaleString() + ' LSU';
    lsuUnlockedElement.innerText = parseFloat(balance_change_unlock).toLocaleString() + ' LSU';
    lsuTotalElement.innerText = parseFloat(balance_change_sum).toLocaleString() + ' LSU';
    previousAirdropAmountElement.innerText = parseFloat(airdropped_amount).toLocaleString() + ' GAB';
    nextAirdropAmountElement.innerText = parseFloat(next_airdropped_amount).toLocaleString() + ' GAB';
    totalAirdropAmountElement.innerText = parseFloat(airdrop_amount).toLocaleString() + ' GAB';

    console.log("lsuLockedElement:", lsuLockedElement);

  } catch (error) {
    throw error;
  }
}

// fetch apy data from the API
export async function fetchAirdropData(accountAddress) {
  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/airdrop_hist_data`;

  // Create the query string
  const queryString = `account_address=${encodeURIComponent(accountAddress)}`;

  console.log(queryString);

  try {
    // Make the API call
    const response = await fetch(`${apiUrl}?${queryString}`);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch airdrop data');
    }

    const data = await response.json();

    // Process the API response data
    console.log("airdrop data:", data);

    const processedData = [];

    let airdrop = 0;

    for (const entry of data) {
      const date = entry.date;
      airdrop += entry.airdrop;

      const result = {
        date,
        airdrop
      };

      processedData.push(result);
    }

    console.log("Processed airdrop data:");
    console.log(processedData);

    return processedData;

  } catch (error) {
    // Handle any errors
    console.error(error);
  }
}

// Function to process the table data into three separate DataTables
async function processAirdropData(processedData) {

  console.log("processedData airdrop data:");
  console.log(processedData);

  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn('date', 'Date');
  dataTable.addColumn('number', 'GAB');

  for (const [key, entry] of Object.entries(processedData)) {
    const date = new Date(entry.date);
  
    const airdrop = entry.airdrop;
    
    dataTable.addRow([date, airdrop]);
  }

  return dataTable;
}




//////////////

// Get borrower data

// fetch apy data from the API
export async function fetchBorrowerData(accountAddress) {
  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/borrower_airdrop_data`;
  // const apiUrl = `http://localhost:8000/api/borrower_airdrop_data`;

  // Create the query string
  const queryString = `account_address=${encodeURIComponent(accountAddress)}`;

  console.log(queryString);

  try {
    // Make the API call
    const response = await fetch(`${apiUrl}?${queryString}`);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch borrower airdrop data');
    }

    const data = await response.json();

    console.log("data.length: ", data.length);

    if (data.length === 0) {
      // Throw an error if data is empty
      throw new Error('Account address not found as borrower');
    }

    // Process the API response data
    console.log("Airdrop borrower response:", data);

    // const borrower_data = {
    //   date: data[0].date,
    //   accountAddress,
    //   flashloan_count: data[0].flashloan_count,
    //   flashloan_total: data[0].flashloan_total,
    //   airdrop: data[0].airdrop
    // };

    // console.log("Airdrop borrower data:", borrower_data);

    return data;

  } catch (error) {
    // Handle any errors    
    throw error;
  }
}

// get the amount of liquidity in the pool from state
export async function showBorrowerData(accountAddress) {
  try {
    const borrowerData = await fetchBorrowerData(accountAddress);
    // const borrowerData = fetchBorrowerData('account_rdx128y22s3r8xs2kl3muy792srj5rh9z79e0zkkjrmvdlqrkzylerzypj')

    const entity_address = accountAddress;
    const sumFlashloanCount = borrowerData.reduce((sum, entry) => sum + entry.flashloan_count, 0);
    const sumFlashloanTotal = borrowerData.reduce((sum, entry) => sum + parseFloat(entry.flashloan_total), 0).toFixed(2);
    const sumAirdrop = borrowerData.reduce((sum, entry) => sum + parseFloat(entry.airdrop), 0).toFixed(2);

    console.log('Sum of flashloan_count:', sumFlashloanCount);
    console.log('Sum of flashloan_total:', sumFlashloanTotal);
    console.log('Sum of airdrop:', sumAirdrop);

    const accountElement = document.getElementById('borrower-account');
    const sumFlashloanCountElement = document.getElementById('flashloan-count');
    const sumFlashloanTotalElement = document.getElementById('flashloan-total');
    const sumAirdropElement = document.getElementById('borrower-airdrop-amount');

    accountElement.innerText = 'account_...' + entity_address.substring(entity_address.length - 5);
    sumFlashloanCountElement.innerText = parseFloat(sumFlashloanCount).toLocaleString();
    sumFlashloanTotalElement.innerText = parseFloat(sumFlashloanTotal).toLocaleString() + ' XRD';
    sumAirdropElement.innerText = parseFloat(sumAirdrop).toLocaleString() + ' GAB';

  } catch (error) {
    throw error;
  }
}

showBorrowerData('account_rdx128y22s3r8xs2kl3muy792srj5rh9z79e0zkkjrmvdlqrkzylerzypj')

///////////////////


async function drawAirdropChart(accountAddress, user) {
  try {

    let processedData;
    let container;

    if (user == 'supplier') {
      processedData = await fetchAirdropData(accountAddress)
      console.log("Airdrop supplier processedData: ", processedData)
      container = document.getElementById('chart-airdrop');
    } else {
      processedData = await fetchBorrowerData(accountAddress)
      console.log("Airdrop borrower processedData: ", processedData)
      container = document.getElementById('chart-borrower-airdrop');
    }

    try {

      const dataTable = await processAirdropData(processedData);
      console.log("Airdrop dataTable: ", dataTable)

      console.log("dataTable:", dataTable);

      let hTitle = 'Date';
      let width = '85%';
      let height = '80%';
      let options = createOptions(hTitle, width, height)

      let chart = new google.visualization.AreaChart(container);

      chart.draw(dataTable, options);

      // Redraw the chart whenever the window is resized
      window.addEventListener('resize', function () {
        chart.draw(dataTable, options);
      });

    } catch(error) {
      console.error("Error processing airdrop data:", error);  
    }
  } catch(error) {
    console.error("Error fetching airdrop data:", error);
  }  
}

// var chart;

// Function to handle airdrop button click
async function handleAirdropButtonClick(accountAddress, contentId, DataFunction, user, tabButtonId) {

  // Check if accountAddress is valid using the provided validator function
  if (!accountAddress.startsWith('account_')) {
    const errorMessage = 'Invalid account address. It must start with "account_".'; // Customize your error message here

    errorDiv.textContent = errorMessage;
    errorContainer.style.display = 'flex';

    throw new Error('Invalid account address. It must start with "account_".');
  }

  try {
    // Call the provided userDataFunction
    await DataFunction(accountAddress);
  } catch(error) {
    errorDiv.textContent = error;
    errorContainer.style.display = "flex";
    return;
  }

  const airdropElement = document.getElementById(contentId);

  airdropElement.style.display = 'flex';
  errorContainer.style.display = 'none';

  // Call the provided chartDrawingFunction
  await drawAirdropChart(accountAddress, user);

  // Add active class to the clicked button
  document.getElementById(tabButtonId).classList.add('active');
}

// Example usage

// Event listener for the airdrop button
document.getElementById('airdrop-go').addEventListener('click', () => {
  const accountAddress = document.getElementById("airdrop-address").value;
  const contentId = 'content1'
  const contentId2 = 'content2'
  const user = 'supplier'
  const tabButtonId = 'tabButton1'
  const tabButtonId2 = 'tabButton2'
  const DataFunction = (accountAddress) => showUserData(accountAddress);

  handleAirdropButtonClick(accountAddress, contentId, DataFunction, user, tabButtonId)
  
  const airdropOtherElement = document.getElementById(contentId2);
  airdropOtherElement.style.display = 'none';

  document.getElementById(tabButtonId2).classList.remove('active');

});

// Add an event listener for each tab button
document.getElementById('tabButton1').addEventListener('click', () => {
  const accountAddress = document.getElementById("airdrop-address").value;
  const contentId = 'content1'
  const contentId2 = 'content2'
  const user = 'supplier'
  const tabButtonId = 'tabButton1'
  const tabButtonId2 = 'tabButton2'
  const DataFunction = (accountAddress) => showUserData(accountAddress);

  handleAirdropButtonClick(accountAddress, contentId, DataFunction, user, tabButtonId)
  
  const airdropOtherElement = document.getElementById(contentId2);
  airdropOtherElement.style.display = 'none';

  document.getElementById(tabButtonId2).classList.remove('active');

});

document.getElementById('tabButton2').addEventListener('click', () => {
  const accountAddress = document.getElementById("airdrop-address").value;
  const contentId = 'content2'
  const contentId2 = 'content1'
  const user = 'borrower'
  const tabButtonId = 'tabButton2'
  const tabButtonId2 = 'tabButton1'
  const DataFunction = (accountAddress) => showBorrowerData(accountAddress);

  handleAirdropButtonClick(accountAddress, contentId, DataFunction, user, tabButtonId)
    
  const airdropOtherElement = document.getElementById(contentId2);
  airdropOtherElement.style.display = 'none';

  document.getElementById(tabButtonId2).classList.remove('active');

});

const errorDiv = document.getElementById("airdrop-error-message");
const errorContainer = document.getElementById("airdrop-error");

document.getElementById("airdrop-error-button").addEventListener("click", function () {
  errorContainer.style.display = "none";
});

// CHANGE TAB

// function changeTab(event, tabId, tabId2) {

//   const airdropElement = document.getElementById(tabId2);

//   // Check if the current display style is 'flex'
//   if (airdropElement.style.display === 'flex') {
//     // Perform your conditional operation here
//     console.log('Please connect a wallet');
//   } else {
//     console.log('The display style is not flex.');
//   }

//   var tabContents = document.getElementsByClassName('tab-content');
//   for (var i = 0; i < tabContents.length; i++) {
//     tabContents[i].style.display = 'none';
//   }

//   var selectedTab = document.getElementById(tabId);
//   selectedTab.style.display = 'block';

//   // Remove active class from all buttons
//   var tabButtons = document.getElementsByClassName('tab-button');
//   for (var i = 0; i < tabButtons.length; i++) {
//     tabButtons[i].classList.remove('active');
//   }

//   // Add active class to the clicked button
//   event.target.classList.add('active');

//   event.preventDefault();
// }



// AIRDROP UPDATE DATE

// get the amount of liquidity in the pool from state
export async function showUpdateDate() {

  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/airdrop_latest_update`;

  try {
    // Make the API call
    const response = await fetch(`${apiUrl}`);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch airdrop latest update date');
    }

    const data = await response.json();

    if (data.length === 0) {
      // Throw an error if data is empty
      throw new Error('Latest update date not found');
    }

    // Process the API response data
    console.log("airdrop user data:", data);

    // Convert the timestamp to a Date object
    const originalDate = new Date(data.timestamp);

    // Format the date to 'yyyy-mm-dd hh:mm'
    const formattedDate = originalDate.toISOString().slice(0, 16).replace('T', ' ');

    const dateElement = document.getElementById('update-date');

    dateElement.innerText = formattedDate;

  } catch (error) {
    // Handle any errors    
    throw error;
  }
}





