import { StateApi } from '@radixdlt/babylon-gateway-api-sdk';
// import { StateApi} from '../radix-dapp-toolkit/src/index.js'
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
export async function showInterestRate() {

  let state = await getState();

  // let last_epoch = state.fields[7].value;
  let interest_rate = state.fields[14].value;
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

// COUNTER

// https://gist.github.com/gre/1650294

const EasingFunctions = {
  // no easing, no acceleration
  linear: t => t,
  // accelerating from zero velocity
  easeInQuad: t => t*t,
  // decelerating to zero velocity
  easeOutQuad: t => t*(2-t),
  // acceleration until halfway, then deceleration
  easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
  // accelerating from zero velocity 
  easeInCubic: t => t*t*t,
  // decelerating to zero velocity 
  easeOutCubic: t => (--t)*t*t+1,
  // acceleration until halfway, then deceleration 
  easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
  // accelerating from zero velocity 
  easeInQuart: t => t*t*t*t,
  // decelerating to zero velocity 
  easeOutQuart: t => 1-(--t)*t*t*t,
  // acceleration until halfway, then deceleration
  easeInOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
  // accelerating from zero velocity
  easeInQuint: t => t*t*t*t*t,
  // decelerating to zero velocity
  easeOutQuint: t => 1+(--t)*t*t*t*t,
  // acceleration until halfway, then deceleration 
  easeInOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t
}

// The modified animation function, which takes a target value and an Element
function animateCountUp(targetValue, el, easing, startingValue, decimalPoints) {

  // How long you want the animation to take, in ms
  const animationDuration = 4000;
  // Calculate how long each ‘frame’ should last if we want to update the animation 60 times per second
  const frameDuration = 1000 / 60;
  // Use that to calculate how many frames we need to complete the animation
  const totalFrames = Math.round(animationDuration / frameDuration);
  // An ease-out function that slows the count as it progresses
  // const easeOutQuad = EasingFunctions.easeOutQuart;

  let frame = 0;
  // const startingValue = 0;

  console.log('counting frame:', frame);
  el.innerHTML = "0";
  // Start the animation running 60 times per second
  const counter = setInterval(() => {
    frame++;
    // Calculate our progress as a value between 0 and 1
    // Pass that value to our easing function to get our
    // progress on a curve
    const progress = easing(frame / totalFrames);
    // Use the progress value to calculate the current count
    const currentCount = (startingValue + (targetValue - startingValue) * progress).toFixed(decimalPoints);
    const formattedCount = currentCount.toLocaleString('en-US');
    // If the current count has changed, update the element
    if (el.innerHTML !== formattedCount) {
      el.innerHTML = formattedCount;
    }
    // If we’ve reached our last frame, stop the animation
    if (frame === totalFrames) {
      clearInterval(counter);
    }
  }, frameDuration);
};

export async function countPoolAmount() {

  let pool_amount = await getPoolAmount();
  const poolAmountElement = document.getElementById('pool-amount-count');
  const easing = EasingFunctions.easeOutQuart;
  const startingValue = 0;
  const decimalPoints = 0;

  animateCountUp(pool_amount, poolAmountElement, easing, startingValue, decimalPoints)
}


// get values from state
async function countInterestRate() {

  let state = await getState();

  // let last_epoch = state.fields[7].value;
  let interest_rate = state.fields[14].value;
  let interest_rate_percentage = interest_rate * 100;
  const irAmountElement = document.getElementById('interest-rate-count');
  const easing = EasingFunctions.easeOutQuart;
  const startingValue = 100;
  const decimalPoints = 2;

  animateCountUp(interest_rate_percentage, irAmountElement, easing, startingValue, decimalPoints)

}

export async function countApy() {

  const apyTotalElement = document.getElementById('apy-total-count');

  try {

    let apy_data = await fetchApyData();

    let total_earnings_apy = apy_data[0].total_earnings_apy;

    // apyTotalElement.innerText = parseFloat(total_earnings_apy).toFixed(2) + ' %';

    const easing = EasingFunctions.easeOutQuart;
    const startingValue = 0;
    const decimalPoints = 2;
  
    animateCountUp(total_earnings_apy, apyTotalElement, easing, startingValue, decimalPoints)
  
  } catch(error) {

    apyTotalElement.innerText = '-';

  }

}

// call functions
document.addEventListener('DOMContentLoaded', async () => {
    countPoolAmount();
    countInterestRate();
    countApy();
});
