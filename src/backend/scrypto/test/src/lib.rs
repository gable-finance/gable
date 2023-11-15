use scrypto::prelude::*;

#[derive(Debug, NonFungibleData, ScryptoSbor)]
pub struct TestData {
    pub amount: Decimal
}

#[blueprint]
#[types(Test)]
mod test {
    struct Test {
        test_vault: Vault,
        test_token_resource_manager: ResourceManager,
        test_list: Vec<NonFungibleLocalId>
    }

    impl Test {

        // This is a function, and can be called directly on the blueprint once deployed
        pub fn instantiate_hello() -> Global<Test> {

            let (address_reservation, component_address) =
                Runtime::allocate_component_address(Test::blueprint_id());

            let test_token: ResourceManager =
                ResourceBuilder::new_ruid_non_fungible::<TestData>(OwnerRole::None)
                    .mint_roles(mint_roles! {
                        minter => rule!(require(global_caller(component_address)));
                        minter_updater => rule!(deny_all);
                    })
                    .burn_roles(burn_roles! {
                        burner => rule!(require(global_caller(component_address)));
                        burner_updater => rule!(deny_all);
                    })
                    .create_with_no_initial_supply();

            // Instantiate a Hello component, populating its vault with our supply of 1000 HelloToken
            Self {
                test_vault: Vault::new(test_token.address()),
                test_token_resource_manager: test_token,
                test_list: Vec::new()
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::None)
            .with_address(address_reservation)
            .globalize()
        }

        // This is a method, because it needs a reference to self.  Methods can only be called on components
        pub fn mint_token(&mut self) {

            let amount: Decimal = Decimal::ZERO;

            // Mint transient token
            let test_token_resource_manager: ResourceManager = self.test_token_resource_manager;
            let test_token: Bucket =
                test_token_resource_manager.mint_ruid_non_fungible(TestData {
                    amount
                });
            
            let test_token_id = test_token.as_non_fungible().non_fungible_local_id();

            self.test_list.push(test_token_id);

            self.test_vault.put(test_token)
        }

        // This is a method, because it needs a reference to self.  Methods can only be called on components
        pub fn take_token(&mut self) -> Bucket {

            // Remove the first entry (pop from the front)
            let id: NonFungibleLocalId = self.test_list.remove(0);

            let unstake_nft_bucket: NonFungibleBucket = self.test_vault.as_non_fungible().take_non_fungible(&id);

            let bucket: Bucket = unstake_nft_bucket.into();

            bucket
        }
    }
}
