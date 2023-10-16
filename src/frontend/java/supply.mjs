import { TransactionApi } from "@radixdlt/babylon-gateway-api-sdk";
import { 
  componentAddress, 
  xrdAddress, 
  nftAddress,
  validatorAddress,
} from './global-states.mjs';
import { rdt } from './radixToolkit.mjs';
import { showApy } from "./dashboardGeneric.mjs";

// call functions
document.addEventListener('DOMContentLoaded', async () => {
  await showApy();
});

// initialize account address
let accountAddress;

// rdt.walletApi.walletData$.subscribe((walletData) => {
//   console.log("walletData", walletData)

//   accountAddress = walletData.accounts[0].address;
// })

// Instantiate Gateway SDK
const transactionApi = new TransactionApi()

// // ************ Instantiate component and fetch component and resource addresses *************
// document.getElementById('instantiateComponent').onclick = async function () {
//     let packageAddress = document.getElementById("packageAddress").value;
//     let ownerBadge = document.getElementById("ownerBadge").value;
//     let ownerBadgeId = document.getElementById("ownerBadgeId").value;
//     let validatorOwnerBadge = document.getElementById("validatorOwnerBadge").value;  
//     let validatorOwnerBadgeId = document.getElementById("validatorOwnerBadgeId").value;
//     let accountAddress = rdt.walletApi.getWalletData().accounts[0].address

//     console.log('account address 3: ', accountAddress)

//     const manifest = `
//       CALL_METHOD
//         Address("${accountAddress}")
//         "withdraw_non_fungibles"
//         Address("${ownerBadge}")
//         Array<NonFungibleLocalId>(NonFungibleLocalId("${ownerBadgeId}"));
//       CALL_METHOD
//         Address("${accountAddress}")
//         "withdraw_non_fungibles"
//         Address("${validatorOwnerBadge}")
//         Array<NonFungibleLocalId>(NonFungibleLocalId("${validatorOwnerBadgeId}"));
//       TAKE_ALL_FROM_WORKTOP
//         Address("${ownerBadge}")
//         Bucket("owner_bucket");
//       TAKE_ALL_FROM_WORKTOP
//         Address("${validatorOwnerBadge}")
//         Bucket("validator_owner_bucket");
//       CALL_FUNCTION
//         Address("${packageAddress}")
//         "Flashloanpool"
//         "instantiate_flashloan_pool"
//         Bucket("owner_bucket")
//         Bucket("validator_owner_bucket");
//       CALL_METHOD
//         Address("${accountAddress}")
//         "deposit_batch"
//         Expression("ENTIRE_WORKTOP");
//       `;

//     // Send manifest to extension for signing
//     const result = await rdt.walletApi.sendTransaction({
//         transactionManifest: manifest,
//         version: 1,
//       })
  
//     if (result.isErr()) throw result.error
  
//     console.log("Intantiate WalletSDK Result: ", result.value)
  
//     // ************ Fetch the transaction status from the Gateway API ************
//     let status = await transactionApi.transactionStatus({
//       transactionStatusRequest: {
//         intent_hash_hex: result.value.transactionIntentHash
//       }
//     });
//     console.log('Instantiate TransactionApi transaction/status:', status)
  
//     // ************ Fetch component address from gateway api and set componentAddress variable **************
//     let commitReceipt = await transactionApi.transactionCommittedDetails({
//       transactionCommittedDetailsRequest: {
//         intent_hash_hex: result.value.transactionIntentHash
//       }
//     })
//     console.log('Instantiate Committed Details Receipt', commitReceipt)
  
//     // ****** Set componentAddress variable with gateway api commitReciept payload ******
//     let componentAddressNew = commitReceipt.details.referenced_global_entities[0]
//     document.getElementById('componentAddress').innerText = componentAddressNew;
//     // ****** Set resourceAddress variable with gateway api commitReciept payload ******
//     let ownerBadgeNew = commitReceipt.details.referenced_global_entities[1]
//     document.getElementById('ownerAddress').innerText = ownerBadgeNew;
//     // ****** Set resourceAddress variable with gateway api commitReciept payload ******
//     let adminBadgeNew = commitReceipt.details.referenced_global_entities[2]
//     document.getElementById('badgeAddress').innerText = adminBadgeNew;
//     // ****** Set resourceAddress variable with gateway api commitReciept payload ******
//     let transientAddressNew = commitReceipt.details.referenced_global_entities[3]
//     document.getElementById('transientAddress').innerText = transientAddressNew;
//     // ****** Set resourceAddress variable with gateway api commitReciept payload ******
//     let nftAddressNew = commitReceipt.details.referenced_global_entities[4]
//     document.getElementById('nftAddress').innerText = nftAddressNew;
//   }

//--------------------------------------------------------------------------------------------------------//

console.log("TEST SUPPLIER");
// console.log("TEST ACCOUNT", accountAddress);

const errorContainer1 = document.getElementById("error-d-1");
const closeBtn1 = document.getElementById("error-b-1");

closeBtn1.addEventListener("click", function () {
  errorContainer1.style.display = "none";
});


// *********** Stake XRD ***********
document.getElementById('stakeXRD').onclick = async function () {

  let amountXRD = document.getElementById("amountXRD").value;

  let accountAddress;
  const errorContainer = document.getElementById("error-d-1");
  const errorDiv = document.getElementById("error-p-1");

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

const errorContainer2 = document.getElementById("error-d-2");
const closeBtn2 = document.getElementById("error-b-2");

closeBtn2.addEventListener("click", function () {
  errorContainer2.style.display = "none";
});

// *********** Supply LSU's ***********
document.getElementById('supplyLSU').onclick = async function () {

  let amountLSU = document.getElementById("amountLSU").value;

  let accountAddress;
  const errorContainer = document.getElementById("error-d-2");
  const errorDiv = document.getElementById("error-p-2");

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
      Address("${xrdAddress}")
      Decimal("${amountLSU}");
    TAKE_ALL_FROM_WORKTOP
      Address("${xrdAddress}")
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

const errorContainer3 = document.getElementById("error-d-3");
const closeBtn3 = document.getElementById("error-b-3");

closeBtn3.addEventListener("click", function () {
  errorContainer3.style.display = "none";
});

  // *********** Withdraw LSU's ***********
document.getElementById('withdrawLSU').onclick = async function () {


  let nft_id = document.getElementById("nftId").value;

  let accountAddress;
  const errorContainer = document.getElementById("error-d-3");
  const errorDiv = document.getElementById("error-p-3");

  if (nft_id.startsWith("#") && nft_id.endsWith("#")) {
    try {
      accountAddress = rdt.walletApi.getWalletData().accounts[0].address;
    } catch(error) {
      const errorMessage = "Please connect your wallet, or refresh the page."; // Customize your error message here
      errorDiv.textContent = errorMessage;
      errorContainer.style.backgroundColor = "#FFEBB4";
      errorContainer.style.display = "flex";
    }
  } else {
    const errorMessage = "The NFT ID must start and end with '#' symbol."; // Customize your error message here
    errorContainer.style.backgroundColor = "#FFEBB4";
    errorDiv.textContent = errorMessage;
    errorContainer.style.display = "flex";
  }

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
};

//--------------------------------------------------------------------------------------------------------//

//   // *********** Deposit Staking Rewards ***********
//   document.getElementById('rewardsliquidity').onclick = async function () {

//     let xrd_amount = document.getElementById("rewardsamount").value;

//     let accountAddress = rdt.walletApi.getWalletData().accounts[0].address
  
//     const manifest = `
//       CALL_METHOD
//         Address("${accountAddress}")
//         "withdraw"
//         Address("${xrdAddress}")
//         Decimal("${xrd_amount}");
//       TAKE_ALL_FROM_WORKTOP
//         Address("${xrdAddress}")
//         Bucket("xrd_bucket");
//       CALL_METHOD
//         Address("${componentAddress}")
//         "deposit_batch"
//         Bucket("xrd_bucket");
//       `;
  
//     console.log('call flashloan manifest: ', manifest)
  
//     // Send manifest to extension for signing
//     const result = await rdt.walletApi.sendTransaction({
//         transactionManifest: manifest,
//         version: 1,
//       })
//   };

// //--------------------------------------------------------------------------------------------------------//

//   // *********** Deposit Admin Liquidity ***********
//   document.getElementById('adminliquidity').onclick = async function () {

//     let xrd_amount = document.getElementById("depositamount").value;

//     let accountAddress = rdt.walletApi.getWalletData().accounts[0].address

//     const manifest = `
//       CALL_METHOD
//         Address("${accountAddress}")
//         "withdraw"
//         Address("${xrdAddress}")
//         Decimal("${xrd_amount}");
//       CALL_METHOD
//         Address("${accountAddress}")
//         "create_proof_of_non_fungibles"
//         Address("${ownerAddress}")
//         Array<NonFungibleLocalId>(
//           NonFungibleLocalId("#1#"));
//       TAKE_ALL_FROM_WORKTOP
//         Address("${xrdAddress}")
//         Bucket("xrd_bucket");
//       CALL_METHOD
//         Address("${componentAddress}")
//         "owner_deposit_xrd"
//         Bucket("xrd_bucket");
//       `;

//     console.log('call flashloan manifest: ', manifest)
  
//     // Send manifest to extension for signing
//     const result = await rdt.walletApi.sendTransaction({
//         transactionManifest: manifest,
//         version: 1,
//       })
//   };

// //--------------------------------------------------------------------------------------------------------//

//     // *********** Update Interest Rate ***********
//   document.getElementById('interest').onclick = async function () {

//     let interest_rate = document.getElementById("interestrate").value;

//     let accountAddress = rdt.walletApi.getWalletData().accounts[0].address

//     const manifest = `
//       CALL_METHOD
//         Address("${accountAddress}")
//         "create_proof_of_amount"
//         Address("${adminBadge}")
//         Decimal("1");
//       CALL_METHOD
//         Address("${componentAddress}")
//         "update_interest_rate"
//         Decimal("${interest_rate}");
//       `;

  
//     console.log('Update interest manifest: ', manifest)
  
//     // Send manifest to extension for signing
//     const result = await rdt.walletApi.sendTransaction({
//         transactionManifest: manifest,
//         version: 1,
//       })
//   };

// //--------------------------------------------------------------------------------------------------------//

//   // *********** Update Hashmap ***********
//   document.getElementById('hashmap').onclick = async function () {

//     let accountAddress = rdt.walletApi.getWalletData().accounts[0].address

//     const manifest = `
//       CALL_METHOD
//         Address("${accountAddress}")
//         "create_proof_of_amount"
//         Address("${adminBadge}")
//         Decimal("1");
//       CALL_METHOD
//         Address("${componentAddress}")
//         "update_supplier_hashmap";
//       `;

//     console.log('call update_supplier_info manifest: ', manifest)
  
//     // Send manifest to extension for signing
//     const result = await rdt.walletApi.sendTransaction({
//         transactionManifest: manifest,
//         version: 1,
//       })

//     if (result.isErr()) throw result.error

//     console.log("Deposit Lpu sendTransaction Result: ", result)

//     // Fetch the transaction status from the Gateway SDK
//     let status = await transactionApi.transactionStatus({
//       transactionStatusRequest: {
//         intent_hash_hex: result.value.transactionIntentHash
//       }
//     });
//     console.log('Deposit Lpu TransactionAPI transaction/status: ', status)

//     // fetch commit reciept from gateway api 
//     let commitReceipt = await transactionApi.transactionCommittedDetails({
//       transactionCommittedDetailsRequest: {
//         intent_hash_hex: result.value.transactionIntentHash
//       }
//     })
//     console.log('Deposit Lpu Committed Details Receipt', commitReceipt)

//     // Show the receipt on the DOM
//     document.getElementById("hashmap-receipt-container").style.display = "block";
//     document.getElementById('hashmap-receipt').innerText = JSON.stringify(commitReceipt.details.receipt, null, 2);
//   };

// //--------------------------------------------------------------------------------------------------------//

// // *********** Create Owner Badge ***********
// document.getElementById('owner').onclick = async function () {

//   let accountAddress = rdt.walletApi.getWalletData().accounts[0].address
  
//   const manifest = `
//     CREATE_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
//       Enum<OwnerRole::None>()
//       false
//       18u8
//       Decimal("1")
//       Tuple(
//         None,        # Mint Roles
//         None,        # Burn Roles (if None: defaults to DenyAll, DenyAll)
//         None,        # Freeze Roles (if None: defaults to DenyAll, DenyAll)
//         None,        # Recall Roles (if None: defaults to DenyAll, DenyAll)
//         Some(         # Withdraw Roles (if None: defaults to DenyAll, DenyAll)
//           Tuple(
//             Some(Enum<AccessRule::AllowAll>()),  # Withdraw (if None: defaults to Owner)
//             Some(Enum<AccessRule::DenyAll>())    # Withdraw Updater (if None: defaults to Owner)
//           )
//         ),
//         Some(         # Deposit Roles (if None: defaults to DenyAll, DenyAll)
//           Tuple(
//             Some(Enum<AccessRule::AllowAll>()),  # Deposit (if None: defaults to Owner)
//             Some(Enum<AccessRule::DenyAll>())    # Deposit Updater (if None: defaults to Owner)
//           )
//         ),
//       )
//       Tuple(                                                                   # Metadata initialization
//         Map<String, Tuple>(                                                  # Initial metadata values
//             "name" => Tuple(
//                 Some(Enum<Metadata::String>("Sundae Owner Badge")),    # Resource Name
//                 true                                                         # Locked
//             ),
//             "symbol" => Tuple(
//                 Some(Enum<Metadata::String>("SOB")),   
//                 true                                                        
//             ),
//             "description" => Tuple(
//                 Some(Enum<Metadata::String>("Sundae Finance owner badge")),   
//                 true                                                        
//             ),
//         ),
//         Map<String, Enum>(                                                   # Metadata roles
//             "metadata_setter" => None,         # Metadata setter role
//             "metadata_setter_updater" => None,                               # Metadata setter updater role as None defaults to OWNER
//             "metadata_locker" => None,          # Metadata locker role
//             "metadata_locker_updater" => None                                # Metadata locker updater role as None defaults to OWNER
//         )
//       )
//       None;
//     CALL_METHOD
//       Address("${accountAddress}")
//       "deposit_batch"
//       Expression("ENTIRE_WORKTOP");
//   `
//   console.log('call update_supplier_info manifest: ', manifest)

//   // Send manifest to extension for signing
//   const result = await rdt.walletApi.sendTransaction({
//     transactionManifest: manifest,
//     version: 1,
//   })
// };