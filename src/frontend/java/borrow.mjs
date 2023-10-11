import { TransactionApi } from "@radixdlt/babylon-gateway-api-sdk";
// import { TransactionApi} from '../radix-dapp-toolkit/src/index.js'
import { 
  componentAddress, 
  xrdAddress, 
  transientAddress
} from './global-states.mjs';
import { rdt } from './radixToolkit.mjs'

// Instantiate Gateway SDK
const transactionApi = new TransactionApi()
// const stateApi = new StateApi();
// const statusApi = new StatusApi();
// const streamApi = new StreamApi();

// *********** Build Flash Loan ***********
document.getElementById('buildflashloan').onclick = async function () {

  let xrd_amount = document.getElementById("buildamount").value;
  let interest = 0.05;
  let repayment = xrd_amount * (1 + interest);

  // let manifest = new ManifestBuilder()
  //   .callMethod(componentAddress, "get_flashloan", [Decimal(xrd_amount)])
  //   .callMethod(accountAddress, "withdraw", [Address(xrdAddress), Decimal(interest)])
  //   .takeFromWorktop(xrdAddress, "xrd_bucket")
  //   .callMethod(yourComponentAddress, "your_bucket", ["xrd_bucket", "your_arguments"])
  //   .takeFromWorktop(xrdAddress, "xrd_bucket2")
  //   .takeFromWorktop(transient_address, "transient_bucket")
  //   .callMethod(componentAddress, "repay_flashloan", [Bucket("xrd_bucket2"), Bucket("transient_bucket")])
  //   .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
  //   .build()
  //   .toString();
  // console.log('Build flashloan manifest: ', manifest)

  let accountAddress = rdt.walletApi.getWalletData().accounts[0].address;

  console.log('account address 3: ', accountAddress);

  const manifest = 
  `
  # 1. GET FLASH LOAN
  #   Which returns:
  #     - ${xrd_amount} XRD
  #     - transient token
  CALL_METHOD
    Address("${componentAddress}")
    "get_flashloan"
    Decimal("${xrd_amount}");

  # 2. USE FLASH LOAN
  #   Take the XRD from worktop and execute personal strategy with it
  TAKE_ALL_FROM_WORKTOP
    Address("${xrdAddress}")
    Bucket("xrd_bucket");
  
  # ...
  
  # 3. REPAY FLASHLOAN
  #   By taking:
  #     1. ${xrd_amount} * ${1 + interest} = ${repayment} XRD
  #     2. transient token
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
  #   Returns residual XRD to your wallet, a.k.a. your profit
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");`;

  // Show the receipt on the DOM
  document.getElementById("receipt-container").style.display = "block";
  document.getElementById('receipt').innerText = manifest;
};

//--------------------------------------------------------------------------------------------------------//
  
  // *********** Execute Flash Loan ***********
document.getElementById('callflashloan').onclick = async function () {

  let xrd_amount = document.getElementById("xrdamount").value;
  let interest = xrd_amount * 0.1; // temp

  // let manifest = new ManifestBuilder()
  //   .callMethod(componentAddress, "get_flashloan", [Decimal(xrd_amount)])
  //   .callMethod(accountAddress, "withdraw", [Address(xrdAddress), Decimal(interest)])
  //   .takeFromWorktop(xrdAddress, "xrd_bucket")
  //   .takeFromWorktop(transient_address, "transient_bucket")
  //   .callMethod(componentAddress, "repay_flashloan", [Bucket("xrd_bucket"), Bucket("transient_bucket")])
  //   .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
  //   .build()
  //   .toString();
  // console.log('call flashloan manifest: ', manifest)

  let accountAddress = rdt.walletApi.getWalletData().accounts[0].address

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

  if (result.isErr()) throw result.error

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