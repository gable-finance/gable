import { TransactionApi, StateApi } from "@radixdlt/babylon-gateway-api-sdk";
import { 
  componentAddress, 
  xrdAddress, 
  nftAddress,
  validatorAddress,
  lsuAddress,
} from './global-states.mjs';
import { rdt } from './radixToolkit.mjs';
import { showApy, getfungible } from "./dashboardGeneric.mjs";

// Instantiate Gateway SDK
const transactionApi = new TransactionApi();
const stateApi = new StateApi();

// call functions
document.addEventListener('DOMContentLoaded', async () => {
  await showApy();
});

// initialize account address
let accountAddress;


document.getElementById('max-xrd').onclick = async function () {

  let accountAddress;

  const errorContainer = document.getElementById("error-d-1");
  const errorDiv = document.getElementById("error-p-1");

  try {
    accountAddress = rdt.walletApi.getWalletData().accounts[0].address;

    try {
      let maxXrd = await getfungible(accountAddress, xrdAddress);

      // Get the input element by its ID
      const amountXRDInput = document.getElementById("amountXRD");
  
      // Set the value of the input element to the variable value
      amountXRDInput.value = Math.floor(parseFloat(maxXrd)*100000)/100000 - 5;

    } catch(error) {
      const errorMessage = "XRD not found in connected wallet."; // Customize your error message here
      errorDiv.textContent = errorMessage;
    
      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
    }

  } catch(error) {
    const errorMessage = "Please connect your wallet, or refresh the page."; // Customize your error message here
    errorDiv.textContent = errorMessage;
  
    errorContainer.style.backgroundColor = "#FFEBB4";
    errorContainer.style.display = "flex";
  }
}

document.getElementById("error-b-1").addEventListener("click", function () {
  const errorContainer = document.getElementById("error-d-1");
  errorContainer.style.display = "none";
});


// *********** Stake XRD ***********
document.getElementById('stakeXRD').onclick = async function () {

  let amountXRD = document.getElementById("amountXRD").value;

  let accountAddress;
  const errorContainer = document.getElementById("error-d-1");
  const errorDiv = document.getElementById("error-p-1");

  // Check if amountXRD is empty or not a number
  if (amountXRD.trim() === '' || isNaN(amountXRD)) {
    const errorMessage = 'Please enter a valid amount of XRD.';
    errorDiv.textContent = errorMessage;
    errorContainer.style.backgroundColor = '#FFEBB4';
    errorContainer.style.display = 'flex';
    return; // Exit the function early
  }

  try {
    accountAddress = rdt.walletApi.getWalletData().accounts[0].address;
  } catch(error) {
    const errorMessage = "Please connect your wallet, or refresh the page."; // Customize your error message here
    errorDiv.textContent = errorMessage;
  
    errorContainer.style.backgroundColor = "#FFEBB4";
    errorContainer.style.display = "flex";
  }

  const manifest = `
    CALL_METHOD
        Address("${accountAddress}")
        "withdraw"
        Address("${xrdAddress}")
        Decimal("${amountXRD}");
    TAKE_ALL_FROM_WORKTOP
        Address("${xrdAddress}")
        Bucket("stake_xrd");
    CALL_METHOD
        Address("${validatorAddress}")
        "stake"
        Bucket("stake_xrd");
    CALL_METHOD
        Address("${accountAddress}")
        "deposit_batch"
        Expression("ENTIRE_WORKTOP");
    `;

  console.log('stake manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi.sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })

  if (result.isErr()) {
    const errorMessage = "Your transaction failed. Please try again."; // Customize your error message here
    errorDiv.textContent = errorMessage;

    errorContainer.style.backgroundColor = "#FFBFA9";
    errorContainer.style.display = "flex"; 
  } else {
    const errorMessage = "Your transaction was successful! Thank you for staking at Gable validator node! Please proceed to step 2 👇"; // Customize your success message here
    errorDiv.textContent = errorMessage;
    errorContainer.style.backgroundColor = "#E1ECC8";
    errorContainer.style.display = "flex";
  }   

  console.log("Stake sendTransaction Result: ", result)

  // Fetch the transaction status from the Gateway SDK
  let status = await transactionApi.transactionStatus({
    transactionStatusRequest: {
      intent_hash_hex: result.value.transactionIntentHash
    }
  });

  console.log('Stake TransactionAPI transaction/status: ', status)

  // fetch commit reciept from gateway api 
  let commitReceipt = await transactionApi.transactionCommittedDetails({
    transactionCommittedDetailsRequest: {
      intent_hash_hex: result.value.transactionIntentHash
    }
  })
  console.log('Stake Committed Details Receipt', commitReceipt)

  // Show the receipt on the DOM
  document.getElementById('stake-receipt-container').style.display = 'block';
  document.getElementById('stake-receipt').innerText = JSON.stringify(commitReceipt.details.receipt, null, 2);
};

//--------------------------------------------------------------------------------------------------------//

document.getElementById('max-lsu').onclick = async function () {

  let accountAddress;

  const errorContainer = document.getElementById("error-d-2");
  const errorDiv = document.getElementById("error-p-2");

  try {
    accountAddress = rdt.walletApi.getWalletData().accounts[0].address;

    try {
      let maxLsu = await getfungible(accountAddress, lsuAddress);

      // Get the input element by its ID
      const amountLSUInput = document.getElementById("amountLSU");
  
      // Set the value of the input element to the variable value
      // amountLSUInput.value = parseFloat(maxLsu).toFixed(5) - 0.00001;
      amountLSUInput.value = Math.floor(parseFloat(maxLsu)*100000)/100000;


    } catch(error) {
      const errorMessage = "Gable validator node LSUs not found in connected wallet."; // Customize your error message here
      errorDiv.textContent = errorMessage;
    
      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
    }

  } catch(error) {

    console.log("error", error);
    const errorMessage = "Gable validator node LSU not found in wallet"; // Customize your error message here
    errorDiv.textContent = errorMessage;
  
    errorContainer.style.backgroundColor = "#FFEBB4";
    errorContainer.style.display = "flex";
  }
}

document.getElementById("error-b-2").addEventListener("click", function () {
  const errorContainer = document.getElementById("error-d-2");
  errorContainer.style.display = "none";
});

// *********** Supply LSU's ***********
document.getElementById('supplyLSU').onclick = async function () {

  const errorContainer = document.getElementById("error-d-2");
  const errorDiv = document.getElementById("error-p-2");

  let amountLSU = document.getElementById("amountLSU").value;

  // Check if amountXRD is empty or not a number
  if (amountLSU.trim() === '' || isNaN(amountLSU)) {
    const errorMessage = 'Please enter a valid amount of LSU.';
    errorDiv.textContent = errorMessage;
    errorContainer.style.backgroundColor = '#FFEBB4';
    errorContainer.style.display = 'flex';
    return; // Exit the function early
  }

  try {
    accountAddress = rdt.walletApi.getWalletData().accounts[0].address;
  } catch(error) {
    const errorMessage = "Please connect your wallet, or refresh the page."; // Customize your error message here
    errorDiv.textContent = errorMessage;
    errorContainer.style.backgroundColor = "#FFEBB4"; 
    errorContainer.style.display = "flex";
  }

  console.log('account address 3: ', accountAddress)

  const manifest = `
    CALL_METHOD
      Address("${accountAddress}")
      "withdraw"
      Address("${lsuAddress}")
      Decimal("${amountLSU}");
    TAKE_ALL_FROM_WORKTOP
      Address("${lsuAddress}")
      Bucket("lsu_bucket");
    CALL_METHOD
      Address("${componentAddress}")
      "deposit_lsu"
      Bucket("lsu_bucket");
    CALL_METHOD
      Address("${accountAddress}")
      "deposit_batch"
      Expression("ENTIRE_WORKTOP");
    `;

  console.log('staker_deposit_lpu manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi.sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })

  if (result.isErr()) {
    const errorMessage = "Your transaction failed. Please try again."; // Customize your error message here
    errorDiv.textContent = errorMessage;

    errorContainer.style.backgroundColor = "#FFBFA9";
    errorContainer.style.display = "flex"; 
  } else {
    const errorMessage = "Your transaction was successful! You are now supplying liquidity at Gable! 😎"; // Customize your success message here
    errorDiv.textContent = errorMessage;

    errorContainer.style.backgroundColor = "#E1ECC8";
    errorContainer.style.display = "flex";
  }  

  console.log("Deposit Lpu sendTransaction Result: ", result)

  // Fetch the transaction status from the Gateway SDK
  let status = await transactionApi.transactionStatus({
    transactionStatusRequest: {
      intent_hash_hex: result.value.transactionIntentHash
    }
  });
  console.log('Deposit Lpu TransactionAPI transaction/status: ', status)

  // fetch commit reciept from gateway api 
  let commitReceipt = await transactionApi.transactionCommittedDetails({
    transactionCommittedDetailsRequest: {
      intent_hash_hex: result.value.transactionIntentHash
    }
  })
  console.log('Deposit Lpu Committed Details Receipt', commitReceipt)

  // Show the receipt on the DOM
  document.getElementById('supply-receipt-container').style.display = 'block';
  document.getElementById('supply-receipt').innerText = JSON.stringify(commitReceipt.details.receipt, null, 2);
};

//--------------------------------------------------------------------------------------------------------//

// get entity non fungible state > get entity non fungible ids
export async function getNftIds(accountAddress) {

  const stateEntityNonFungiblesPageRequest = {
    address: accountAddress,
    aggregation_level: 'Vault',
  };

  let response = await stateApi.entityNonFungiblesPage({
    stateEntityNonFungiblesPageRequest,
  });

  console.log("response", response);

  // Find the item with the matching resource address
  const item = response.items.find((item) => item.resource_address === nftAddress);

  let vault_address;

  if (item) {
    // Extract the vault value
    const vault = item.vaults.items[0];
    vault_address = vault.vault_address;
  } else {
    console.log('Resource address not found in the response.');
  }

  const stateEntityNonFungibleIdsPageRequest = {
    address: accountAddress,
    resource_address: nftAddress,
    vault_address: vault_address,
  };

  let response2 = await stateApi.entityNonFungibleIdsPage({
    stateEntityNonFungibleIdsPageRequest,
  });

  // Extract the non_fungible_id values into an array
  let nonFungibleIds = response2.items.map((item) => item);

  if (nonFungibleIds.length === 0) {
    // If the array is empty, throw an error
    throw new Error("No non-fungible IDs found.");
  }

  return nonFungibleIds

}


// Get a reference to the input element
const nftIdInput = document.getElementById('nftId');

// Get a reference to the button that triggers the dropdown
const nftButton = document.getElementById('nfts');

// Get a reference to the dropdown element
const dropdownElement = document.getElementById('nft-dropdown');

document.getElementById('nfts').onclick = async function () {

  if (dropdownElement.style.display === "none") {

    console.log("test display")

    let accountAddress;

    const errorContainer3 = document.getElementById("error-d-3");
    const errorDiv3 = document.getElementById("error-p-3");

    try {

      accountAddress = rdt.walletApi.getWalletData().accounts[0].address;
    
      try {
        let nfts = await getNftIds(accountAddress);

        console.log("test nfts", nfts);

        // Clear the existing content in the div
        dropdownElement.innerHTML = "";
  
        // Loop through the entries and create new 'a' elements for each entry
        nfts.forEach(entry => {
          const link = document.createElement('a');
          link.textContent = entry; // Set the link's text content
  
          // Add a click event listener to each 'a' element
          link.addEventListener('click', () => {
            // Set the value of the input element to the clicked 'a' element's text content
            nftIdInput.value = entry;
          });
  
          // Append the 'a' element to the nft-dropdown div
          dropdownElement.appendChild(link);
        });
  
        showDropdown();

      } catch(error) {

        console.log("error", error);
        const errorMessage = "This account is not a supplier at Gable. Please connect correct account, or supply at Gable"; // Customize your error message here
        errorDiv3.textContent = errorMessage;
      
        errorContainer3.style.backgroundColor = "#FFEBB4";
        errorContainer3.style.display = "flex";
      }

    } catch(error) {
      const errorMessage = "Please connect your wallet, or refresh the page."; // Customize your error message here
      errorDiv3.textContent = errorMessage;
      errorContainer3.style.backgroundColor = "#FFEBB4";
      errorContainer3.style.display = "flex";
    }

  } else {

    console.log("test none")
    hideDropdown();
  }
}

// Function to show the dropdown
function showDropdown() {
  dropdownElement.style.display = "block";
}

// Function to hide the dropdown
function hideDropdown() {
  dropdownElement.style.display = "none";
}

document.getElementById("error-b-3").addEventListener("click", function () {
  const errorContainer = document.getElementById("error-d-3");
  errorContainer.style.display = "none";
});

  // *********** Withdraw LSU's ***********
document.getElementById('withdrawLSU').onclick = async function () {

  let nft_id = document.getElementById("nftId").value;

  let accountAddress;

  const errorContainer = document.getElementById("error-d-3");
  const errorDiv = document.getElementById("error-p-3");

  try {
    accountAddress = rdt.walletApi.getWalletData().accounts[0].address;
  } catch(error) {
    const errorMessage = "Please connect your wallet, or refresh the page."; // Customize your error message here
    errorDiv.textContent = errorMessage;
    errorContainer.style.backgroundColor = "#FFEBB4";
    errorContainer.style.display = "flex";
  }

  if (nft_id.startsWith("#") && nft_id.endsWith("#")) {

    const manifest = `
    CALL_METHOD
      Address("${accountAddress}")
      "withdraw_non_fungibles"
      Address("${nftAddress}")
      Array<NonFungibleLocalId>(NonFungibleLocalId("${nft_id}"));
    TAKE_ALL_FROM_WORKTOP
      Address("${nftAddress}")
      Bucket("nft_bucket");
    CALL_METHOD
      Address("${componentAddress}")
      "withdraw_lsu"
      Bucket("nft_bucket");
    CALL_METHOD
      Address("${accountAddress}")
      "deposit_batch"
      Expression("ENTIRE_WORKTOP");
    `;

    console.log('staker_withdraw_lsu manifest: ', manifest)

    // Send manifest to extension for signing
    const result = await rdt.walletApi.sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })

    if (result.isErr()) {
      const errorMessage = "Your transaction failed. Please try again."; // Customize your error message here
      errorDiv.textContent = errorMessage;
      errorContainer.style.backgroundColor = "#FFBFA9";
      errorContainer.style.display = "flex"; 
    } else {
      const errorMessage = "Your transaction was successful! The resources that you are entitled to are returned to your wallet. It was a pleasure earning together! 🫡"; // Customize your success message here
      errorDiv.textContent = errorMessage;
      errorContainer.style.backgroundColor = "#E1ECC8";
      errorContainer.style.display = "flex";
    }  

    console.log("Withdraw Lsu sendTransaction Result: ", result)

    // Fetch the transaction status from the Gateway SDK
    let status = await transactionApi.transactionStatus({
      transactionStatusRequest: {
        intent_hash_hex: result.value.transactionIntentHash
      }
    });
    console.log('Withdraw Lsu TransactionAPI transaction/status: ', status)

    // fetch commit reciept from gateway api 
    let commitReceipt = await transactionApi.transactionCommittedDetails({
      transactionCommittedDetailsRequest: {
        intent_hash_hex: result.value.transactionIntentHash
      }
    })
    console.log('Withdraw Lsu Committed Details Receipt', commitReceipt)

    // Show the receipt on the DOM
    document.getElementById('withdraw-receipt-container').style.display = 'block';
    document.getElementById('withdraw-receipt').innerText = JSON.stringify(commitReceipt.details.receipt, null, 2);

  } else {
    const errorMessage = "The NFT ID must start and end with '#' symbol."; // Customize your error message here
    errorContainer.style.backgroundColor = "#FFEBB4";
    errorDiv.textContent = errorMessage;
    errorContainer.style.display = "flex";
  }
};