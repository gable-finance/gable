use scrypto::prelude::*;

// #[derive(Debug)]
// #[derive(NonFungibleData)]
// struct AmountDue {
//     amount: Decimal,
//     interest: Decimal
// }

#[blueprint]
mod flashloan_caller {
    struct Flashloancall {
        lender_component_address: ComponentAddress,
        receiver_vault: Vault,
        opportunity_vault: Vault,
    }

    impl Flashloancall {
        pub fn instantiate_caller(lenders_component: ComponentAddress, opportunity: Bucket) -> ComponentAddress {

            // fail if opporunity is not an XRD bucket
            assert!(opportunity.resource_address() == RADIX_TOKEN,
                "opportunity must be of type XRD");

            // instantiate flashloan contract address, receiver vault and opportunity vault
            Self {
                lender_component_address: lenders_component,
                receiver_vault: Vault::new(RADIX_TOKEN),
                opportunity_vault: Vault::with_bucket(opportunity),
            }
                .instantiate()
                .globalize()
        }

    pub fn call_flashloan (&mut self, amount: Decimal) -> (Bucket, Bucket) {

        // abort when flashloan amount is negative
        assert!(amount > dec!("0"), "Amount must be positive");

        // call flashloan component to receive loan amount plus transient token
        let (transient_token, loan) : (Bucket, Bucket) = 
            borrow_component!(self.lender_component_address).call::<(Bucket, Bucket)>("get_loan",
                args![amount]);

        info!("Loan amount: {} XRD", loan.amount());

        //self.receiver_vault.put(loan);

        info!("Receiver vault content: {} XRD", self.receiver_vault.amount());

        return (transient_token, loan)

        }

    // function to resemble an opportunity
    // returns a profit
    fn opportunity (&mut self, loan: Bucket) -> Bucket {

        self.receiver_vault.put(loan);
        let opportunity: Bucket = self.opportunity_vault.take_all();

        return opportunity
    }

    // repay the loan with the profit from the opportunity
    // returns the residual between amount due and opportunity profit
    pub fn repay_loan (&mut self, transient_token: Bucket, loan: Bucket) {
 
        let opportunity: Bucket = self.opportunity(loan);

        let residual: Bucket = borrow_component!(self.lender_component_address).call::<Bucket>("repay_loan",
           args![transient_token, opportunity]);
        
        info!("Residual amount returned: {} XRD", residual.amount());

        self.opportunity_vault.put(residual);

        }
    }
}