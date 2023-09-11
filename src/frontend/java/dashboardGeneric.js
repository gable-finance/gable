import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
import { componentAddress, xrdAddress } from './global-states.js';

// Instantiate Gateway SDK
const stateApi = new StateApi();
// const accountAddress = data.accountAddress;

// call functions
document.addEventListener('DOMContentLoaded', async () => {
  // Function to be executed once the page is loaded
  await getPoolAmount();
  await getValues();

});

// get the component state
export async function getState() {
  const stateEntityDetailsRequest = {
    addresses: [componentAddress],
  };

  let response = await stateApi.stateEntityDetails({ stateEntityDetailsRequest });

  if (response.items[0].details === undefined) return;

  let state = response.items[0].details.state.programmatic_json;

  console.log(response);

  return state;
}

// get values from state
async function getValues() {
  let state = await getState();

  // let last_epoch = state.fields[7].value;
  let interest_rate = state.fields[13].value;

  // console.log("Last epoch: ", last_epoch);
  console.log("Interest rate: ", interest_rate);

  let interest_rate_percentage = interest_rate * 100;

  document.getElementById('interest-rate').innerText = interest_rate_percentage + '%';
  
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