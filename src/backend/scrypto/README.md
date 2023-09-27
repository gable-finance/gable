# Sundae Finance

## Flash loan pool

The flash loan pool smart contract offers 2 main features:

1. Liquidity pool

This liquidity pool collects liquidity via staking rewards. Suppliers stake their XRD at Sundae validator node. Subsequently, the staker deposits its liquid staking units (LSU's) into the smart contract to register themselves as liquidity supplier - of which the supplier receives a NFT in return that represents its 'proof of supply'. 

The validator node distributes the earned rewards to the staking pool on behalf of the supplier/staker. The staking rewards are monitored by the smart contract and allocated (proportionally) to the staker, by registering the earnings to the provisioned NFT's. The same applies to the interest earned by the liquidity pool.

3. Flash loan

Flash loans are issued from the liquidity pool. A flashloan consists of two functions, issuing the flash loan, and returning it. These two functions have to be called in the same transaction to successfully execute a flash loan. A 'transient' token is utilized to ensure that the agreed loan is returned in accordance with the loan terms.

### Pre-requisites

1. Rust 1.26.0
2. Scrypto v1.1.0

   Install [here](https://docs-babylon.radixdlt.com/main/getting-started-developers/first-component/install-scrypto.html), or update [here](https://docs-babylon.radixdlt.com/main/getting-started-developers/first-component/updating-scrypto.html).
   
3. Node v20.3.1
4. Local copy of repo

Clone this repository to your local machine using the following command:

<pre>
git clone https://github.com/your-username/gable-liquidity-protocol.git
</pre>

### Build locally

Gable's 'flashloan pool' smart contract is compiled, deployed and tested locally using Radix simulator environemt 'resim' - using the following instructions:

1. Navigate to the folder where the `flashloanpool` package resides.

2. Create a new account using `resim new-account`.
   
   Store new-account address using `export a=[account-address]`

3. Compile Rust package using `resim publish .`.

   Store package address using `export p=[package-address]`

4. Store the owner badge 

   First look up the account using `resim show $a`
   
   Now store the account owner badge using `export o=[owner-badge-address]:[badge-local-id]`

   This will look something like `export o=resource_sim1nfzf2h73frult99zd060vfcml5kncq3mxpthusm9lkglvhsr0guahy:#1#`

5. Provision a new validator node:

   Follow file `validator.rtm`.

   Replace `Address` on line 2, 7 and 26 with the address of the account created in step 2

   Run `resim run validator.rtm`

   Store addresses of validator and created tokens from the `New Entities` section in the transaction receipt:

   - 1st component: `export v=[component-address]`
   - 2nd resource (the bottom one!): `export lsu=[resource-address]`

   A new badge should be deposited into your account wallet. This is the validator owner badge. Look up the badge using `resim show $a`. Now store new validator owner badge address using `export vo=[validator-owner-address]:[badge-local-id]`.

6. Now we have to update the validator node so that it accepts stake.

   Follow file `validator-update.rtm`.

   Replace `Address` on line 2 and 8 with the address of the account stored in variable $a
   Replace `Address` on line 10 with the address of the validator owner badge stored in variable $vo (the address before ':')
   Replace `NonFungibleLocalId` on line 12 with the local id of the validator owner badge stored in variable $vo (the id after ':')
   Replace `Address` on line 17 with the address of the validator node stored in variable $va

   Now run `resim run validator-update.rtm`

4. We can now instantiate the package's component. The instantiate function requires the two buckets as input:

   - Component owner badge
   - Validator owner badge

   Instantiate by using `resim call-function $p Flashloanpool instantiate_flashloan_pool $o $vo $lsu`.

   The component is now deployed to the local simulator. Subsequently we can start calling the component's functions.

   Store addresses of component and created tokens from the `New Entities` section in the transaction receipt:

   - 1st component: `export c=[component-address]`
   - 2nd resource: `export admin=[resource-address]`
   - 3rd resource: `export transient=[resource-address]`
   - 4th resource: `export nft=[resource-address]`

#### Now the infrastructure is deployed and we can start interacting with the smart contract.

*Deposit and witdraw liquidity as Owner*
   
5. A good start is to deposit liquidity as owner of the component using

   `resim call-method $c owner_deposit_xrd resource_sim1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxakj8n3:[amount] -p $o`

*Supply and witdraw liquidity User*

1. Before we can supply liquidity as user, you have to stake at the validator node.

   Follow file `stake.rtm`.

   Replace `Address` on line 2, 7 and 23 with the address of the account stored in variable $a
   Replace `Address` on line 18 with the address of the validator node stored in variable $va

   Now run `resim run stake.rtm`

7. Now deposit LSU tokens as supplier

   This first requires you to stake at the newly created validator node using:

   `resim call-method $c deposit_lsu $lsu:[amount]`

8. Now withdraw LSU tokens as supplier

   This first requires you to stake at the newly created validator node using:

   `resim call-method $c withdraw_lsu $nft:#1#`

*Request and return flash loan*

*Deposit staking rewards from validator node*

### Build on test net
