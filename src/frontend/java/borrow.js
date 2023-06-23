import {
    RadixDappToolkit,
    ManifestBuilder,
    Decimal,
    Bucket,
    Expression,
    Address,
    Proof,
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
        console.log("account data: ", accounts)
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

  
  let accountAddress // User account address
  let componentAddress // component address
  let xrdAddress = "resource_tdx_c_1qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq40v2wv"
  let owner_badge // owner badge
  let admin_badge // admin badge
  let transient_address // transient address
  let nft_address // nft address
    
  // Global states
  componentAddress = "component_tdx_c_1qved97g6ge57lkx95fza63hg2nn8aryjwj3tg596sgxs64u5sz"; // temp
  admin_badge = "resource_tdx_c_1qy2kzkck8c2l6pl7jjrn2r9luf64tlpczyhse835kgsqjgylrd"; // temp
  transient_address = "resource_tdx_c_1qged97g6ge57lkx95fza63hg2nn8aryjwj3tg596sgxs06e38x"; // temp
  nft_address = "resource_tdx_c_1qg2kzkck8c2l6pl7jjrn2r9luf64tlpczyhse835kgsqdxn53j" // temp

  //--------------------------------------------------------------------------------------------------------//

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
      let interest = xrd_amount * 0.05; // temp
    
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