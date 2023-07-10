# Sundae Finance

## Flash loan pool

The flash loan pool smart contract offers 2 main features:

1. Liquidity pool

This liquidity pool collects liquidity via staking rewards. Suppliers stake their XRD at Sundae validator node. Subsequently, the staker deposits its liquid staking units (LSU's) into the smart contract to register themselves as liquidity supplier - of which the supplier receives a NFT in return that represents its 'proof of supply'. 

The validator node distributes the earned rewards to the staking pool on behalf of the suppplier/staker. The staking rewards are monitored by the smart contract and allocated (proportionally) to the staker, by registering the earnings to the provisioned NFT's. The same applies to the interest earned by the liquidity pool.

3. Flash loan

Flash loans are issued from the liquidity pool. A flashloan is comprised of two functions, issuing the flash loan, and returning it. These two functions have to be called in the same transaction to succesfully execute a flashloan. A 'transient' token is utilized to ensure that the agreed loan is returned in accordance to the loan terms.

### Pre-requisites

1. Rust 1.26.0
2. Scrypto v0.10.0

   Install [here](https://docs-babylon.radixdlt.com/main/getting-started-developers/first-component/install-scrypto.html), or update [here](https://docs-babylon.radixdlt.com/main/getting-started-developers/first-component/updating-scrypto.html).
   
3. Node v20.3.1

### Build locally

1. Navigate to the folder where the 'flashloan-pool' package resides.
2. Create a new account using `resim new-account`.
3. Compile Rust package using `resim publish .`.
4. Instantiate the package's component using `resim call-function <package-address> Flashloanpool instantiate_flashloan_pool`.

The component is now deployed to the local simulator. Subsequently we can start calling the component's functions.

5. A good start is to supply liquidity 

### Build on test net
