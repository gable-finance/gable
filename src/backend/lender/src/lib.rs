use scrypto::prelude::*;
// use std::collections::HashMap;

#[derive(Debug)]
#[derive(NonFungibleData)]
#[derive(ScryptoSbor)]
struct AmountDue {
    amount: Decimal,
    interest_rate: Decimal
}

#[blueprint]
mod flashloan {
    struct Flashloan {
        owner_badge_vault: Vault,
        admin_badge_address: ResourceAddress,

        liquidity_admin: Decimal,
        liquidity_interest: Decimal,
        liquidity_emmissions: Decimal,
        liquidity_pool_vault: Vault,

        supplier_hashmap: HashMap<ComponentAddress, Vec<Decimal>>,

        interest_rate: Decimal,

        transient_token_address: ResourceAddress,
    }

    impl Flashloan {

        //GOOD
        pub fn instantiate_lender() -> (Bucket, ComponentAddress) {

            // provision fungible resource and generate owner's badge
            let owner_badge: Bucket = ResourceBuilder::new_fungible()
                .divisibility(DIVISIBILITY_NONE)
                .metadata("name", "Owners Badge")
                .metadata("symbol", "SOB")
                .metadata("description", "Sundae owners badge")
                .mint_initial_supply(1);

            info!("{} owners badge is provided to component", owner_badge.amount());
            
            // provision fungible resource and generate admin's badge
            // to support (co-)ownership
            // mintable and burnable by anyone that owns a admin's badge
            let admin_badge: Bucket = ResourceBuilder::new_fungible()
                .divisibility(DIVISIBILITY_NONE)
                .metadata("name", "Admin Badge")
                .metadata("symbol", "SAB")
                .metadata("description", "Sundae admin badge")
                .mintable(rule!(require(owner_badge.resource_address())), LOCKED)
                .burnable(rule!(require(owner_badge.resource_address())), LOCKED)
                .mint_initial_supply(1);

            // provision transient non-fungible resource
            // to enforce flashloan repayment
            let transient_token: ResourceAddress = ResourceBuilder::new_uuid_non_fungible::<AmountDue>()
                .metadata(
                    "name", 
                    "Flashloan transient token - amount due must be returned to burn this token"
                )
                .mintable(rule!(require(owner_badge.resource_address())), LOCKED)
                .burnable(rule!(require(owner_badge.resource_address())), LOCKED)
                .restrict_deposit(rule!(deny_all), LOCKED)
                .create_with_no_initial_supply();
            
            let rule = AccessRulesConfig::new()
                .method("admin_deposit_liquidity", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .method("admin_withdraw_liquidity", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .method("add_supplier", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .method("add_supplier", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .method("remove_supplier", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .method("transfer_supplier", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .method("update_supplier_info", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .method("update_interest_rate", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .method("mint_admin_badge", rule!(require(
                    admin_badge.resource_address()
                    )), LOCKED)
                .default(rule!(allow_all), LOCKED);            

            let flashloan_component = Self {
                // declare badges
                owner_badge_vault: Vault::with_bucket(owner_badge),
                admin_badge_address: admin_badge.resource_address(),

                liquidity_admin: dec!("0"),
                liquidity_interest: dec!("0"),
                liquidity_emmissions: dec!("0"),
                liquidity_pool_vault: Vault::new(RADIX_TOKEN),

                supplier_hashmap: HashMap::new(),

                interest_rate: dec!("0"),

                transient_token_address: transient_token,

            }
                .instantiate();
                // flashloan_component.add_access_check(rule);
                let flashloan_component_address: ComponentAddress = flashloan_component.globalize_with_access_rules(rule);
            
            info!("{} admin badge is provided to user", admin_badge.amount());

            return (admin_badge, flashloan_component_address)

        }

        pub fn get_loan(&mut self, amount: Decimal) -> (Bucket, Bucket) {  

            // ensure requested amount is positive 
            // and is less than the total available amount
            assert!(amount > dec!("0"), "Please provide an amount larger than 0");
            assert!(amount < self.liquidity_pool_vault.amount(),
                "Please request a loan amount smaller than {}", self.liquidity_pool_vault.amount()
            ); 

            // log
            info!("Loan amount: {} XRD", amount);
            info!("Interest amount: {} %", self.interest_rate);
            
            //mint transient token
            let transient_token_resource_manager: ResourceManager = borrow_resource_manager!(self.transient_token_address);
            
            let transient_token: Bucket = self.owner_badge_vault.authorize(||
                transient_token_resource_manager.mint_uuid_non_fungible(
                     AmountDue {amount: amount, interest_rate: self.interest_rate}
                )
            );

            debug!("Transient token data: {:?}", transient_token.non_fungible::<AmountDue>().data());      

            // withdraw loan amount
            let loan: Bucket = self.liquidity_pool_vault.take(amount);
            
            // return transient token bucket and loan bucket
            return (transient_token, loan)
        }

        pub fn repay_loan(&mut self, transient_token: Bucket, mut repayment: Bucket) -> Bucket {

            // ensure transient token is original
            assert_eq!(self.transient_token_address, transient_token.resource_address(),
                "Please provide the transient token");

            // ensure only a single transient token is provided
            assert_eq!(transient_token.amount(), dec!("1"),
                "Please provide exactly one transient token");

            // ensure repayment is done in XRD
            assert!(repayment.resource_address() == RADIX_TOKEN, 
                "please provide XRD as repayment");
            
            // log
            info!("Repayment amount offered: {} XRD", repayment.amount());

            // extract loan terms from transient token data
            let loan_data: AmountDue = transient_token.non_fungible().data(); 
            let loan_amount: Decimal = loan_data.amount;
            let interest_rate: Decimal = loan_data.interest_rate;

            // calculate amount due
            let interest_amount: Decimal = loan_amount * interest_rate;
            let repayment_amount: Decimal = loan_amount + interest_amount;

            self.liquidity_interest += interest_amount / dec!("2");
            self.liquidity_admin += interest_amount / dec!("2");

            // log
            info!("Repayment amount required: {} XRD", &loan_amount);
            info!("interest amount required: {} XRD", &interest_rate);

            // ensure at least full repayment amount is offered
            assert!(repayment.amount() >= repayment_amount, 
                "Please provide at least the full amount back");

            // deposit repayment
            self.liquidity_pool_vault.put(repayment.take(repayment_amount));

            // burn transient token
            self.owner_badge_vault.authorize(||
                transient_token.burn()
                );

            // return residual
            return repayment
        }

        pub fn admin_deposit_liquidity(&mut self, deposit: Bucket) {
            // ensure requested amount is a positive 
            // and is less then the total available amount
            assert!(deposit.amount() > dec!("0"), 
                "Please deposit an amount larger than 0");

            assert_eq!(deposit.resource_address(), RADIX_TOKEN,
                "Please deposit XRD");

            // log
            info!("admin liquidity before deposit: {} XRD", self.liquidity_admin);
            info!("admin liquidity provided: {} XRD", deposit.amount());

            // administrate liquidity amount provided by admin
            self.liquidity_admin += deposit.amount();

            // deposit admin liquidity
            self.liquidity_pool_vault.put(deposit);

            // log
            info!("admin liquidity after deposit: {} XRD", self.liquidity_admin);
        }

        pub fn admin_withdraw_liquidity(&mut self, amount: Decimal) -> Bucket {

            // ensure amount is positive
            assert!(amount > dec!("0"), 
                "Please withdraw an amount larger than 0");

            // ensure amount is less or equal than liquidity provided by admin
            assert!(amount <= (self.liquidity_pool_vault.amount()), 
                "Please withdraw an amount smaller than has been deposited");

            // log
            info!("admin liquidity before withdrawal: {} XRD", self.liquidity_admin);
            info!("admin liquidity withdrawn: {} XRD", amount);

            // substract withdrawed amount from admin liquidity
            self.liquidity_admin -= amount;

            // log
            info!("admin liquidity after withdrawal: {} XRD", self.liquidity_admin);

            // withdraw amount
            let withdraw: Bucket = self.liquidity_pool_vault.take(amount);

            // return bucket
            return withdraw

        }

        pub fn deposit_batch(&mut self, bucket: Bucket) {

            self.liquidity_emmissions += bucket.amount();

            self.liquidity_pool_vault.put(bucket);
        }

        pub fn add_supplier(&mut self, account_address: ComponentAddress, epoch: Decimal, lsu_amount: Decimal) {

            assert!(epoch >= dec!("0"), "Please provide an epoch number equal or larger than 0");
            assert!(lsu_amount >= dec!("0"), "Please provide an lsu amount equal or larger than 0");

            info!("address: {:?}, epoch: {}, lsu amount: {}"
                , account_address
                , epoch
                , lsu_amount);

            // initiate epoch and rewards (0)
            // let epoch: Decimal = scrypto::math::Decimal::from(Runtime::current_epoch());
            let rewards: Decimal = dec!("0");

            // create vector for this specific supplier to be insterted in the hashmap
            let supplier_vec: Vec<Decimal> = vec![epoch, lsu_amount, rewards];

            // if supplier already exists, re-use its vector in the hashmap
            // sum the lsu amounts and leave epoch and rewards intact.
            if let Some(i) = self.supplier_hashmap.get_mut(&account_address) {
                i[1] += lsu_amount;
            }
            // else insert a new vector for this supplier in the hashmap
            else {
                self.supplier_hashmap.insert(account_address, supplier_vec);
            }

            debug!("HashMap: {:?}", self.supplier_hashmap.get(&account_address));
        }

        pub fn remove_supplier(&mut self, account_address: ComponentAddress, lsu_amount: Decimal) -> Bucket {

            debug!("hashmap: {:?}", self.supplier_hashmap);

            // check if account is present
            assert!(self.supplier_hashmap.contains_key(&account_address), "account address not found");

            // if let Some(&supplier_lsu) = self.supplier_hashmap.get(&account_address).and_then(|i| i.get(1)) {
            //     assert!(lsu_amount > supplier_lsu, "Supplied LSUs are less than burned LSUs")
            // };

            let lsu_supplied: Decimal = self.supplier_hashmap[&account_address][1];
            let rewards: Decimal = self.supplier_hashmap[&account_address][2];

            // check if burned lsu's doesnt exceed present lsu's
            assert!(lsu_supplied >= lsu_amount,
                "supplier lsu's are less than burned lsu's");

            if lsu_supplied > lsu_amount {
                // return portion of rewards
                let payout_amount: Decimal = rewards * (lsu_amount / lsu_supplied);
                let payout: Bucket = self.liquidity_pool_vault.take(payout_amount);

                info!("{} {} {}", lsu_supplied, lsu_amount, payout_amount);

                // adjust hashmap entry with returned lsu and xrd
                if let Some(vector) = self.supplier_hashmap.get_mut(&account_address) {
                    vector[1] -= lsu_amount;
                    vector[2] -= payout_amount;
                }

                debug!("hashmap: {:?}", self.supplier_hashmap);

                return payout
            }
            else {
                // return all rewards
                let payout: Bucket = self.liquidity_pool_vault.take(rewards);

                // remove hashmap entry
                self.supplier_hashmap.remove(&account_address);

                debug!("hashmap: {:?}", self.supplier_hashmap);

                return payout
            };

        }
        
        pub fn transfer_supplier(&mut self, old_account_address: ComponentAddress, new_account_address: ComponentAddress, transferred_lsu_amount: Decimal) {
            
            debug!("hashmap: {:?}", self.supplier_hashmap);

            // check old address pressence in hashmap
            assert!(self.supplier_hashmap.contains_key(&old_account_address), "account address not found");

            let old_lsu_amount: Decimal = self.supplier_hashmap[&old_account_address][1];
            let rewards: Decimal = self.supplier_hashmap[&old_account_address][2];

            if old_lsu_amount > transferred_lsu_amount {

                // return portion of rewards
                let transferred_rewards: Decimal = rewards * (transferred_lsu_amount / old_lsu_amount);

                // adjust old account in hashmap 
                if let Some(vector) = self.supplier_hashmap.get_mut(&old_account_address) {
                    vector[1] -= transferred_lsu_amount;
                    vector[2] -= transferred_rewards;
                }

                // transfer info to new account in hashmap
                let epoch = scrypto::math::Decimal::from(Runtime::current_epoch());
                let new_account_vec: Vec<Decimal> = vec![epoch, transferred_lsu_amount, transferred_rewards];

                    // change account if already exists
                if let Some(vector) = self.supplier_hashmap.get_mut(&new_account_address) {
                    vector[1] += transferred_lsu_amount;
                    vector[2] += transferred_rewards;
                }
                    // add new account if not
                else {
                    self.supplier_hashmap.insert(new_account_address, new_account_vec);
                }
                
            }
            else if old_lsu_amount == transferred_lsu_amount {

                // remove old account and write vector to new account in hashmap
                if let Some(vector) = self.supplier_hashmap.remove(&old_account_address) {
                    // Insert a new key-value pair with the desired key and the same value
                    self.supplier_hashmap.insert(new_account_address, vector);
                }
                
            };

            debug!("hashmap: {:?}", self.supplier_hashmap);
        }
        
        pub fn update_supplier_info(&mut self) {

            // log
            info!("pool liquidity: {} XRD", self.liquidity_pool_vault.amount());
            info!("admin liquidity: {} XRD", self.liquidity_admin);
            debug!("{:?}", self.supplier_hashmap);

            // calculate newly earned rewards based on collected emmissions and interest fee's
            let new_rewards: Decimal = self.liquidity_interest + self.liquidity_emmissions;
            
            //self.liquidity_pool_vault.amount() - self.liquidity_admin;

            let lsu_total: Decimal = self.supplier_hashmap.values().filter_map(|i| i.get(1)).copied().sum();

            for i in self.supplier_hashmap.values_mut() {
                // administrate the distribution of the newly earned rewards 
                // to the stakers existing accumulated rewards
                let staker_lsu = i[1];
            
                // distribute the newly earned rewards based on staker's lsu relative to pool's lsu  
                i[2] += new_rewards * (staker_lsu / lsu_total);
            };

            debug!("{:?}", self.supplier_hashmap);
            
        }

        pub fn update_interest_rate(&mut self, interest_rate: Decimal){

            assert!(interest_rate > dec!("0"), "Please provide a positive interest rate");

            info!("Interest rate before change: {}", self.interest_rate);

            self.interest_rate = interest_rate;

            info!("Interest rate after change: {}", self.interest_rate);

        }

        pub fn mint_admin_badge(&self) -> Bucket {
            
            let admin_badge_resource_manager: ResourceManager = borrow_resource_manager!(self.admin_badge_address);
            
            let admin_badge: Bucket = self.owner_badge_vault.authorize(||
                admin_badge_resource_manager.mint(1)
            );

            return admin_badge
        }
    }
}

        // OUTDATED
        // pub fn staker_deposit_lsu(&mut self, lsu_tokens: Bucket) -> Bucket {
        //     // assert_eq!(lsu_tokens.resource_address(), self.liquidity_pool_vault.resource_address(),
        //     // "Please provide liquidity pool tokens generated by the Delegate Finance validator node");

        //     assert!(lsu_tokens.amount() > dec!("0"), 
        //         "Please provide an amount of liquidity pool tokens greater than zero");

        //     debug!("{:?}", self.lsu_nft_data);

        //     self.lsu_nft_nr += 1;

        //     let lsu_nft_resource_manager: ResourceManager = borrow_resource_manager!(self.lsu_nft_address);

        //     let lsu_nft: Bucket = self.owner_badge_vault.authorize(||
        //         lsu_nft_resource_manager.mint_non_fungible(
        //             &NonFungibleLocalId::Integer(self.lsu_nft_nr.into()),
        //             LiquidityProvider {
        //                 lsu_amount: lsu_tokens.amount(),
        //                 entry_epoch: Runtime::current_epoch(),
        //             }
        //         )
        //     );

        //     let epoch: Decimal = scrypto::math::Decimal::from(Runtime::current_epoch());
        //     let amount: Decimal = lsu_tokens.amount() as Decimal;
        //     let rewards: Decimal = dec!("0");

        //     let lsu_nft_data: Vec<Decimal> = vec![epoch, amount, rewards];

        //     self.lsu_nft_data.insert(NonFungibleLocalId::Integer(self.lsu_nft_nr.into()), lsu_nft_data);

        //     self.lsu_vault.put(lsu_tokens);

        //     debug!("{:?}", self.lsu_nft_data);

        //     return lsu_nft
        // }

        // OUTDATED
        // pub fn staker_withdraw_lsu(&mut self, lsu_nft: Bucket) -> (Bucket, Bucket) {

        //     assert_eq!(lsu_nft.resource_address(), self.lsu_nft_address,
        //     "Please provide the lsu NFT generated by the Delegate Finance validator node");

        //     assert_eq!(lsu_nft.amount(), dec!("1"),
        //     "Please provide only one nft");

        //     let lsu_nft_nr = lsu_nft.non_fungible_local_id();

        //     debug!("{:?}", lsu_nft_nr);
        //     debug!("{:?}", self.lsu_nft_data);
        //     debug!("{:?}", self.lsu_nft_data[&lsu_nft_nr]);

        //     let lsu: Bucket = self.lsu_vault.take(self.lsu_nft_data[&lsu_nft_nr][1]);
        //     let rewards: Bucket = self.liquidity_pool_vault.take(self.lsu_nft_data[&lsu_nft_nr][2]);

        //     debug!("{:?}", self.lsu_nft_data);

        //     self.lsu_nft_data.remove(&lsu_nft_nr);

        //     debug!("{:?}", self.lsu_nft_data);

        //     self.owner_badge_vault.authorize(||
        //         lsu_nft.burn()
        //         );

        //     return (lsu, rewards)
        // }