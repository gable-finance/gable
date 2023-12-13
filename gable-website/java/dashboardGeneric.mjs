import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
import { componentAddress, xrdAddress, nftAddress, keyvaluestore, rootApiUrl, lsuAddress } from './global-states.mjs';

// Instantiate Gateway SDK
const stateApi = new StateApi();

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


// get the fungible amount
export async function getfungible(accountAddress, resourceAddress) {
  
  const EntityFungiblesPageRequest = {
    stateEntityFungiblesPageRequest: {
    address: accountAddress,
  }};

  let response = await stateApi.entityFungiblesPage(EntityFungiblesPageRequest);

  for (let i = 0; i < response.items.length; i++) {
    if (response.items[i].resource_address === resourceAddress) {
      return response.items[i].amount;
    }
  }
  return "Required token not found in wallet";

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

  return [box_nr, lsu_amount, staking_rewards, interest_earning]
  
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

// get the amount of liquidity in the pool from state
export async function getCurrentTvlAmount() {
  const stateEntityFungibleResourceVaultsPageRequest = {
    address: componentAddress,
    resource_address: lsuAddress,
  };

  let response = await stateApi.entityFungibleResourceVaultPage({
    stateEntityFungibleResourceVaultsPageRequest,
  });

  if (response.items[0].amount === undefined) return;

  // Assuming 'response' is the object containing the 'items' array
  let lsu_total_pool_amount;

  // Find the item with the specified 'vault_address'
  const item = response.items.find(item => item.vault_address === "internal_vault_rdx1trn20juu2v4te6ajjw36cve2hgfnehczj2sce7qshrrzhf9j3jk78t");

  // If the item is found, assign its 'amount' property to 'lsu_total_pool_amount'
  if (item) {
      lsu_total_pool_amount = item.amount;
  } else {
      // Handle the case where the 'vault_address' is not found
      console.error("Vault address not found in the response.");
  }

  return lsu_total_pool_amount
}

// Function to fetch TVL data from the API
export async function getTvlData() {
  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/tvl_data`;

  try {
    // Make the API call
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch TVL data');
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Failed to fetch TVL data', error);
    throw error; // Re-throw the error for the calling code to handle
  }
}

// Function to display TVL data on the webpage
export async function showTvl() {
  try {
    // Fetch TVL data
    const data = await getTvlData();

    // Process the API response data
    const lsu_locked = parseInt(data.lsu_locked);
    const lsu_total = parseInt(data.lsu_total);

    console.log("lsu_total:", lsu_total);

    const lsuLockedElement = document.getElementById('lsu-locked');
    const lsuTotalElement = document.getElementById('lsu-total');

    lsuLockedElement.innerText = lsu_locked.toLocaleString() + ' LSU';
    lsuTotalElement.innerText = lsu_total.toLocaleString() + ' LSU';

  } catch (error) {
    console.error('Failed to display TVL data', error);
    // You might want to handle the error or log it accordingly
  }
}

export async function showPoolAmount() {

  let pool_amount = await getPoolAmount();

  let pool_amount_fixed = parseFloat(pool_amount).toFixed(2);

  pool_amount_fixed = parseFloat(pool_amount_fixed).toLocaleString();

  console.log("pool_amount3: ", pool_amount_fixed);

  const poolAmountElement = document.getElementById('show-pool-amount');
  
  poolAmountElement.innerText = pool_amount_fixed + ' XRD';

}


// get the amount of liquidity in the pool from state
export async function showFlashloan() {

  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/flashloan_day_data`;

  try {
    // Make the API call
    const response = await fetch(apiUrl);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch flashloan data');
    }

    const data = await response.json();

    // Process the API response data
    console.log(data);

    // const date = data[0].date;
    const sum_total_xrd = parseFloat(data.sum_total_xrd).toFixed(2);
    const sum_volume_loans = parseInt(data.sum_volume_loans);

    console.log("sum_total_xrd:", sum_total_xrd);

    const xrdvolumeElement = document.getElementById('xrd-volume');
    const volumeElement = document.getElementById('volume');

    xrdvolumeElement.innerText = parseFloat(sum_total_xrd).toLocaleString() + ' XRD';
    volumeElement.innerText = sum_volume_loans.toLocaleString() + 'x';

  } catch(error) {
    console.log('Failed to fetch flashloan data')
  }
};

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
  const apiUrl = `${rootApiUrl}/api/apy_data`;

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

    interest_earnings_apy = parseFloat(interest_earnings_apy).toFixed(2);
    staking_rewards_apy = parseFloat(staking_rewards_apy).toFixed(2);
    total_earnings_apy = parseFloat(total_earnings_apy).toFixed(2);

    console.log("interest_earnings_apy: ", interest_earnings_apy);

    apyStakingElement.innerText = parseFloat(staking_rewards_apy).toLocaleString() + '%';
    apyInterestElement.innerText = parseFloat(interest_earnings_apy).toLocaleString() + '%';
    apyTotalElement.innerText = parseFloat(total_earnings_apy).toLocaleString() + '%';

  } catch(error) {

    apyStakingElement.innerText = '-';
    apyInterestElement.innerText = '-';
    apyTotalElement.innerText = '-';

  }
}

// fetch apy data from the API
export async function fetchFlashloanData() {
  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/flashloan_hist_data`;

  try {
    // Make the API call
    const response = await fetch(apiUrl);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch flashloan data');
    }

    const data = await response.json();

    // Process the API response data
    console.log(data);

    const processedData = [];

    for (const entry of data) {
      const date = entry.date;
      const sum_total_xrd = entry.sum_total_xrd;
      const sum_volume_loans = entry.sum_volume_loans;

      const result = {
        date,
        sum_total_xrd,
        sum_volume_loans
      };

      processedData.push(result);
    }

    console.log("Processed flashloan data:");
    console.log(processedData);

    return processedData;

  } catch (error) {
    // Handle any errors
    console.error(error);
  }
}

// fetch apy data from the API
export async function fetchTvlData() {
  // Define the API URL
  const apiUrl = `${rootApiUrl}/api/state_hist_data`;

  try {
    // Make the API call
    const response = await fetch(apiUrl);

    console.log(response);

    if (!response.ok) {
      throw new Error('Failed to fetch tvl data');
    }

    const data = await response.json();

    // Process the API response data
    console.log(data);

    const processedData = [];

    for (const entry of data) {
      const date = entry.date;
      const liquidity_total = entry.liquidity_total;
      const lsu_total = entry.lsu_total;
      const stake = entry.stake;

      const result = {
        date,
        liquidity_total,
        lsu_total,
        stake
      };

      processedData.push(result);
    }

    console.log("Processed tvl data:");
    console.log(processedData);

    return processedData;

  } catch (error) {
    // Handle any errors
    console.error(error);
  }
}