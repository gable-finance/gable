use scrypto::prelude::*;

#[derive(Debug)]
#[derive(NonFungibleData)]
#[derive(ScryptoSbor)]
struct AmountDue {
    amount: Decimal,
    interest_rate: Decimal
}

#[blueprint]
mod opportunity {
    struct Opportunity {
        lender_component_address: ComponentAddress,
        receiver_vault: Vault,
        opportunity_vault: Vault,
    }

    impl Opportunity {
        pub fn instantiate_opportunity(lenders_component: ComponentAddress, opportunity: Bucket) -> ComponentAddress {

            // fail if opportunity is not an XRD bucket
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

    // pub fn call_flashloan (&mut self, amount: Decimal) -> (Bucket, Bucket) {

        // abort when flashloan amount is negative
        // assert!(amount > dec!("0"), "Amount must be positive");

        // // call flashloan component to receive loan amount plus transient token
        // let (transient_token, loan) : (Bucket, Bucket) = 
        //     borrow_component!(self.lender_component_address).call::<(Bucket, Bucket)>("get_loan",
        //         scrypto_args![amount]);

        // info!("Loan amount: {} XRD", loan.amount());

        // //self.receiver_vault.put(loan);

        // info!("Receiver vault content: {} XRD", self.receiver_vault.amount());

        // return (transient_token, loan)

        // }

    // function to resemble an opportunity
    // returns a profit
    fn opportunity (&mut self, loan: Bucket, transient_token: Bucket ) -> (Bucket, Bucket) {


        let loan_data: AmountDue = transient_token.non_fungible().data(); 
        let interest_rate: Decimal = loan_data.interest_rate;

        let opportunity_amount = loan.amount() * (dec!("1") + interest_rate);

        let opportunity: Bucket = self.opportunity_vault.take(opportunity_amount);
        self.receiver_vault.put(loan);

        return (opportunity, transient_token)
    }

    // repay the loan with the profit from the opportunity
    // returns the residual between amount due and opportunity profit
    // pub fn repay_loan (&mut self, transient_token: Bucket, loan: Bucket) {
 
    //     let opportunity: Bucket = self.opportunity(loan);

    //     let residual: Bucket = borrow_component!(self.lender_component_address).call::<Bucket>("repay_loan",
    //         scrypto_args![transient_token, opportunity]);
        
    //     info!("Residual amount returned: {} XRD", residual.amount());

    //     self.opportunity_vault.put(residual);

    //     }

    }
}