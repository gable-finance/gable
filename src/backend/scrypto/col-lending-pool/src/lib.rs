use scrypto::prelude::*;

#[blueprint]
mod radiswap {
    struct Collateralpool {
        pool_component: Global<OneResourcePool>, 
    }

    impl Collateralpool {
        pub fn new(
            owner_role: OwnerRole,
            resource_address: ResourceAddress,
        ) -> Global<Collateralpool> {
            let (address_reservation, component_address) =
                Runtime::allocate_component_address(Runtime::blueprint_id());
            let global_component_caller_badge =
                NonFungibleGlobalId::global_caller_badge(component_address);

            let pool_component = Blueprint::<OneResourcePool>::instantiate( 
                owner_role.clone(),
                rule!(require(global_component_caller_badge)),
                resource_address,
            );

            Self { pool_component }
                .instantiate()
                .prepare_to_globalize(owner_role)
                .with_address(address_reservation)
                .globalize()
        }

    //     pub fn add_liquidity(
    //         &mut self,
    //         resource1: Bucket,
    //         resource2: Bucket,
    //     ) -> (Bucket, Option<Bucket>) {
    //         self.pool_component.contribute((resource1, resource2)) 
    //     }

    //     pub fn remove_liquidity(&mut self, pool_units: Bucket) -> (Bucket, Bucket) { 
    //         self.pool_component.redeem(pool_units)
    //     }

    //     pub fn swap(&mut self, input_bucket: Bucket) -> Bucket {
    //         let mut reserves = self.vault_reserves();

    //         let input_amount = input_bucket.amount();

    //         let input_reserves = reserves
    //             .remove(&input_bucket.resource_address())
    //             .expect("Resource does not belong to the pool");
    //         let (output_resource_address, output_reserves) = reserves.into_iter().next().unwrap();

    //         let output_amount = (input_amount * output_reserves) / (input_reserves + input_amount);

    //         self.deposit(input_bucket);
    //         self.withdraw(output_resource_address, output_amount)
    //     }

    //     fn vault_reserves(&self) -> BTreeMap<ResourceAddress, Decimal> {
    //         self.pool_component.get_vault_amounts()
    //     }

    //     fn deposit(&mut self, bucket: Bucket) {
    //         self.pool_component.protected_deposit(bucket)
    //     }

    //     fn withdraw(&mut self, resource_address: ResourceAddress, amount: Decimal) -> Bucket {
    //         self.pool_component.protected_withdraw(
    //             resource_address,
    //             amount,
    //             WithdrawStrategy::Rounded(RoundingMode::ToZero),
    //         )
    //     }
    }
}