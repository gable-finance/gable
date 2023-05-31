import {
  RadixDappToolkit,
  ManifestBuilder,
  Decimal,
  Bucket,
  Expression,
  Address,
}
from '@radixdlt/radix-dapp-toolkit'

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


//--------------------------------------------------------------------------------------------------------//


// There are four classes exported in the Gateway-SDK These serve as a thin wrapper around the gateway API
// API docs are available @ https://betanet-gateway.redoc.ly/
// https://kisharnet-gateway.radixdlt.com/swagger/index.html
import { TransactionApi, StateApi, StatusApi, StreamApi, Configuration} from "@radixdlt/babylon-gateway-api-sdk";

// Instantiate Gateway SDK
const transactionApi = new TransactionApi()
const stateApi = new StateApi();
const statusApi = new StatusApi();
const streamApi = new StreamApi();

// Global states
// let packageAddress = package_tdx_c_1qpgyp8wvwplaapsvwe78w8slrfs2lgq3z683guxaf2xsckf77g

let accountAddress // User account address

let componentAddress // component address
let xrdAddress = "resource_tdx_c_1qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq40v2wv"
let owner_badge // owner badge
let admin_badge // admin badge
let transient_address // transient address
let nft_address // nft address


//--------------------------------------------------------------------------------------------------------//


// ************ Instantiate component and fetch component and resource addresses *************
document.getElementById('instantiateComponent').onclick = async function () {
    let packageAddress = document.getElementById("packageAddress").value;
    // let accountAddress = document.getElementById("accountAddress").value;

    let manifest = new ManifestBuilder()
      .callFunction(packageAddress, "Flashloan", "instantiate_lender", [""])
      .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
      .build()
      .toString();
    console.log("Instantiate Manifest: ", manifest)
    // Send manifest to extension for signing
    const result = await rdt
      .sendTransaction({
        transactionManifest: manifest,
        version: 1,
      })
  
    if (result.isErr()) throw result.error
  
    console.log("Intantiate WalletSDK Result: ", result.value)
  
    // ************ Fetch the transaction status from the Gateway API ************
    let status = await transactionApi.transactionStatus({
      transactionStatusRequest: {
        intent_hash_hex: result.value.transactionIntentHash
      }
    });
    console.log('Instantiate TransactionApi transaction/status:', status)
  
    // ************ Fetch component address from gateway api and set componentAddress variable **************
    let commitReceipt = await transactionApi.transactionCommittedDetails({
      transactionCommittedDetailsRequest: {
        intent_hash_hex: result.value.transactionIntentHash
      }
    })
    console.log('Instantiate Committed Details Receipt', commitReceipt)
  
    // ****** Set componentAddress variable with gateway api commitReciept payload ******
    componentAddress = commitReceipt.details.referenced_global_entities[0]
    document.getElementById('componentAddress').innerText = componentAddress;
    // ****** Set resourceAddress variable with gateway api commitReciept payload ******
    owner_badge = commitReceipt.details.referenced_global_entities[1]
    document.getElementById('ownerAddress').innerText = owner_badge;
    // ****** Set resourceAddress variable with gateway api commitReciept payload ******
    admin_badge = commitReceipt.details.referenced_global_entities[2]
    document.getElementById('badgeAddress').innerText = admin_badge;
    // ****** Set resourceAddress variable with gateway api commitReciept payload ******
    transient_address = commitReceipt.details.referenced_global_entities[3]
    document.getElementById('transientAddress').innerText = transient_address;
    // ****** Set resourceAddress variable with gateway api commitReciept payload ******
    nft_address = commitReceipt.details.referenced_global_entities[4]
    document.getElementById('nftAddress').innerText = nft_address;
  }


//--------------------------------------------------------------------------------------------------------//


// let accountAddress = "account_tdx_c_1pxcdsukgy97p62n4tqktee4z8ngpydhhfnxxzmxfrmzs0yj2mn"; // temp
componentAddress = "component_tdx_c_1qvts2j5w3ngn7xcpz59jydep2thap7lv26tu8z6nj9ssmqavy5"; // temp
nft_address = "resource_tdx_c_1qte20kfpy0m2xuwlefh8p9u805a9reyxyv0jthvrsrhqujh03q" // temp

  // *********** Supply LSU's ***********
document.getElementById('supplyLSU').onclick = async function () {

  let amountLSU = document.getElementById("amountLSU").value;

  let manifest = new ManifestBuilder()
    .callMethod(accountAddress, "withdraw", [Address(xrdAddress), Decimal(amountLSU)])
    .takeFromWorktop(xrdAddress, "xrd_bucket")
    .callMethod(componentAddress, "staker_deposit_lpu", [Bucket("xrd_bucket")])
    .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
    .build()
    .toString();

  console.log('staker_deposit_lpu manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })

  if (result.isErr()) throw result.error

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
  document.getElementById("receipt-container").style.display = "block";
  document.getElementById('receipt').innerText = JSON.stringify(commitReceipt.details.receipt, null, 2);
};


//--------------------------------------------------------------------------------------------------------//

  // *********** Supply LSU's ***********
document.getElementById('withdrawLSU').onclick = async function () {

  let nft_id = document.getElementById("nftId").value;

  let manifest = new ManifestBuilder()
    // .callMethod(accountAddress, "withdraw_non_fungibles", [Address(nft_address)], "#1#")
    .withdrawNonFungiblesFromAccount(accountAddress, nft_address, [nft_id])
    .takeFromWorktopByIds([nft_id], nft_address, "bucket1")
    .callMethod(componentAddress, "staker_withdraw_lpu", [Bucket("bucket1")])
    .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
    .build()
    .toString();

  console.log('staker_withdraw_lsu manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })

  if (result.isErr()) throw result.error

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
  document.getElementById('receipt').innerText = JSON.stringify(commitReceipt.details.receipt, null, 2);
};