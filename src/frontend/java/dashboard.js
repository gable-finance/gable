import { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';
import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
import { componentAddress, xrdAddress, nft_address } from './global-states.js';

let accountAddress;

const dAppId = 'account_tdx_c_1pyu3svm9a63wlv6qyjuns98qjsnus0pzan68mjq2hatqejq9fr'; // temp

const rdt = RadixDappToolkit(
  {
    dAppDefinitionAddress: dAppId,
    dAppName: 'Sundae Liquidity Protocol',
  },
  (requestData) => {
    requestData({
      accounts: { quantifier: 'atLeast', quantity: 1 },
    }).map(({ data: { accounts } }) => {
      // set your application state
      console.log('account data: ', accounts);
      accountAddress = accounts[0].address;
    });
  },
  {
    networkId: 12,
    onDisconnect: () => {
      // clear your application state
    },
    onInit: ({ accounts }) => {
      // set your initial application state
      console.log('onInit accounts: ', accounts);
      if (accounts.length > 0) {
        accountAddress = accounts[0].address;
      }
    },
  }
);
console.log('dApp Toolkit: ', rdt);

// Instantiate Gateway SDK
const stateApi = new StateApi();

// call functions
document.addEventListener('DOMContentLoaded', async () => {
  // Function to be executed once the page is loaded
  await getPoolAmount();
  await getValues();
  await getNftInfo();
  document.getElementById('get-nft-info').addEventListener('click', async () => {
    getNftInfo();
  });
  // getAccountInfo();
});

// get the component state
async function getState() {
  const stateEntityDetailsRequest = {
    addresses: [componentAddress],
  };

  let response = await stateApi.stateEntityDetails({ stateEntityDetailsRequest });

  if (response.items[0].details === undefined) return;

  let state = response.items[0].details.state.data_json;

  console.log(response);

  return state;
}

// get values from state
async function getValues() {
  let state = await getState();

  let last_epoch = state.fields[7].value;
  let interest_rate = state.fields[11].value;

  let interest_rate_percentage = interest_rate * 100;

  document.getElementById('interest-rate').innerText = interest_rate_percentage + '%';

  console.log(state);
  console.log(last_epoch);
  console.log(interest_rate);
}

// get the amount of liquidity in the pool from state
async function getPoolAmount() {
  const stateEntityFungibleResourceVaultsPageRequest = {
    address: componentAddress,
    resource_address: xrdAddress,
  };

  let response = await stateApi.entityFungibleResourceVaultPage({
    stateEntityFungibleResourceVaultsPageRequest,
  });

  if (response.items[0].amount === undefined) return;

  let pool_amount = response.items[0].amount;

  document.getElementById('pool-amount').innerText = pool_amount + ' XRD';

  console.log(response);
  console.log(pool_amount);
}

// get entity non fungible state > get entity non fungible ids
async function getNftIds() {
  const stateEntityNonFungiblesPageRequest = {
    address: accountAddress,
    aggregation_level: 'Vault',
  };

  let response = await stateApi.entityNonFungiblesPage({
    stateEntityNonFungiblesPageRequest,
  });

  console.log(accountAddress);
  console.log(typeof accountAddress);
  console.log(response);

  // Find the item with the matching resource address
  const item = response.items.find((item) => item.resource_address === nft_address);

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
    resource_address: nft_address,
    vault_address: vault_address,
  };

  let response2 = await stateApi.entityNonFungibleIdsPage({
    stateEntityNonFungibleIdsPageRequest,
  });

  console.log(response2);

  // Extract the non_fungible_id values into an array
  let nonFungibleIds = response2.items.map((item) => item.non_fungible_id);

  console.log(nonFungibleIds);

  return nonFungibleIds
}

// get the nft info (earnings) of the user
async function getNftInfo() {
  let nft_local_id = document.getElementById('nft-local-id').value;

  // Function to check if the key starts and ends with a hashtag
  function isValidKey(key) {
    return key.startsWith('#') && key.endsWith('#');
  }

  // Get the reference to the error message element
  const errorMessageElement = document.getElementById('error-message');

  // Validate the user input
  if (nft_local_id && !isValidKey(nft_local_id)) {
    // Display the error message
    displayErrorMessage('Invalid key format. Key must start and end with a hashtag (#).');
  } else {
    let idArray = [];

    // Check if nft_local_id is provided
    if (nft_local_id) {
      // Split the nft_local_id string into an array of IDs
      idArray = nft_local_id.split(',');
    } else {
      // Call getNftIds() to retrieve the array of IDs
      idArray = await getNftIds();
      console.log(idArray);
    }

    // Get the reference to the results container element
    const resultsContainer = document.getElementById('results-container');
    // Clear the previous results
    resultsContainer.innerHTML = '';

    // Proceed only if there are IDs to process
    if (idArray.length > 0) {
      let state = await getState();

      // Access the map directly assuming it's at index 6
      let map = state.fields[6];

      // Retrieve the values from the map using the key
      const mapEntries = map.entries;

      // Process each ID individually
      idArray.forEach((id) => {
        // Find the entry in the map with the matching key
        const foundEntry = mapEntries.find((entry) => entry[0] === id);

        if (foundEntry) {
          const values = foundEntry[1];

          // let supplied_epoch = values[0];
          let lsu_amount = values[1];
          let staking_rewards = values[2];
          let interest_earnings = values[3];

          // Convert the strings to numbers
          lsu_amount = parseFloat(lsu_amount);
          staking_rewards = parseFloat(staking_rewards);
          interest_earnings = parseFloat(interest_earnings);

          // Calculate the total XRD
          const total_xrd = staking_rewards + staking_rewards + interest_earnings;

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

        } else {
          console.log(`Entry not found for ID ${id}.`);
          displayErrorMessage(`Entry not found for ID ${id}.`);
        }
      });

    } else {
      console.log('Entry not found.');
      displayErrorMessage('Entry not found.');
    }
  }
}

// Display error message
function displayErrorMessage(message) {
  // Get the error message elements
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  const closeButton = document.getElementById('close-button');

  // Set the error message text
  errorText.textContent = message;

  // Show the error message
  errorMessage.style.display = 'block';

  // Add click event listener to the close button
  closeButton.addEventListener('click', hideErrorMessage);
}

// Hide error message
function hideErrorMessage() {
  // Get the error message element
  const errorMessage = document.getElementById('error-message');

  // Hide the error message
  errorMessage.style.display = 'none';
}
