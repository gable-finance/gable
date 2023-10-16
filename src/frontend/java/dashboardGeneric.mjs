import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
import { componentAddress, xrdAddress, nftAddress, keyvaluestore } from './global-states.mjs';

// Instantiate Gateway SDK
const stateApi = new StateApi();
// const accountAddress = data.accountAddress;

// call functions
// document.addEventListener('DOMContentLoaded', async () => {
//   // Function to be executed once the page is loaded
//   await getPoolAmount();
//   await showInterestRate();

// });

// get the component state
export async function getState() {
  const stateEntityDetailsRequest = {
    addresses: [componentAddress],
  };

  let response = await stateApi.stateEntityDetails({ stateEntityDetailsRequest });

  if (response.items[0].details === undefined) return;

  let state = response.items[0].details.state;

  console.log(response);

  return state;
}

// get the component state
export async function getNftData(nft_id) {

  const stateNonFungibleDataRequest = {
    resource_address: nftAddress,
    non_fungible_ids: [nft_id],
  };

  let response = await stateApi.nonFungibleData({ stateNonFungibleDataRequest });

  if (response.non_fungible_ids[0] === undefined) return;

  let id = response.non_fungible_ids[0];

  let data = id.data;

  let programmatic_json = data.programmatic_json;

  let fields = programmatic_json.fields[0];

  let value = fields.value;

  console.log(value);
  
  return value
}

// get the component state
export async function queryKvs(nft_id) {
  
  let box_nr = await getNftData(nft_id)

  const stateKeyValueStoreDataRequest = {
    key_value_store_address: keyvaluestore,
    keys: [
      {
        key_json: {
          kind: "U64",
          value: box_nr
        }
      }
    ]
  };

  let response = await stateApi.keyValueStoreData({ stateKeyValueStoreDataRequest });

  console.log("etsdtstdda", response);

  let entry = response.entries[0]

  let value = entry.value;

  let programmatic_json = value.programmatic_json;

  let entries = programmatic_json.entries;
  
  let lsu_amount;
  let staking_rewards;
  let interest_earning;

  for (const entry of entries) {
    if (entry.key.value === nft_id) {
      let elements = entry.value.elements;

      lsu_amount = elements[0].value;
      staking_rewards = elements[1].value;
      interest_earning = elements[2].value;

      break;
    }
  }

  console.log(lsu_amount, staking_rewards, interest_earning)

  return [lsu_amount, staking_rewards, interest_earning]
  
}

// get the amount of liquidity in the pool from state
export async function getPoolAmount() {
  const stateEntityFungibleResourceVaultsPageRequest = {
    address: componentAddress,
    resource_address: xrdAddress,
  };

  let response = await stateApi.entityFungibleResourceVaultPage({
    stateEntityFungibleResourceVaultsPageRequest,
  });

  if (response.items[0].amount === undefined) return;

  let pool_amount = response.items[0].amount;

  console.log("pool_amount: ", pool_amount);

  return pool_amount
}

export async function showPoolAmount() {

  let pool_amount = await getPoolAmount();

  console.log("pool_amount3: ", pool_amount);

  const poolAmountElement = document.getElementById('show-pool-amount');

  poolAmountElement.innerText = pool_amount + ' XRD';

}

// get values from state
export async function getInterestRate() {

  let state = await getState();

  // let last_epoch = state.fields[7].value;
  let interest_rate = state.fields[14].value;

  return interest_rate
}

// get values from state
export async function showInterestRate() {

  // let last_epoch = state.fields[7].value;
  let interest_rate = await getInterestRate();
  let interest_rate_percentage = interest_rate * 100;

  const poolAmountElement = document.getElementById('show-interest-rate');

  poolAmountElement.innerText = interest_rate_percentage + '%';
}

// fetch apy data from the API
export async function fetchApyData() {
  // Define the API URL
  const apiUrl = 'http://192.168.1.65:8000/api/apy_data';

  try {
    // Make the API call
    const response = await fetch(apiUrl);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch APY data');
    }

    const data = await response.json();

    // Process the API response data
    console.log(data);

    const processedData = [];

    for (const entry of data) {
      const timestamp = entry.timestamp;
      const interest_earnings_apy = entry.interest_earnings_apy * 100;
      const staking_rewards_apy = entry.staking_rewards_apy * 100;
      const total_earnings_apy = entry.total_earnings_apy * 100;

      const result = {
        timestamp,
        interest_earnings_apy,
        staking_rewards_apy,
        total_earnings_apy
      };

      processedData.push(result);
    }

    console.log("Processed data:");
    console.log(processedData);

    return processedData;

  } catch (error) {
    // Handle any errors
    console.error(error);
  }
}

export async function showApy() {

  const apyStakingElement = document.getElementById('apy-staking');
  const apyInterestElement = document.getElementById('apy-interest');
  const apyTotalElement = document.getElementById('apy-total');

  try {

    let apy_data = await fetchApyData();

    let interest_earnings_apy = apy_data[0].interest_earnings_apy;
    let staking_rewards_apy = apy_data[0].staking_rewards_apy;
    let total_earnings_apy = apy_data[0].total_earnings_apy;

    apyStakingElement.innerText = parseFloat(staking_rewards_apy).toFixed(2) + '%';
    apyInterestElement.innerText = parseFloat(interest_earnings_apy).toFixed(2) + '%';
    apyTotalElement.innerText = parseFloat(total_earnings_apy).toFixed(2) + ' %';

  } catch(error) {

    apyStakingElement.innerText = '-';
    apyInterestElement.innerText = '-';
    apyTotalElement.innerText = '-';

  }
}
