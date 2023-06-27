import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
import { nft_address } from './global-states.js';
import { accountAddress } from './accountAddress.js'

// Instantiate Gateway SDK
const stateApi = new StateApi();
// const accountAddress = data.accountAddress;

// call functions
document.addEventListener('DOMContentLoaded', async () => {

  // await getNftInfo();
  document.getElementById('get-nft-info').addEventListener('click', async () => {
    getNftInfo();
  });

  if (typeof accountAddress !== 'undefined') {
    getNftInfo();
  }

});

// get entity non fungible state > get entity non fungible ids
async function getNftIds() {
  console.log(accountAddress)

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

  // Initialize variables to store the sum
  let total_lsu = 0;
  let total_staking_rewards = 0;
  let total_interest_earnings = 0;

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
      idArray = nft_local_id.replace(/\s/g, '').split(',');
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

          // Convert the strings to numbers and round to two decimal points
          lsu_amount = parseFloat(lsu_amount).toFixed(2);
          staking_rewards = parseFloat(staking_rewards).toFixed(2);
          interest_earnings = parseFloat(interest_earnings).toFixed(2);

          // Update the sum variables
          total_lsu += parseFloat(lsu_amount);
          total_staking_rewards += parseFloat(staking_rewards);
          total_interest_earnings += parseFloat(interest_earnings);

          // Calculate the total XRD
          const total_xrd = (parseFloat(staking_rewards) + parseFloat(staking_rewards) + parseFloat(interest_earnings)).toFixed(2);

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

  // Update the HTML placeholders with the calculated sums
  document.getElementById('total-lsu').textContent = (total_lsu.toFixed(2) + ' LSU');
  document.getElementById('total-staking-rewards').textContent = (total_staking_rewards.toFixed(2) + ' XRD');
  document.getElementById('total-interest-earnings').textContent = (total_interest_earnings.toFixed(2) + ' XRD');

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
