use scrypto::prelude::*;
use events::*;

mod events;

#[derive(Debug, NonFungibleData, ScryptoSbor)]
struct AmountDue {
    amount: Decimal,
    interest_rate: Decimal,
}

#[derive(Debug, NonFungibleData, ScryptoSbor)]
struct LiquiditySupplier {
    box_nr: u64,
    lsu_amount: Decimal,
}

#[blueprint]
#[events(LsuDepositEvent, LsuWithdrawEvent, UpdateIndexmapEvent, UpdateInterestRateEvent)]
mod flashloanpool {

    enable_method_auth! {
        roles {
            admin => updatable_by: [OWNER];
            component => updatable_by: [OWNER];
        },
        methods {
            get_flashloan => PUBLIC;
            repay_flashloan => PUBLIC;
            owner_deposit_xrd => restrict_to: [OWNER];
            owner_withdraw_xrd => restrict_to: [OWNER];
            deposit_batch => PUBLIC;
            deposit_lsu => PUBLIC;
            withdraw_lsu => PUBLIC;
            update_supplier_kvs => restrict_to: [admin, OWNER, component];
            update_interest_rate => restrict_to: [admin, OWNER];
            update_box_size => restrict_to: [admin, OWNER];
            deposit_validator_owner => restrict_to: [OWNER];
            withdraw_validator_owner => restrict_to: [OWNER];
            start_unlock_owner_stake_units => restrict_to: [admin, OWNER];
            finish_unlock_owner_stake_units => restrict_to: [admin, OWNER];
            unstake => restrict_to: [admin, OWNER];
            claim_xrd => restrict_to: [admin, OWNER];
        }
    }

    struct Flashloanpool {
        // total liquidity vault
        liquidity_pool_vault: Vault, 
        // validator owner vault
        owner_badge_address: ResourceAddress,
        // liquidity that is supplied by the owner
        owner_liquidity: Decimal,
        // reference to the admin badge
        admin_badge_address: ResourceAddress,
        // index map storing aggregate supplier information
        supplier_aggregate_im: IndexMap<u64, Vec<Decimal>>,
        // key value store that stores individual supplier information
        supplier_partitioned_kvs: KeyValueStore<u64, IndexMap<NonFungibleLocalId, Vec<Decimal>>>,
        // reference to 'proof of supply nft'
        pool_nft: ResourceManager,
        // nft local id number
        pool_nft_nr: u64,
        // vault storing supplier's LSU's
        lsu_vault: Vault,
        // liquidity that is supplied by staking rewards
        rewards_liquidity: Decimal,
        // vault storing the unstaking lsu's
        unstaking_lsu_vault: Vault,
        // vault storing unstaking nft
        unstaking_nft_vault: Vault,
        // reference to transient token
        transient_token: ResourceManager,
        // interest rate
        interest_rate: Decimal,
        // map dize
        box_size: u64
    }

    impl Flashloanpool {
        pub fn instantiate_flashloan_pool(owner_badge: Bucket, validator_owner: Bucket) -> (Bucket, FungibleBucket, Global<Flashloanpool>) {
            let (address_reservation, component_address) =
                Runtime::allocate_component_address(Flashloanpool::blueprint_id());

            // Provision fungible resource and generate admin's badge
            // to support (co-)ownership
            // Mintable and burnable by anyone who owns an admin's badge
            let admin_badge: FungibleBucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {
                    init {
                        "name" => "Sundae FLP Admin Badge", locked;
                        "symbol" => "FLP", locked;
                        "description" => "Sundae flash loan pool admin badge", locked;
                    }
                })
                .mint_roles(mint_roles! {
                    minter => rule!(require(owner_badge.resource_address()));
                    minter_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner => rule!(require(owner_badge.resource_address()));
                    burner_updater => rule!(deny_all);
                })
                .mint_initial_supply(1);

            // Provision transient non-fungible resource
            // to enforce flashloan repayment
            let transient_token: ResourceManager =
                ResourceBuilder::new_ruid_non_fungible::<AmountDue>(OwnerRole::None)
                    .metadata(metadata! {
                        roles {
                            metadata_setter => rule!(require(owner_badge.resource_address()));
                            metadata_setter_updater => rule!(deny_all);
                            metadata_locker => rule!(require(owner_badge.resource_address()));
                            metadata_locker_updater => rule!(deny_all);
                        },
                        init {
                            "name" => "Sundae Transient Token", locked;
                            "symbol" => "STT", locked;
                            "description" => "Flashloan transient token - amount due must be returned to burn this token", locked;
                        }
                    })
                    .mint_roles(mint_roles! {
                        minter => rule!(require(global_caller(component_address)));
                        minter_updater => rule!(deny_all);
                    })
                    .burn_roles(burn_roles! {
                        burner => rule!(require(global_caller(component_address)));
                        burner_updater => rule!(deny_all);
                    })
                    .deposit_roles(deposit_roles! {
                        depositor => rule!(deny_all);
                        depositor_updater => rule!(deny_all);
                    })
                    .create_with_no_initial_supply();

            // Provision non-fungible resource
            // serves as proof of supply
            let pool_nft: ResourceManager =
                ResourceBuilder::new_integer_non_fungible::<LiquiditySupplier>(
                    OwnerRole::None,
                )
                .metadata(metadata! {
                    roles {
                        metadata_setter => rule!(require(owner_badge.resource_address()));
                        metadata_setter_updater => rule!(deny_all);
                        metadata_locker => rule!(require(owner_badge.resource_address()));
                        metadata_locker_updater => rule!(deny_all);
                    },
                    init {
                        "name" => "Sundae Proof of Supply", locked;
                        "symbol" => "SPS", locked;
                        "description" => "Pool NFT that represents the proof of supply", locked;
                    }
                })
                .mint_roles(mint_roles! {
                    minter => rule!(require(global_caller(component_address)));
                    minter_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner => rule!(require(global_caller(component_address)));
                    burner_updater => rule!(deny_all);
                })
                .create_with_no_initial_supply();

            let flashloan_component: Global<Flashloanpool> = Self {
                liquidity_pool_vault: Vault::new(XRD),
                owner_badge_address: owner_badge.resource_address(),
                admin_badge_address: admin_badge.resource_address(),
                owner_liquidity: Decimal::ZERO,
                supplier_aggregate_im: IndexMap::new(),
                supplier_partitioned_kvs: KeyValueStore::new(),
                pool_nft: pool_nft,
                pool_nft_nr: 0,
                lsu_vault: Vault::new(XRD),
                rewards_liquidity: Decimal::ZERO,
                unstaking_lsu_vault: Vault::new(XRD),
                unstaking_nft_vault: Vault::new(XRD),
                interest_rate: Decimal::ZERO,
                transient_token: transient_token,
                box_size: 250,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::Fixed(rule!(require(owner_badge.resource_address()))))
            .roles(roles! {
                admin => rule!(require(admin_badge.resource_address()));
                component => rule!(require(global_caller(component_address)));
            })
            .metadata(metadata! {
                roles {
                    metadata_setter => rule!(require(owner_badge.resource_address()));
                    metadata_setter_updater => rule!(deny_all);
                    metadata_locker => rule!(require(owner_badge.resource_address()));
                    metadata_locker_updater => rule!(deny_all);
                },
                init {
                    "name" => "Sundae: Flash Loan Pool", locked;
                    "description" => 
                        "Official Sundae 'XRD flash loan pool' component that
                        (1) offers a liquidity pool that collects XRD from staking rewards,
                        and (2) issues flash loans from the pool."
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
                    get_flashloan => Xrd(1.into()), locked;
                    repay_flashloan => Xrd(1.into()), locked;
                    owner_deposit_xrd => Xrd(1.into()), locked; 
                    owner_withdraw_xrd => Xrd(1.into()), locked;
                    deposit_batch => Free, locked;
                    deposit_lsu => Xrd(1.into()), locked;
                    withdraw_lsu => Xrd(1.into()), locked; 
                    update_supplier_kvs => Xrd(1.into()), locked;
                    update_interest_rate => Xrd(1.into()), locked;
                    // validator_component => Free, locked;
                    deposit_validator_owner => Free, locked;
                    withdraw_validator_owner => Free, locked;
                    start_unlock_owner_stake_units => Free, locked;
                    finish_unlock_owner_stake_units => Free, locked;
                    unstake => Free, locked;
                    claim_xrd => Free, locked;
                    update_box_size => Free, locked;
                }
            })
            .with_address(address_reservation)
            .globalize();

            info!("{} admin badge is provided to user", admin_badge.amount());

            return (owner_badge, admin_badge, flashloan_component);
        }

        pub fn get_flashloan(&mut self, amount: Decimal) -> (Bucket, Bucket) {
            // Ensure requested amount is positive
            // and is less than the total available amount
            assert!(amount > Decimal::ZERO, "Please provide an amount larger than 0");
            assert!(
                amount <= self.liquidity_pool_vault.amount(),
                "Please request a loan amount smaller than {}",
                self.liquidity_pool_vault.amount()
            );
        
            // Log
            info!("Loan amount: {} XRD", amount);
            info!("Interest amount: {} %", self.interest_rate);
        
            // Mint transient token
            let transient_token_resource_manager: ResourceManager = self.transient_token;
            let transient_token: Bucket = transient_token_resource_manager.mint_ruid_non_fungible(AmountDue {
                amount: amount,
                interest_rate: self.interest_rate,
            });
            debug!(
                "Transient token data: {:?}",
                transient_token
                    .as_non_fungible()
                    .non_fungible::<AmountDue>()
                    .data()
            );
        
            // Withdraw loan amount
            let loan: Bucket = self.liquidity_pool_vault.take(amount);
        
            // Return transient token bucket and loan bucket
            return (transient_token, loan);
        }
        
        pub fn repay_flashloan(&mut self, mut repayment: Bucket, transient_token: Bucket) -> Bucket {
            // Ensure transient token is original
            assert_eq!(
                self.transient_token.address(),
                transient_token.resource_address(),
                "Please provide the transient token"
            );
        
            // Ensure only a single transient token is provided
            assert_eq!(
                transient_token.amount(),
                dec!("1"),
                "Please provide exactly one transient token"
            );
        
            // Ensure repayment is done in XRD
            assert!(
                repayment.resource_address() == XRD,
                "Please provide XRD as repayment"
            );
        
            // Log
            info!("Repayment amount offered: {} XRD", repayment.amount());
        
            // Extract loan terms from transient token data
            let loan_data: AmountDue = transient_token
                .as_non_fungible()
                .non_fungible()
                .data();
            let loan_amount: Decimal = loan_data.amount;
            let interest_rate: Decimal = loan_data.interest_rate;
        
            // Calculate amount due
            let interest_amount: Decimal = loan_amount * interest_rate;
            let repayment_amount: Decimal = loan_amount + interest_amount;
        
            // Log
            info!("Repayment amount required: {} XRD", &loan_amount);
            info!("Interest amount required: {} XRD", &interest_amount);
        
            // Ensure at least full repayment amount is offered
            assert!(
                repayment.amount() >= repayment_amount,
                "Please provide at least the full amount back"
            );
        
            // Deposit repayment
            self.liquidity_pool_vault.put(repayment.take(repayment_amount));
        
            // Burn transient token
            transient_token.burn();

            // Return residual
            // If no residual is applicable, an empty bucket will be returned
            return repayment;
        }
        
        pub fn owner_deposit_xrd(&mut self, deposit: Bucket) {
            // Ensure requested amount is positive
            // and is less than the total available amount
            assert!(
                deposit.amount() > Decimal::ZERO,
                "Please deposit an amount larger than 0"
            );
        
            assert_eq!(
                deposit.resource_address(),
                XRD,
                "Please deposit XRD"
            );
        
            // Log
            info!("Owner liquidity before deposit: {} XRD", self.owner_liquidity);
            info!("Owner liquidity provided: {} XRD", deposit.amount());
        
            // Administer liquidity amount provided by owner
            self.owner_liquidity += deposit.amount();
        
            // Deposit owner liquidity
            self.liquidity_pool_vault.put(deposit);
        
            // Log
            info!("Owner liquidity after deposit: {} XRD", self.owner_liquidity);
        }
        
        pub fn owner_withdraw_xrd(&mut self, amount: Decimal) -> Bucket {
            // Ensure amount is positive
            assert!(
                amount > Decimal::ZERO,
                "Please withdraw an amount larger than 0"
            );
        
            // Ensure amount is less or equal to liquidity provided by owner
            assert!(
                amount <= self.liquidity_pool_vault.amount(),
                "Please withdraw an amount smaller than or equal to {}",
                self.owner_liquidity
            );
        
            // Log
            info!("Owner liquidity before withdrawal: {} XRD", self.owner_liquidity);
            info!("Owner liquidity withdrawn: {} XRD", amount);
        
            debug!("{:?}", self.supplier_aggregate_im);
        
            // Update the suppliers hashmap before returning earnings
            self.update_aggregate_im();
        
            debug!("{:?}", self.supplier_aggregate_im);
        
            // Subtract withdrawn amount from owner liquidity
            self.owner_liquidity -= amount;
        
            // Log
            info!("Owner liquidity after withdrawal: {} XRD", self.owner_liquidity);
        
            // Withdraw amount
            let withdraw: Bucket = self.liquidity_pool_vault.take(amount);
        
            // Return bucket
            return withdraw;
        }        

        // Temporary: Replicating validator node's staking rewards collection
        pub fn deposit_batch(&mut self, bucket: Bucket) {
            // Add bucket amount to rewards liquidity counter
            self.rewards_liquidity += bucket.amount();
            // Deposit batch into the liquidity pool vault
            self.liquidity_pool_vault.put(bucket);
        }

        pub fn deposit_lsu(&mut self, lsu_tokens: Bucket) -> Bucket {

            // Ensure LSU tokens are provided
            assert_eq!(
                lsu_tokens.resource_address(),
                self.lsu_vault.resource_address(),
                "Please provide liquids staking units (LSU's) generated by the Sundae validator node"
            );

            // Ensure LSU's provided is greater than zero
            assert!(
                lsu_tokens.amount() > Decimal::ZERO,
                "Please provide an amount of liquids staking units (LSU's) greater than zero"
            );

            // Log the number of LSU's provided
            info!("{} LSU's are provided", lsu_tokens.amount());

            // Increase the LSU local id by 1
            self.pool_nft_nr += 1;

            // Determine variables for the vector in the supplier indexmap
            let lsu_amount: Decimal = lsu_tokens.amount() as Decimal;
            let staking_rewards: Decimal = Decimal::ZERO;
            let interest_earnings: Decimal = Decimal::ZERO;

            // Insert variables into the vector
            let lsu_nft_data: Vec<Decimal> = vec![lsu_amount, staking_rewards, interest_earnings];

            let lsu_nft_id: NonFungibleLocalId = NonFungibleLocalId::Integer(self.pool_nft_nr.into());
            
            // Initiate box number as 1
            let mut box_nr: u64 = 1;

            // Initialize a boolean flag to track whether the condition has been satisfied
            let mut condition_satisfied = false;

            // Updating the aggregate index map for two possible scenarios:
            //  1. There is space available in one or more of the box's for an additional entry
            //  2. The boxes that contain the individual suppliers information are all full, 
            //      e.g. the number of entries in all boxes are equal to the map's limit.
            //     Or no box exists yet, e.g. no suppliers are present at all
            
            // Iterate through the index map's key-value pairs to determine the applicable scenario
            for (key, values) in &self.supplier_aggregate_im {
                // Check if the Vec is not empty and satisfies your condition
                if let Some(first_value) = values.first() {
                    if *first_value < self.box_size.into() {

                        // update box number
                        box_nr = *key;

                        // update existing supplier's info before adding a new supplier
                        self.update_supplier_kvs(box_nr);

                        // Set the flag to true to indicate that the condition has been satisfied
                        condition_satisfied = true;

                        break;
                    }
                }
            }

            // Check if the condition was satisfied for any iteration.
            // TRUE => scenario 1
            // FALSE => scenario 2
            if condition_satisfied {
                // Scenario 1: Add new supplier to the existing key value store and index map

                // Increase the box's number of suppliers by 1 new supplier
                self.supplier_aggregate_im.get_mut(&box_nr).unwrap()[0] += 1;
                // Increase the box's lsu amount by the supplied amount
                self.supplier_aggregate_im.get_mut(&box_nr).unwrap()[1] += lsu_tokens.amount();
                // Add new supplier to the box
                self.supplier_partitioned_kvs.get_mut(&box_nr).unwrap().insert(lsu_nft_id.clone(), lsu_nft_data.clone());
            } else {
                // Scenario 2: In case that all boxes are full or no box exists, a new box has to be inserted

                // Increment the new_key by one for the new key-value pair
                box_nr = self.supplier_aggregate_im.keys().max().unwrap_or(&0) + 1;

                // Update the aggregate IndexMap
                self.update_aggregate_im();

                // Create a new vector for the new box
                let new_vec: Vec<Decimal> = vec![
                    dec!("1"), 
                    lsu_tokens.amount(), 
                    Decimal::ZERO, 
                    Decimal::ZERO,
                    Decimal::ZERO,
                    Decimal::ZERO
                ];

                // Insert the new box into the aggregate IndexMap
                self.supplier_aggregate_im.insert(box_nr, new_vec);

                // Create a new IndexMap for the new box
                let mut indexmap: IndexMap<NonFungibleLocalId, Vec<Decimal>> = IndexMap::new();
                indexmap.insert(lsu_nft_id.clone(), lsu_nft_data.clone());

                // If none of the key-value pairs satisfy the condition, create a new key-value pair
                self.supplier_partitioned_kvs.insert(box_nr, indexmap);

                // Insert the new supplier data into the new box
                self.supplier_partitioned_kvs.get_mut(&box_nr).unwrap().insert(lsu_nft_id.clone(), lsu_nft_data);
            }

            // Mint an NFT containing the deposited vector <box number, lsu amount>
            let lsu_nft_resource_manager = self.pool_nft;

            let pool_nft: Bucket = lsu_nft_resource_manager.mint_non_fungible(
                &NonFungibleLocalId::Integer(self.pool_nft_nr.into()),
                LiquiditySupplier {
                    box_nr: box_nr,
                    lsu_amount: lsu_tokens.amount(),
                },
            );

            // Put provided LSU tokens in the LSU vault
            self.lsu_vault.put(lsu_tokens);

            debug!("{:?}", self.supplier_aggregate_im);
            debug!("{:?}", self.supplier_partitioned_kvs.get(&box_nr).unwrap().get(&lsu_nft_id));

            Runtime::emit_event(
                LsuDepositEvent {
                    box_nr: box_nr,
                    nft_id: lsu_nft_id,
                    lsu_amount: lsu_amount,
                },
            );

            // Return NFT as proof of LSU deposit to the user
            return pool_nft;
        }

        pub fn withdraw_lsu(&mut self, pool_nft: Bucket) -> (Bucket, Bucket) {
            // Ensure LSU NFT is provided
            assert_eq!(
                pool_nft.resource_address(),
                self.pool_nft.address(),
                "Please provide the proof of supply (LSU NFT) generated by the Sundae validator node"
            );

            // Ensure 1 LSU NFT is provided
            assert_eq!(
                pool_nft.amount(),
                dec!("1"),
                "Please provide only one NFT"
            );

            // Get the local id of the provided NFT, which resembles the key in the supplier indexmap
            let pool_nft_nr = pool_nft
                .as_non_fungible()
                .non_fungible_local_id();

            // Extract loan terms from transient token data
            let pool_nft_data: LiquiditySupplier = pool_nft
                .as_non_fungible()
                .non_fungible()
                .data();
            
            let pool_nft_box_nr: u64 = pool_nft_data.box_nr;

            debug!("{:?}", pool_nft_nr);

            self.update_supplier_kvs(pool_nft_box_nr);

            debug!("{:?}", self.supplier_partitioned_kvs.get(&pool_nft_box_nr).unwrap().get(&pool_nft_nr));

            // debug!("{:?}", self.supplier_indexmap[&pool_nft_nr]);

            let key_value_pair: Vec<Decimal> = self.supplier_partitioned_kvs.get(&pool_nft_box_nr).unwrap().get(&pool_nft_nr).unwrap().to_vec();

            // Withdraw entitled LSU's and earnings from vaults and return as a bucket
            let lsu_bucket: Bucket = self.lsu_vault.take(key_value_pair[0]);
            let staking_rewards: Decimal = key_value_pair[1];
            let interest_earnings: Decimal = key_value_pair[2];
            let earnings: Decimal = staking_rewards + interest_earnings;
            let earnings_bucket: Bucket = self.liquidity_pool_vault.take(earnings);

            // Log the LSU's and earnings returned to the supplier
            info!(
                "{} LSU's and {} XRD is returned to the supplier",
                lsu_bucket.amount(),
                earnings
            );

            // Remove the supplier's entry from the supplier indexmap
            self.supplier_partitioned_kvs.get_mut(&pool_nft_box_nr).unwrap().remove(&pool_nft_nr);

            if let Some(value) = self.supplier_partitioned_kvs.get(&pool_nft_box_nr).unwrap().get(&pool_nft_nr) {
                debug!("{:?}", value)
            } else {
                debug!("None found")
            }
            
            let im_value = self.supplier_aggregate_im.get_mut(&pool_nft_box_nr).unwrap();
            
            // Update the aggregate index map for two possible scenarios:
            //  1. the withdrawing supplier was the only one present in the box
            //  2. the box was populated by more than 1 supplier

            // If scenario 1 => remove the box's key-value pair from the index map
            if im_value[0] == Decimal::ONE {
                self.supplier_aggregate_im.remove(&pool_nft_box_nr);

            // If scenario 2 => update the box's key-value pair by removing the withdrawing supplier's information
            } else {
                im_value[0] -= Decimal::ONE;
                im_value[1] -= lsu_bucket.amount();
                im_value[2] -= staking_rewards;
                im_value[4] -= interest_earnings;
            }

            // Burn the provided pool NFT
            pool_nft.burn();

            Runtime::emit_event(
                LsuWithdrawEvent {
                    box_nr: pool_nft_box_nr,
                    nft_id: pool_nft_nr,
                    lsu_amount: lsu_bucket.amount(),
                    staking_rewards: staking_rewards,
                    interest_earnings: interest_earnings
                }
            );

            // Return LSU's and rewards to the user
            return (lsu_bucket, earnings_bucket);
        }

        // Method updating the aggregate index map
        fn update_aggregate_im(&mut self) {

            // Save state variables
            let total_pool: Decimal = self.liquidity_pool_vault.amount();

            info!("total_pool: {}", total_pool);

            let total_lsu = self.lsu_vault.amount();

            info!("total_lsu: {}", total_lsu);

            let owner_liquidity: Decimal = self.owner_liquidity;

            info!("owner_liquidity: {}", owner_liquidity);

            let rewards_new = self.rewards_liquidity;

            info!("rewards_new: {} XRD", rewards_new);

            // Determine total rewards and interest earnings by summing the undistributed and distributed rewards/interest over the whole index map
            let (rewards_aggregated, interest_aggregated): (Decimal, Decimal) = 
                self.supplier_aggregate_im
                    .values()
                    .map(|i| {
                        let rewards = i[2] + i[3];
                        let interest = i[4] + i[5];
                        (rewards, interest)
                    })
                    .fold(
                        (Decimal::ZERO, Decimal::ZERO), 
                        |(supplier_acc, interest_acc), (supplier_item, interest_item)| {
                            (supplier_acc + supplier_item, interest_acc + interest_item)
                        }
                    );

            info!("rewards_aggregated: {}", rewards_aggregated);
            info!("interest_aggregated: {}", interest_aggregated);

            /*
            The new interest earnings are not stored in a state variable, and therefore have to be calculated. 

            The new interest earnings can be calculated as following:

            1. Use the formula to calculate the pool's total liquidity:
                
                total liquidity = owner liquidity
                                    + supplier aggregated earnings (staking rewards + interest earnings)
                                    + supplier new earnings (staking rewards + interest earnings)
                                    
            2. Deduce the formula for supplier undistributed earnings from the total liquidity formula.
                This yields the following formula:
                
                supplier undistributed interest = total liquidity 
                                                    - owner liquidity 
                                                    - new staking rewards
                                                    - aggregated staking rewards
                                                    - aggregated interest earnings;

            3. Divide the new interest earning by 2, as 50% is allocated to the supplier and 50% to the owner.
            */
            
            let interest_new: Decimal =
                (total_pool - owner_liquidity - rewards_new - rewards_aggregated - interest_aggregated) / dec!("2");

            info!("interest_new: {}", interest_new);

            // add 50% of the new interest to the owner's liquidity
            self.owner_liquidity += interest_new;

            // The new rewards and interest have to be allocated to each each box in the aggregate index map
            // This function loops over all entries of the index map to apply this allocation
            for i in self.supplier_aggregate_im.values_mut() {

                // New rewards are allocated based on relative LSU size of the box compared to the pool
                
                // Determine box total LSU
                let box_lsu = i[1];

                info!("box_lsu: {}", box_lsu);

                // Determine supplier's LSU stake relative to the pool's total LSU
                let box_relative_lsu_stake: Decimal = box_lsu / total_lsu;

                info!("box_relative_lsu_stake: {}", box_relative_lsu_stake);

                // New interest earnings are allocated based on relative XRD size of the box compared to the pool
                
                // Determine box distributed rewards
                let box_rewards = i[2];

                info!("box_rewards: {}", box_rewards);

                // Determine supplier's XRD stake relative to the distributed earnings
                let box_relative_xrd_stake: Decimal = if rewards_aggregated != Decimal::ZERO {
                    box_rewards / rewards_aggregated
                } else {
                    // Handle the case where `supplier_distributed_interest` is zero
                    // Assign a default value (`supplier_relative_lsu_stake`)
                    box_relative_lsu_stake
                };

                info!("box_relative_xrd_stake: {}", box_relative_xrd_stake);

                // Allocate new rewads to undistributed rewards value
                i[3] += box_relative_lsu_stake * rewards_new;

                info!("i[3]: {}", i[3]);

                // Allocate new interest earnings to undistributed interest value
                i[5] += box_relative_xrd_stake * interest_new;

                info!("i[5]: {}", i[5]);
            }

            // As new rewards are allocated, the state variable has to be reset to 0
            self.rewards_liquidity = Decimal::ZERO;
        }

        // Method updating the individual/partitioned key value store.
        // This method updates the individual suppliers' info in a single box.
        // Only a single LSU deposit or withdrawal is permitted at a time, an event as such will only affect a single box.
        // Therefore updating only the corresponding box information is required.
        // The lazy look up function of the key value store is utilized to ensure that only the information corresponding to that box is loaded.
        // This ensures scalability and cost efficiency of the component.
        pub fn update_supplier_kvs(&mut self, box_nr: u64) {

            info!("Pool liquidity: {} XRD", self.liquidity_pool_vault.amount());
            info!("Owner liquidity: {} XRD", self.owner_liquidity);

            // Update the suppliers indexmap before allocating earnings to the individual/partitioned key value store
            self.update_aggregate_im();

            // Determine 'total liquidity'
            let total_liquidity: Decimal = self.liquidity_pool_vault.amount();

            info!("Total pool liquidity: {} XRD", total_liquidity);

            // Determine 'owner liquidity'
            let owner_liquidity: Decimal = self.owner_liquidity;

            info!("Total owner's liquidity: {} XRD", owner_liquidity);

            // Determine various values and log them in one go
            let (
                box_lsu,
                box_distributed_rewards,
                box_undistributed_rewards,
                box_distributed_interest,
                box_undistributed_interest,
            ): (
                Decimal,
                Decimal,
                Decimal,
                Decimal,
                Decimal,
            ) = {
                let supplier_aggregate = self.supplier_aggregate_im.get(&box_nr).unwrap();
                (
                    supplier_aggregate[1],
                    supplier_aggregate[2],
                    supplier_aggregate[3],
                    supplier_aggregate[4],
                    supplier_aggregate[5],
                )
            };

            info!("Box LSU: {} XRD", box_lsu);
            info!("Box distributed rewards: {} XRD", box_distributed_rewards);
            info!("Box undistributed rewards: {} XRD", box_undistributed_rewards);
            info!("Box distributed interest: {} XRD", box_distributed_interest);
            info!("Box undistributed interest: {} XRD", box_undistributed_interest);
            
            // Loop over all entries in the indexmap to update the information
            for i in self.supplier_partitioned_kvs.get_mut(&box_nr).unwrap().values_mut() {

                // Undistributed rewards are allocated based on relative LSU size of the supplier compared to the box
 
                // Determine supplier's LSU stake
                let supplier_lsu = i[0];

                // Determine supplier's LSU stake relative to the pool's total LSU
                let supplier_relative_lsu_stake = supplier_lsu / box_lsu;

                // Undistributed interest earnings are allocated based on relative XRD size of the supplier compared to the box

                // Determine supplier's XRD stake
                let supplier_rewards = i[1] + i[2];

                // Determine supplier's XRD stake relative to the distributed earnings
                let supplier_relative_xrd_stake = if box_distributed_interest != Decimal::ZERO {
                    supplier_rewards / box_distributed_rewards
                } else {
                    // Handle the case where `supplier_distributed_interest` is zero
                    // Assign a default value (`supplier_relative_lsu_stake`)
                    supplier_relative_lsu_stake
                };

                // Distribute the new staking rewards based on the staker's LSU relative to the pool's total LSU
                i[1] += box_undistributed_rewards * supplier_relative_lsu_stake;

                // Distribute the new interest earnings based on the staker's XRD relative to the pool's total XRD
                i[2] += box_undistributed_interest * supplier_relative_xrd_stake;
            }

            // Save the index map key-value pair corresponding to the box
            let entry = self.supplier_aggregate_im.get_mut(&box_nr).unwrap();

            // Update the aggregate index map's box values according to the distributed rewards and interest earnings
            
            //  e.g. undistributed rewards are added to distributed rewards and undistributed rewards are reset to zero.
            entry[2] += box_undistributed_rewards;
            entry[3] = Decimal::ZERO;
            //  Same applies to the interest values
            entry[4] += box_undistributed_interest;
            entry[5] = Decimal::ZERO;

            debug!("Aggregate IndexMap: {:?}", self.supplier_aggregate_im);

            let epoch: Epoch = Runtime::current_epoch();

            Runtime::emit_event(
                UpdateIndexmapEvent {
                    epoch: epoch,
                }
            );
        }

        pub fn update_interest_rate(&mut self, interest_rate: Decimal) {
            // Ensure interest rate is larger than 0
            assert!(
                interest_rate >= Decimal::ZERO,
                "Please provide an interest rate larger than 0"
            );

            // Log the interest rate before and after change
            info!("Interest rate before change: {}", self.interest_rate);

            self.interest_rate = interest_rate;

            info!("Interest rate after change: {}", self.interest_rate);

            Runtime::emit_event(
                UpdateInterestRateEvent {
                    ir: interest_rate,
                }
            );
        }

        pub fn update_box_size(&mut self, amount: u64) {
            assert!(amount > 0, "Please provide a number larger than 0");
            assert!(amount < 250, "Please provide a map size smaller than 250");

            self.box_size = amount;
        }

        pub fn deposit_validator_owner(&mut self, validator_owner: Bucket) {

            assert_eq!(validator_owner.resource_address(), self.validator_owner_vault.resource_address(),
                        "Please provide a validator node ownership token");

            self.validator_owner_vault.put(validator_owner);
        }

        pub fn withdraw_validator_owner(&mut self) -> Bucket {

            let validator_owner = self.validator_owner_vault.take_all();

            validator_owner
        }

        pub fn start_unlock_owner_stake_units(
            &mut self, 
            requested_stake_unit_amount: Decimal,
            mut validator: Global<Validator>,
            non_fungible_local_id: NonFungibleLocalId
        ) {
            // Create a mutable IndexSet
            let mut index_set: IndexSet<NonFungibleLocalId> = IndexSet::new();

            index_set.insert(non_fungible_local_id); 

            self.validator_owner_vault.as_non_fungible().authorize_with_non_fungibles(
                &index_set,
                || {
                    validator.start_unlock_owner_stake_units(requested_stake_unit_amount);
                })
        }

        pub fn finish_unlock_owner_stake_units(
            &mut self, 
            mut validator: Global<Validator>,
            non_fungible_local_id: NonFungibleLocalId
        ) {

            // Create a mutable IndexSet
            let mut index_set: IndexSet<NonFungibleLocalId> = IndexSet::new();

            index_set.insert(non_fungible_local_id); 

            let lsu_bucket: Bucket = 
                self.validator_owner_vault.as_non_fungible().authorize_with_non_fungibles(
                    &index_set,
                    || {
                        let bucket = validator.finish_unlock_owner_stake_units();

                        bucket
                    }
                );
            
            self.unstaking_lsu_vault.put(lsu_bucket);     
        }

        pub fn unstake(
            &mut self, 
            mut validator: Global<Validator>,
        ) {
            let stake_unit_bucket: Bucket = self.unstaking_lsu_vault.take_all();

            let nft_bucket: Bucket = validator.unstake(stake_unit_bucket);

            self.unstaking_nft_vault.put(nft_bucket);   
        }

        pub fn claim_xrd(
            &mut self, 
            mut validator: Global<Validator>,
        ) {
            // NFT vaults work on a 'first in first out' basis
            // which entails that the unstake activity that is most likely to being finished
            // can be extracted by simply taking the first nft out of the vault
            let unstake_nft_bucket: Bucket = self.unstaking_nft_vault.take(dec!("1"));

            let xrd_bucket: Bucket = validator.claim_xrd(unstake_nft_bucket);

            self.rewards_liquidity += xrd_bucket.amount();

            self.liquidity_pool_vault.put(xrd_bucket);
        }
    }
}