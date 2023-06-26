import { ManifestBuilder, Decimal, Bucket, Expression, Address } from '@radixdlt/radix-dapp-toolkit'
import { TransactionApi } from "@radixdlt/babylon-gateway-api-sdk";
import { accountAddress } from './accountAddress.js'
import { componentAddress, xrdAddress, transient_address} from './global-states.js';
import { rdt } from './radixToolkit.js'

// Instantiate Gateway SDK
const transactionApi = new TransactionApi()
// const stateApi = new StateApi();
// const statusApi = new StatusApi();
// const streamApi = new StreamApi();

// *********** Build Flash Loan ***********
document.getElementById('buildflashloan').onclick = async function () {

  let xrd_amount = document.getElementById("buildamount").value;
  let interest = xrd_amount * 0.05; // temp

  let yourComponentAddress = "component_tdx_someaddress";

  let manifest = new ManifestBuilder()
    .callMethod(componentAddress, "get_flashloan", [Decimal(xrd_amount)])
    .callMethod(accountAddress, "withdraw", [Address(xrdAddress), Decimal(interest)])
    .takeFromWorktop(xrdAddress, "xrd_bucket")
    .callMethod(yourComponentAddress, "your_bucket", ["xrd_bucket", "your_arguments"])
    .takeFromWorktop(xrdAddress, "xrd_bucket2")
    .takeFromWorktop(transient_address, "transient_bucket")
    .callMethod(componentAddress, "repay_flashloan", [Bucket("xrd_bucket2"), Bucket("transient_bucket")])
    .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
    .build()
    .toString();
  console.log('Build flashloan manifest: ', manifest)

  // Show the receipt on the DOM
  document.getElementById("receipt-container").style.display = "block";
  document.getElementById('receipt').innerText = manifest;
};

//--------------------------------------------------------------------------------------------------------//
  
  // *********** Execute Flash Loan ***********
document.getElementById('callflashloan').onclick = async function () {

  let xrd_amount = document.getElementById("xrdamount").value;
  let interest = xrd_amount * 0.1; // temp

  let manifest = new ManifestBuilder()
    .callMethod(componentAddress, "get_flashloan", [Decimal(xrd_amount)])
    .callMethod(accountAddress, "withdraw", [Address(xrdAddress), Decimal(interest)])
    .takeFromWorktop(xrdAddress, "xrd_bucket")
    .takeFromWorktop(transient_address, "transient_bucket")
    .callMethod(componentAddress, "repay_flashloan", [Bucket("xrd_bucket"), Bucket("transient_bucket")])
    .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
    .build()
    .toString();
  console.log('call flashloan manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt
    .sendTransaction({
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