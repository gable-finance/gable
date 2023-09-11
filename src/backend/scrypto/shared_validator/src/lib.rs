use scrypto::prelude::*;

#[blueprint]
mod validator_owner {
    enable_method_auth! {
        // roles {
        // },
        methods {
            get_validator_owner_proof => restrict_to: [OWNER],
            retrieve_validator_owner_badge => restrict_to: [OWNER]
        }
    }

    struct ValidatorOwner {
        validator_owner_vault: NonFungibleVault
    }

    impl ValidatorOwner {
        pub fn instantiate_validator(validator_owner: NonFungibleBucket, validator_shared_owner: ResourceAddress) -> (Global<Flashloanpool>) {

            let (address_reservation, component_address) =
                Runtime::allocate_component_address(Runtime::blueprint_id());


            let validator_component: Global<ValidatorOwner> = Self {
                validator_owner_vault: Vault::with_bucket(validator_owner)
            }

            .instantiate()
            .prepare_to_globalize(OwnerRole::Fixed(rule!(require(validator_shared_owner))))
            .roles(roles! {

            })
            .metadata(metadata! {
                roles {
                    metadata_setter => OWNER;
                    metadata_setter_updater => rule!(deny_all);
                    metadata_locker => OWNER;
                    metadata_locker_updater => rule!(deny_all);
                },
                init {
                    "name" => "Sundae: Validator Shared Owner Component", locked;
                    "description" => 
                        "Official Sundae 'validator shared owner' component that
                        enables the validator owner badge to be utilized the 'flash loan pool' component."
                        , locked;
                    "tags" => [
                        "Sundae",
                        "DeFi",
                        "Lend",
                        "Borrow",
                        "Supply",
                        "Stake",
                        "Flash_loan",
                        "Interest",
                        "Liquidity",
                        "Liquidity_pool"
                    ], locked;
                }
            })
            .enable_component_royalties(component_royalties! {
                roles { 
                    royalty_setter => OWNER; 
                    royalty_setter_updater => OWNER; 
                    royalty_locker => OWNER;
                    royalty_locker_updater => OWNER; 
                    royalty_claimer => OWNER;
                    royalty_claimer_updater => OWNER; 
                },
                init {
                }
            })
            .with_address(address_reservation)
            .globalize();


            return validator_component;
        }

        pub fn get_validator_owner_proof() -> Proof {
            
        }

        pub fn retrieve_validator_owner_badge() -> NonFungibleBucket {

        }


    }
}