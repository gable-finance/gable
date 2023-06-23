import { RadixDappToolkit} from '@radixdlt/radix-dapp-toolkit'
import { StateApi } from "@radixdlt/babylon-gateway-api-sdk";

const dAppId = 'account_tdx_c_1pyu3svm9a63wlv6qyjuns98qjsnus0pzan68mjq2hatqejq9fr' //temp
    
const rdt = RadixDappToolkit(
    {
        dAppDefinitionAddress:
        dAppId,
        dAppName: 'Sundae Liquidity Protocol',
    },
    (requestData) => {
        requestData({
        accounts: { quantifier: 'atLeast', quantity: 1 },
        }).map(({ data: { accounts } }) => {
        // set your application state
        console.log("account data: ", accounts)
        // document.getElementById('accountName').innerText = accounts[0].label
        // document.getElementById('accountAddress').innerText = accounts[0].address
        accountAddress = accounts[0].address
        })
    },
    {
        networkId: 12,
        onDisconnect: () => {
        // clear your application state
        },
        onInit: ({ accounts }) => {
        // set your initial application state
        console.log("onInit accounts: ", accounts)
        if (accounts.length > 0) {
            // document.getElementById('accountName').innerText = accounts[0].label
            // document.getElementById('accountAddress').innerText = accounts[0].address
            accountAddress = accounts[0].address
        }
        },
    }
)
console.log("dApp Toolkit: ", rdt)
    
// Instantiate Gateway SDK
const stateApi = new StateApi();

let accountAddress // User account address
let componentAddress // component address
let xrdAddress = "resource_tdx_c_1qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq40v2wv"
let admin_badge // admin badge
let transient_address // transient address
let nft_address // nft address


// Global states
componentAddress = "component_tdx_c_1qved97g6ge57lkx95fza63hg2nn8aryjwj3tg596sgxs64u5sz"; // temp
admin_badge = "resource_tdx_c_1qy2kzkck8c2l6pl7jjrn2r9luf64tlpczyhse835kgsqjgylrd"; // temp
transient_address = "resource_tdx_c_1qged97g6ge57lkx95fza63hg2nn8aryjwj3tg596sgxs06e38x"; // temp
nft_address = "resource_tdx_c_1qg2kzkck8c2l6pl7jjrn2r9luf64tlpczyhse835kgsqdxn53j" // temp


document.addEventListener('DOMContentLoaded', function() {
    // Function to be executed once the page is loaded
    getPoolAmount();
    getValues();
    getUserInfo();
  });


const obj = {
    "addresses": [componentAddress]
};

const stateEntityFungibleResourceVaultsPageRequest = {
    "address": componentAddress,
    "resource_address": xrdAddress
}

let interest_rate;
let last_epoch;
let pool_amount;
let supplied_epoch;
let lsu_amount;
let staking_rewards;
let interest_earnings;

async function getState() {

    let response = await stateApi.stateEntityDetails (
        {stateEntityDetailsRequest:obj}
    );

    if (response.items[0].details === undefined) return;

    let state = response.items[0].details.state.data_json;

    console.log(response);

    return state
};

async function getValues() {
    
    let state = await getState();

    last_epoch = state.fields[7].value;
    interest_rate = state.fields[11].value;

    let interest_rate_percentage = interest_rate * 100;

    document.getElementById('interest-rate').innerText = interest_rate_percentage + '%';

    console.log(state);
    console.log(last_epoch);
    console.log(interest_rate);
}

async function getPoolAmount() {

    let response = await stateApi.entityFungibleResourceVaultPage (
        {stateEntityFungibleResourceVaultsPageRequest:stateEntityFungibleResourceVaultsPageRequest}
    )

    if (response.items[0].amount === undefined) return;

    pool_amount = response.items[0].amount;

    document.getElementById('pool-amount').innerText = pool_amount + ' XRD';

    console.log(response);
    console.log(pool_amount);
}

document.getElementById('get-user-info').onclick = async function getUserInfo() {
    let nft_local_id = document.getElementById("nft-local-id").value;
  
    // Function to check if the key starts and ends with a hashtag
    function isValidKey(key) {
      return key.startsWith('#') && key.endsWith('#');
    }
  
    // Get the reference to the error message element
    const errorMessageElement = document.getElementById('error-message');
  
    // Validate the user input
    if (!isValidKey(nft_local_id)) {
      // Display the error message
      displayErrorMessage('Invalid key format. Key must start and end with a hashtag (#).');
    } else {
      let state = await getState();
  
      // Access the map directly assuming it's at index 6
      let map = state.fields[6];
  
      // Retrieve the values from the map using the key
      const mapEntries = map.entries;
  
      // Find the entry in the map with the matching key
      const foundEntry = mapEntries.find((entry) => entry[0] === nft_local_id);
  
      if (foundEntry) {
        const values = foundEntry[1];

        supplied_epoch = values[0];
        lsu_amount = values[1];
        staking_rewards = values[2];
        interest_earnings = values[3];

        // Convert the strings to numbers
        lsu_amount = parseFloat(lsu_amount);
        staking_rewards = parseFloat(staking_rewards);
        interest_earnings = parseFloat(interest_earnings);

        document.getElementById('lsu-amount').innerText = lsu_amount + ' LSU';
        document.getElementById('xrd-stake').innerText = staking_rewards + ' XRD';
        document.getElementById('stake-rewards').innerText = staking_rewards + ' XRD';
        document.getElementById('interest-earnings').innerText = interest_earnings + ' XRD';

        let total_xrd = staking_rewards + staking_rewards + interest_earnings;
        
        document.getElementById('total-xrd').innerText = total_xrd + ' XRD';


        console.log('Values:', values);

      } else {
        console.log('Entry not found.');
        displayErrorMessage('Entry not found.');
      }
    }
  };
  
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
  
  function hideErrorMessage() {
    // Get the error message element
    const errorMessage = document.getElementById('error-message');
  
    // Hide the error message
    errorMessage.style.display = 'none';
  }
  
