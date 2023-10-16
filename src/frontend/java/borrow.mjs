import { TransactionApi } from "@radixdlt/babylon-gateway-api-sdk";
// import { TransactionApi} from '../radix-dapp-toolkit/src/index.js'
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
  liquidity = parseFloat(await getPoolAmount());

  const liquidityH1 = document.getElementById("liquidity");
  const interestH1 = document.getElementById("interest-rate");

  liquidityH1.textContent = liquidity + ' XRD';
  interestH1.textContent = interest + '%';
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

const errorContainer1 = document.getElementById("error-d-1");
const closeBtn1 = document.getElementById("error-b-1");

closeBtn1.addEventListener("click", function () {
  errorContainer1.style.display = "none";
});

document.getElementById('buildflashloan').onclick = async function () {

  let xrd_amount = parseFloat(document.getElementById("buildamount").value);
  let repayment = xrd_amount * (1 + interest);
  console.log("INTEREST RATE: ", interest);
  console.log("liquidity: ", typeof liquidity);
  console.log("xrd_amount: ", typeof xrd_amount);

  let accountAddress;
  const errorContainer = document.getElementById("error-d-1");
  const errorDiv = document.getElementById("error-p-1");

  if (xrd_amount < liquidity) {
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
        `Please provide an amount smaller than the total available liquidity: ${liquidity}`; // Customize your error message here
      errorDiv.textContent = errorMessage;
    
      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
      document.getElementById("borrow-receipt-container").style.display = "none";
      return;
  }

  console.log('account address 3: ', accountAddress);

  const manifest = 
  `  # 1. GET FLASH LOAN
  #   Which returns: ${xrd_amount} XRD, 1 Transient Token

  CALL_METHOD
    Address("${componentAddress}")
    "get_flashloan"
    Decimal("${xrd_amount}");

  # 2. USE FLASH LOAN
  #   Take the XRD from worktop 

  TAKE_ALL_FROM_WORKTOP
    Address("${xrdAddress}")
    Bucket("xrd_bucket");
  
  # *Execute Personal Strategy*
  
  # 3. REPAY FLASHLOAN
  #   By taking: ${xrd_amount} * ${1 + interest} = ${repayment} XRD, and 1 transient token

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

  # 4. RETURN PROFIT
  #   Return residual XRD to your wallet, a.k.a. your profit

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
  
const errorContainer2 = document.getElementById("error-d-2");
const closeBtn2 = document.getElementById("error-b-2");

closeBtn2.addEventListener("click", function () {
  errorContainer2.style.display = "none";
});

// *********** Execute Flash Loan ***********
document.getElementById('callFlashloan').onclick = async function () {

  let xrd_amount = parseFloat(document.getElementById("xrdamount").value);
  interest = xrd_amount * interest; // temp

  let accountAddress;
  const errorContainer = document.getElementById("error-d-2");
  const errorDiv = document.getElementById("error-p-2");

  if (parseFloat(xrd_amount) < parseFloat(liquidity)) {
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
        `Please provide an amount smaller than the total available liquidity: ${liquidity}`; // Customize your error message here
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

  // // Fetch the transaction status from the Gateway SDK
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