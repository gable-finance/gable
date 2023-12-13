import { TransactionApi } from "@radixdlt/babylon-gateway-api-sdk";
import { 
  componentAddress, 
  xrdAddress, 
  transientAddress
} from './global-states.mjs';
import { rdt } from './radixToolkit.mjs'
import { getInterestRate, getPoolAmount } from './dashboardGeneric.mjs'

// Instantiate Gateway SDK
const transactionApi = new TransactionApi()

let interest;
let liquidity;

// call functions
document.addEventListener('DOMContentLoaded', async () => {

  interest = parseFloat(await getInterestRate());
  let showInterest = interest * 100;
  liquidity = parseFloat(await getPoolAmount()).toFixed(2);

  const liquidityH1 = document.getElementById("liquidity");
  const interestH1 = document.getElementById("interest-rate");

  liquidityH1.textContent = parseFloat(liquidity).toLocaleString() + ' XRD';
  interestH1.textContent = showInterest + '%';
});

const copyButton = document.getElementById("copy");
const copyText = document.getElementById("copy-text");
const copyImg = document.getElementById("copy-img");
const textToCopy = document.getElementById("borrow-receipt");

copyButton.addEventListener("click", function() {

  navigator.clipboard.writeText(textToCopy.innerText)

  // Provide feedback to the user (optional)
  copyText.innerText = "Text Copied!";
  copyImg.style.display = "none"
});

// *********** Build Flash Loan ***********

function setupMaxXrdClick(maxXrdId, errorContainerId, errorDivId, amountLiquidityId) {
  const amountLiquidity = document.getElementById(amountLiquidityId);
  const maxXrdButton = document.getElementById(maxXrdId);
  const errorContainer = document.getElementById(errorContainerId);
  const errorDiv = document.getElementById(errorDivId);

  maxXrdButton.onclick = async function () {
    try {
      liquidity = parseFloat(await getPoolAmount()).toFixed(5) - 0.00001;

      // Set the value of the input element to the variable value
      amountLiquidity.value = liquidity;

    } catch (error) {
      const errorMessage = "Error fetching pool amount."; // Customize your error message here
      errorDiv.textContent = errorMessage;

      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
    }
  };
}

setupMaxXrdClick("max-xrd-build", "error-d-1", "error-p-1", "buildamount");

document.getElementById("error-b-1").addEventListener("click", function () {
  const errorContainer = document.getElementById("error-d-1");
  errorContainer.style.display = "none";
});

document.getElementById('buildflashloan').onclick = async function () {

  let accountAddress;

  const errorContainer = document.getElementById("error-d-1");
  const errorDiv = document.getElementById("error-p-1");
  
  let xrd_amount = document.getElementById("buildamount").value;

  // Check if amountXRD is empty or not a number
  if (xrd_amount.trim() === '' || isNaN(xrd_amount)) {
    const errorMessage = 'Please enter a valid amount of XRD.';
    errorDiv.textContent = errorMessage;
    errorContainer.style.backgroundColor = '#FFEBB4';
    errorContainer.style.display = 'flex';
    return; // Exit the function early
  }

  xrd_amount = parseFloat(xrd_amount) - 0.1;

  let repayment = (xrd_amount * (1 + interest)).toFixed(5);
  console.log("INTEREST RATE: ", interest);
  console.log("liquidity: ", typeof liquidity);
  console.log("xrd_amount: ", typeof xrd_amount);

  if (xrd_amount <= liquidity) {
    try {
      accountAddress = rdt.walletApi.getWalletData().accounts[0].address;
    } catch(error) {
      const errorMessage = "Please connect your wallet, or refresh the page."; // Customize your error message here
      errorDiv.textContent = errorMessage;
    
      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
      document.getElementById("borrow-receipt-container").style.display = "none";
      return;
    }
  }  else {
      const errorMessage = 
        `Please provide an amount smaller than or equal to the total available liquidity: ${liquidity}`; // Customize your error message here
      errorDiv.textContent = errorMessage;
    
      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
      document.getElementById("borrow-receipt-container").style.display = "none";
      return;
  }

  console.log('account address 3: ', accountAddress);

  const manifest = 
  `  # 1. GET FLASH LOAN

  # Returns: ${xrd_amount} XRD, 1 Transient Token
  CALL_METHOD
    Address("${componentAddress}")
    "get_flashloan"
    Decimal("${xrd_amount}");

  # 2. USE FLASH LOAN

  # Take the XRD from worktop 
  TAKE_ALL_FROM_WORKTOP
    Address("${xrdAddress}")
    Bucket("xrd_bucket1");
  
  # Do something with xrd_bucket1
  
  # 3. REPAY FLASHLOAN

  #   By taking at least: ${xrd_amount} * ${1 + interest} = ${repayment} XRD, and 1 transient token
  TAKE_ALL_FROM_WORKTOP
    Address("${xrdAddress}")
    Bucket("xrd_bucket2");
  TAKE_ALL_FROM_WORKTOP
    Address("${transientAddress}")
    Bucket("transient_bucket");
  CALL_METHOD
    Address("${componentAddress}")
    "repay_flashloan"
    Bucket("xrd_bucket2")
    Bucket("transient_bucket");

  # 4. RETURN PROFIT

  # Return residual XRD to your wallet, a.k.a. your profit
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");`;

  // Show the receipt on the DOM
  const errorMessage = "See transaction recipe below 👇"; // Customize your error message here
  errorDiv.textContent = errorMessage;

  errorContainer.style.backgroundColor = "#E1ECC8";
  errorContainer.style.display = "flex";

  document.getElementById("borrow-receipt-container").style.display = "flex";
  document.getElementById('borrow-receipt').innerText = manifest;
};

//--------------------------------------------------------------------------------------------------------//
  
setupMaxXrdClick("max-xrd-run", "error-d-1", "error-p-1", "xrdamount");

document.getElementById("error-b-2").addEventListener("click", function () {
  const errorContainer = document.getElementById("error-d-2");
  errorContainer.style.display = "none";
});

// *********** Execute Flash Loan ***********
document.getElementById('callFlashloan').onclick = async function () {

  let accountAddress;
  const errorContainer = document.getElementById("error-d-2");
  const errorDiv = document.getElementById("error-p-2");

  let xrd_amount = document.getElementById("xrdamount").value;

  // Check if amountXRD is empty or not a number
  if (xrd_amount.trim() === '' || isNaN(xrd_amount)) {
    const errorMessage = 'Please enter a valid amount of XRD.';
    errorDiv.textContent = errorMessage;
    errorContainer.style.backgroundColor = '#FFEBB4';
    errorContainer.style.display = 'flex';
    return; // Exit the function early
  }

  xrd_amount = parseFloat(xrd_amount);

  interest = xrd_amount * interest; // temp

  if (parseFloat(xrd_amount) <= parseFloat(liquidity)) {
    try {
      accountAddress = rdt.walletApi.getWalletData().accounts[0].address;
    } catch(error) {
      const errorMessage = "Please connect your wallet, or refresh the page."; // Customize your error message here
      errorDiv.textContent = errorMessage;
    
      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
      document.getElementById("borrow-receipt-container").style.display = "none";
      return;
    }
  }  else {
      const errorMessage = 
        `Please provide an amount smaller than or equal to the total available liquidity: ${liquidity}`; // Customize your error message here
      errorDiv.textContent = errorMessage;
    
      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
      document.getElementById("borrow-receipt-container").style.display = "none";
      return;
  }

  console.log('account address 3: ', accountAddress)

  const manifest = 
  `CALL_METHOD
      Address("${componentAddress}")
      "get_flashloan"
      Decimal("${xrd_amount}");
    CALL_METHOD
      Address("${accountAddress}")
      "withdraw"
      Address("${xrdAddress}")
      Decimal("${interest}");
    TAKE_ALL_FROM_WORKTOP
      Address("${xrdAddress}")
      Bucket("xrd_bucket");
    TAKE_ALL_FROM_WORKTOP
      Address("${transientAddress}")
      Bucket("transient_bucket");
    CALL_METHOD
      Address("${componentAddress}")
      "repay_flashloan"
      Bucket("xrd_bucket")
      Bucket("transient_bucket");
    CALL_METHOD
      Address("${accountAddress}")
      "deposit_batch"
      Expression("ENTIRE_WORKTOP");`;

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
    const errorMessage = "Your flash loan transaction was successful! Thank you for borrowing at Gable 🤝"; // Customize your success message here
    errorDiv.textContent = errorMessage;
    errorContainer.style.backgroundColor = "#E1ECC8";
    errorContainer.style.display = "flex";
  }   

  console.log("Deposit Lpu send Transaction Result: ", result)

  // Fetch the transaction status from the Gateway SDK
  let status = await transactionApi.transactionStatus({
    transactionStatusRequest: {
      intent_hash_hex: result.value.transactionIntentHash
    }
  });
  console.log('Deposit Lpu Transaction API transaction/status: ', status)

  // fetch commit reciept from gateway api 
  let commitReceipt = await transactionApi.transactionCommittedDetails({
    transactionCommittedDetailsRequest: {
      intent_hash_hex: result.value.transactionIntentHash
    }
  })
  console.log('Deposit Lpu Committed Details Receipt', commitReceipt)

  // Show the receipt on the DOM
  document.getElementById("borrow-receipt-container").style.display = "block";
  document.getElementById('borrow-receipt').innerText = JSON.stringify(commitReceipt.details.receipt, null, 2);
};