// // There are four classes exported in the Gateway-SDK These serve as a thin wrapper around the gateway API
// // API docs are available @ https://betanet-gateway.redoc.ly/
// // https://kisharnet-gateway.radixdlt.com/swagger/index.html
// import { TransactionApi, StateApi, StatusApi, StreamApi, Configuration } from "@radixdlt/babylon-gateway-api-sdk";

// // Instantiate Gateway SDK
// const transactionApi = new TransactionApi()
// const stateApi = new StateApi();
// const statusApi = new StatusApi();
// const streamApi = new StreamApi();

// // Global states
// let accountAddress // User account address
// let componentAddress = "component_tdx_c_1q03fknuu5g60rmu95xchgwzn7yaexexq5kclkqeesk3smdcnlk" //GumballMachine component address
// let resourceAddress // resource address
// let xrdAddress = "resource_tdx_c_1qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq40v2wv"
// let admin_badge = "resource_tdx_c_1q83fknuu5g60rmu95xchgwzn7yaexexq5kclkqeesk3s3v2a6d"

// // ************ Instantiate component and fetch component and resource addresses *************
// document.getElementById('instantiateComponent').onclick = async function () {
//     let packageAddress = document.getElementById("packageAddress").value;
//     let accountAddress = document.getElementById("accountAddress").value;

//     let manifest = new ManifestBuilder()
//       .callFunction(packageAddress, "Flashloan", "instantiate_lender")
//       .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
//       .build()
//       .toString();
//     console.log("Instantiate Manifest: ", manifest)
//     // Send manifest to extension for signing
//     const result = await rdt
//       .sendTransaction({
//         transactionManifest: manifest,
//         version: 1,
//       })
  
//     // if (result.isErr()) throw result.error
  
//     // console.log("Intantiate WalletSDK Result: ", result.value)
  
//     // // ************ Fetch the transaction status from the Gateway API ************
//     // let status = await transactionApi.transactionStatus({
//     //   transactionStatusRequest: {
//     //     intent_hash_hex: result.value.transactionIntentHash
//     //   }
//     // });
//     // console.log('Instantiate TransactionApi transaction/status:', status)
  
//     // // ************ Fetch component address from gateway api and set componentAddress variable **************
//     // let commitReceipt = await transactionApi.transactionCommittedDetails({
//     //   transactionCommittedDetailsRequest: {
//     //     intent_hash_hex: result.value.transactionIntentHash
//     //   }
//     // })
//     // console.log('Instantiate Committed Details Receipt', commitReceipt)
  
//     // // ****** Set componentAddress variable with gateway api commitReciept payload ******
//     // componentAddress = commitReceipt.details.referenced_global_entities[0]
//     // document.getElementById('componentAddress').innerText = componentAddress;
//     // // ****** Set resourceAddress variable with gateway api commitReciept payload ******
//     // admin_badge = commitReceipt.details.referenced_global_entities[1]
//     // document.getElementById('gumAddress').innerText = admin_badge;
//   }

// // *********** Supply LSU ***********
// document.getElementById('supplyLSU').onclick = async function () {
//     let manifest = new ManifestBuilder()
//       .callMethod(accountAddress, "withdraw", [Address(xrdAddress), Decimal("10")])
//       .takeFromWorktop(xrdAddress, "xrd_bucket")
//       .callMethod(componentAddress, "staker_deposit_lpu", [Bucket("xrd_bucket")])
//       .callMethod(accountAddress, "deposit_batch", [Expression("ENTIRE_WORKTOP")])
//       .build()
//       .toString();
  
//     console.log('staker_deposit_lpu manifest: ', manifest)
  
//     // Send manifest to extension for signing
//     const result = await rdt
//       .sendTransaction({
//         transactionManifest: manifest,
//         version: 1,
//       })
  
//     if (result.isErr()) throw result.error
  
//     console.log("staker deposit lpu sendTransaction Result: ", result)
  
//     // Fetch the transaction status from the Gateway SDK
//     let status = await transactionApi.transactionStatus({
//       transactionStatusRequest: {
//         intent_hash_hex: result.value.transactionIntentHash
//       }
//     });
//     console.log('staker deposit lpu TransactionAPI transaction/status: ', status)
  
//     // fetch commit reciept from gateway api 
//     let commitReceipt = await transactionApi.transactionCommittedDetails({
//       transactionCommittedDetailsRequest: {
//         intent_hash_hex: result.value.transactionIntentHash
//       }
//     })
//     console.log('staker deposit lpu Committed Details Receipt', commitReceipt)
  
//     // Show the receipt on the DOM
//     document.getElementById('receipt').innerText = JSON.stringify(commitReceipt.details.receipt, null, 2);
//   };

