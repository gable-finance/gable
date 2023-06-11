// use radix_engine::ledger::*;
// use radix_engine::transaction::*;
use scrypto::prelude::*;

#[blueprint]
mod flashloan_test {
    struct Flashloantest {
        lender_component_address: ComponentAddress,
        opportunity_component_address: ComponentAddress,
    }

    impl Flashloantest {
        pub fn instantiate_caller(lenders_component: ComponentAddress, opportunity_component: ComponentAddress) -> ComponentAddress {

            Self {
                lender_component_address: lenders_component,
                opportunity_component_address: opportunity_component
            }
                .instantiate()
                .globalize()
        }

    pub fn transaction (&mut self, amount: Decimal) {

        let (public_key, private_key, account_component_address) = executor.new_account();

        let transaction: SignedTransaction = ManifestBuilder::new()
            .call_method(self.lender_component_address, "get_loan", scrypto_args![amount])
            .take_from_worktop(RADIX_TOKEN, |builder1, bucket1| {
                    builder2
                    .call_method(self.opportunity_component_address, "opportunity", scrypto_args![bucket1])
                    .take_from_worktop(RADIX_TOKEN, |builder2, bucket2|{
                        builder2.take_from_worktop(TRANSIENT_TOKEN, |builder3, bucket3| {
                            builder2.call_method(self.lender_component_address, "repay_loan", scrypto_args![bucket3, bucket2])
                        })
                    })   
                })
            .call_method(account_component_address, "deposit_batch", scrypto_args!(ManifestExpression::EntireWorktop));
        }
    }
}