/*
This script mimices (part of) a validator component on the Radix engine simulator
    that is of interest to Sundae's flashloan pool component.

The flashloan pool component will interact with the validator node to release and collect staking fee's,
    by triggering the following methods:

    - start_unlock_owner_stake_units
    - finish_unlock_owner_stake_units
    - unstake
    - claim_xrd

The original validator component can be found here:
https://github.com/radixdlt/radixdlt-scrypto/blob/f9a4ef37ff8e90b30a71a244b7f25b810aa22bf1/radix-engine/src/blueprints/consensus_manager/validator.rs
*/

use scrypto::prelude::*;

#[derive(Debug, NonFungibleData, ScryptoSbor)]
struct Amount {
    amount: Decimal,
}

#[derive(Debug, NonFungibleData, ScryptoSbor)]
pub struct UnstakeData {
    pub name: String,

    /// An epoch number at (or after) which the pending unstaked XRD may be claimed.
    /// Note: on unstake, it is fixed to be [`ConsensusManagerConfigSubstate.num_unstake_epochs`] away.
    pub claim_epoch: Epoch,

    /// An XRD amount to be claimed.
    pub claim_amount: Decimal,
}

#[blueprint]
mod validator {

    struct ValidatorBlueprint {
        unstake_unit_vault: Vault,
        stake_unit_vault: Vault,
        xrd_vault: Vault,
        unstake_nft_resman: ResourceManager,
    }

    impl ValidatorBlueprint {
        pub fn instantiate_validator(stake_unit_bucket: Bucket, xrd_bucket: Bucket) -> Global<ValidatorBlueprint> {

            let (address_reservation, component_address) =
                    Runtime::allocate_component_address(Runtime::blueprint_id());

            // Provision non-fungible resource
            // serves as proof of supply
            let unstake_nft_resman: ResourceManager =
                ResourceBuilder::new_ruid_non_fungible::<UnstakeData>(OwnerRole::None)
                .metadata(metadata! {
                    init {
                        "name" => "unstake nft", locked;
                    }
                })
                .create_with_no_initial_supply();

            let validator_component: Global<ValidatorBlueprint> = Self {
                unstake_unit_vault: Vault::new(stake_unit_bucket.resource_address()),
                stake_unit_vault: Vault::with_bucket(stake_unit_bucket),
                xrd_vault: Vault::with_bucket(xrd_bucket),
                unstake_nft_resman: unstake_nft_resman,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::None)
            .with_address(address_reservation)
            .globalize();

            validator_component

        }

        pub fn start_unlock_owner_stake_units(&mut self, requested_stake_unit_amount: Decimal) {
            let stake_unit_bucket: Bucket = self.stake_unit_vault.take(requested_stake_unit_amount);
            self.unstake_unit_vault.put(stake_unit_bucket);
        }

        pub fn finish_unlock_owner_stake_units(&mut self) -> Bucket {
            let already_available_stake_unit_bucket = self.unstake_unit_vault.take_all();

            already_available_stake_unit_bucket
        }

        pub fn unstake(&mut self, stake_unit_bucket: Bucket) -> Bucket {

            let amount: Decimal = stake_unit_bucket.amount();
            let stake_unit_resman = ResourceManager::from(self.stake_unit_vault.resource_address());
            stake_unit_resman.burn(stake_unit_bucket);

            // ...

            let claim_epoch: Epoch = Runtime::current_epoch();

            let data = 
                UnstakeData {
                    name: "Stake Claim".into(),
                    claim_epoch,
                    claim_amount: amount,
                };

            let unstake_bucket: Bucket = 
                self.unstake_nft_resman.mint_ruid_non_fungible(
                    data
                );

            unstake_bucket
        }

        pub fn claim_xrd(&mut self, unstake_bucket: Bucket) -> Bucket {

            let unstake_data: Amount = unstake_bucket
                .as_non_fungible()
                .non_fungible()
                .data();
            
            let amount: Decimal = unstake_data.amount;

            let xrd_bucket: Bucket = self.xrd_vault.take(amount);

            xrd_bucket
        }
    }
}