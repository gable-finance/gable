mod events;
mod nft_data;
mod tokens;

use events::*;
use nft_data::*;
use scrypto::prelude::*;

#[blueprint]
#[events(
    LsuDepositEvent,
    LsuWithdrawEvent,
    UpdateIndexmapEvent,
    UpdateInterestRateEvent
)]
#[types(u64, IndexMap<NonFungibleLocalId, Vec<Decimal>>, AmountDue, LiquiditySupplier)]
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
        // vault storing the validator owner badge
        validator_owner_vault: Vault,
        // vault storing the unstaking lsu's
        unstaking_lsu_vault: Vault,
        // vault storing unstaking nft
        unstaking_nft_vault: Vault,
        // reference to transient token
        transient_token: ResourceManager,
        // interest rate
        interest_rate: Decimal,
        // map dize
        box_size: u64,
        // ordered nft local id vec
        nft_vec: Vec<NonFungibleLocalId>,
    }

    impl Flashloanpool {
        pub fn instantiate_flashloan_pool(
            owner_badge: Bucket,
            validator_owner: Bucket,
            lsu_address: ResourceAddress,
            unstake_nft_address: ResourceAddress,
        ) -> (Bucket, FungibleBucket, Global<Flashloanpool>) {
            let (address_reservation, component_address) =
                Runtime::allocate_component_address(Flashloanpool::blueprint_id());

            // Provision admin badge
            let admin_badge: FungibleBucket =
                tokens::provision_admin_badge(owner_badge.resource_address());

            // Provision transient token
            let transient_token: ResourceManager = tokens::provision_transient_token(
                owner_badge.resource_address(),
                component_address,
            );

            // Provision pool nft
            let pool_nft: ResourceManager =
                tokens::provision_pool_nft(owner_badge.resource_address(), component_address);

            let flashloan_component: Global<Flashloanpool> = Self {
                liquidity_pool_vault: Vault::new(XRD),
                owner_badge_address: owner_badge.resource_address(),
                admin_badge_address: admin_badge.resource_address(),
                owner_liquidity: Decimal::ZERO,
                supplier_aggregate_im: IndexMap::new(),
                supplier_partitioned_kvs: KeyValueStore::new_with_registered_type(),
                pool_nft,
                pool_nft_nr: 0,
                lsu_vault: Vault::new(lsu_address),
                rewards_liquidity: Decimal::ZERO,
                validator_owner_vault: Vault::with_bucket(validator_owner),
                unstaking_lsu_vault: Vault::new(lsu_address),
                unstaking_nft_vault: Vault::new(unstake_nft_address),
                interest_rate: Decimal::ZERO,
                transient_token,
                box_size: 250,
                nft_vec: Vec::new(),
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::Fixed(rule!(require(
                owner_badge.resource_address()
            ))))
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
                    "name" => "Gable: Flash Loan Pool", locked;
                    "description" =>
                        "Official Gable 'XRD flash loan pool' component that
                        (1) offers a liquidity pool that collects XRD from staking rewards,
                        and (2) issues flash loans from the pool."
                        , locked;
                    "tags" => [
                        "Gable",
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
                    royalty_setter => rule!(deny_all);
                    royalty_setter_updater => rule!(deny_all);
                    royalty_locker => rule!(deny_all);
                    royalty_locker_updater => rule!(deny_all);
                    royalty_claimer => rule!(deny_all);
                    royalty_claimer_updater => rule!(deny_all);
                },
                init {
                    get_flashloan => Free, locked;
                    repay_flashloan => Free, locked;
                    owner_deposit_xrd => Free, locked;
                    owner_withdraw_xrd => Free, locked;
                    deposit_lsu => Free, locked;
                    withdraw_lsu => Free, locked;
                    update_supplier_kvs => Free, locked;
                    update_interest_rate => Free, locked;
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

            (owner_badge, admin_badge, flashloan_component)
        }

        pub fn get_flashloan(&mut self, amount: Decimal) -> (Bucket, Bucket) {
            // Ensure requested amount is positive
            // and is less than the total available amount
            assert!(
                amount > Decimal::ZERO,
                "Please provide an amount larger than 0"
            );
            assert!(
                amount <= self.liquidity_pool_vault.amount(),
                "Please request a loan amount smaller than {}",
                self.liquidity_pool_vault.amount()
            );

            // Mint transient token
            let transient_token_resource_manager: ResourceManager = self.transient_token;
            let transient_token: Bucket =
                transient_token_resource_manager.mint_ruid_non_fungible(AmountDue {
                    amount,
                    interest_rate: self.interest_rate,
                });

            // Withdraw loan amount
            let loan: Bucket = self.liquidity_pool_vault.take(amount);

            // Return transient token bucket and loan bucket
            (transient_token, loan)
        }

        pub fn repay_flashloan(
            &mut self,
            mut repayment: Bucket,
            transient_token: Bucket,
        ) -> Bucket {
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

            // Extract loan terms from transient token data
            let loan_data: AmountDue = transient_token.as_non_fungible().non_fungible().data();
            let loan_amount: Decimal = loan_data.amount;
            let interest_rate: Decimal = loan_data.interest_rate;

            // Calculate amount due
            let interest_amount: Decimal = loan_amount * interest_rate;
            let repayment_amount: Decimal = loan_amount + interest_amount;

            // Ensure at least full repayment amount is offered
            assert!(
                repayment.amount() >= repayment_amount,
                "Please provide at least the full amount back"
            );

            // Deposit repayment
            self.liquidity_pool_vault
                .put(repayment.take(repayment_amount));

            // Burn transient token
            transient_token.burn();

            // Return residual
            // If no residual is applicable, an empty bucket will be returned
            repayment
        }

        pub fn owner_deposit_xrd(&mut self, deposit: Bucket) {
            // Ensure requested amount is positive
            // and is less than the total available amount
            assert!(
                deposit.amount() > Decimal::ZERO,
                "Please deposit an amount larger than 0"
            );

            assert_eq!(deposit.resource_address(), XRD, "Please deposit XRD");

            // Administer liquidity amount provided by owner
            self.owner_liquidity += deposit.amount();

            // Deposit owner liquidity
            self.liquidity_pool_vault.put(deposit);
        }

        pub fn owner_withdraw_xrd(&mut self, amount: Decimal) -> Bucket {
            // Ensure amount is positive
            assert!(
                amount > Decimal::ZERO,
                "Please withdraw an amount larger than 0"
            );

            // Update the suppliers hashmap to ensure that the new interest earnings are distributed
            // and the owner liquidity is up to date
            self.update_aggregate_im();

            // Ensure amount is less or equal to liquidity provided by owner
            assert!(
                amount <= self.owner_liquidity,
                "Please withdraw an amount smaller than or equal to {}",
                self.owner_liquidity
            );

            // Subtract withdrawn amount from owner liquidity
            self.owner_liquidity -= amount;

            // Withdraw amount
            let withdraw: Bucket = self.liquidity_pool_vault.take(amount);

            // Return bucket
            withdraw
        }

        pub fn deposit_lsu(&mut self, lsu_tokens: Bucket) -> Bucket {
            // Ensure LSU tokens corresponding to Gable's validator node are provided
            assert_eq!(
                lsu_tokens.resource_address(),
                self.lsu_vault.resource_address(),
                "Please provide liquid staking units (LSU's) generated by the Gable validator node"
            );

            // Ensure the amount of LSU's provided is greater than 500.
            // A minimum LSU amount is declared to prevent over-population of the
            // component's substate, generally referred to as a "gas exhaustion attack".
            assert!(
                lsu_tokens.amount() > dec!("500"),
                "Please provide an amount of liquid staking units (LSU's) greater than 500"
            );

            // Increase the LSU local id by 1
            self.pool_nft_nr += 1;

            // Determine variables for the vector in the supplier indexmap
            let lsu_amount: Decimal = lsu_tokens.amount() as Decimal;
            let staking_rewards: Decimal = Decimal::ZERO;
            let interest_earnings: Decimal = Decimal::ZERO;

            // Insert variables into the vector
            let nft_data: Vec<Decimal> = vec![lsu_amount, staking_rewards, interest_earnings];

            let nft_id: NonFungibleLocalId = NonFungibleLocalId::Integer(self.pool_nft_nr.into());

            // Initiate box number as 1
            let box_nr: u64;

            // Updating the aggregate index map for two possible scenarios:
            //  1. There is space available in one or more of the box's for an additional entry
            //  2. The boxes that contain the individual suppliers information are all full,
            //     e.g. the number of entries in all boxes are equal to the map's limit.
            //     Or no box exists yet, e.g. no suppliers are present at all

            let mut vacant_box = None;

            // Iterate through the index map's key-value pairs to determine the applicable scenario
            for (existing_box_nr, values) in &self.supplier_aggregate_im {
                // Check if any Vec is not empty and satisfies your condition
                if values
                    .first()
                    .is_some_and(|suppliers_in_box| *suppliers_in_box < self.box_size.into())
                {
                    vacant_box = Some(*existing_box_nr);

                    // Update existing supplier's info before adding a new supplier
                    // to ensure that rewards and interest are distributed to existing suppliers
                    // before a new supplier is added.
                    self.update_supplier_kvs(*existing_box_nr);

                    break;
                }
            }

            match vacant_box {
                Some(existing_box_nr) => {
                    // Increase the box's number of suppliers by 1 new supplier
                    self.supplier_aggregate_im
                        .get_mut(&existing_box_nr)
                        .unwrap()[0] += 1;
                    // Increase the box's lsu amount by the supplied amount
                    self.supplier_aggregate_im
                        .get_mut(&existing_box_nr)
                        .unwrap()[1] += lsu_tokens.amount();
                    // Add new supplier to the box
                    self.supplier_partitioned_kvs
                        .get_mut(&existing_box_nr)
                        .unwrap()
                        .insert(nft_id.clone(), nft_data.clone());
                    // Store the existing_box_nr outside of this scope
                    box_nr = existing_box_nr;
                }
                None => {
                    // Scenario 2: In case that all boxes are full or no box exists, a new box has to be inserted

                    // Increment the new_key by one for the new key-value pair
                    box_nr = self.supplier_aggregate_im.keys().max().unwrap_or(&0) + 1;

                    // Update the aggregate IndexMap to ensure that rewards and interest is distributed
                    // to existing boxes before a new box is created
                    self.update_aggregate_im();

                    // Create a new vector for the new box
                    let new_vec: Vec<Decimal> = vec![
                        dec!("1"),
                        lsu_tokens.amount(),
                        Decimal::ZERO,
                        Decimal::ZERO,
                        Decimal::ZERO,
                        Decimal::ZERO,
                    ];

                    // Insert the new box into the aggregate IndexMap
                    self.supplier_aggregate_im.insert(box_nr, new_vec);

                    // Create a new IndexMap for the new box
                    let mut indexmap: IndexMap<NonFungibleLocalId, Vec<Decimal>> = IndexMap::new();
                    indexmap.insert(nft_id.clone(), nft_data.clone());

                    // If none of the key-value pairs satisfy the condition, create a new key-value pair
                    self.supplier_partitioned_kvs.insert(box_nr, indexmap);

                    // Insert the new supplier data into the new box
                    self.supplier_partitioned_kvs
                        .get_mut(&box_nr)
                        .unwrap()
                        .insert(nft_id.clone(), nft_data);
                }
            }

            // Mint an NFT containing the deposited vector <box number, lsu amount>
            let lsu_nft_resource_manager = self.pool_nft;

            let pool_nft: Bucket = lsu_nft_resource_manager.mint_non_fungible(
                &NonFungibleLocalId::Integer(self.pool_nft_nr.into()),
                LiquiditySupplier {
                    box_nr,
                    lsu_amount: lsu_tokens.amount(),
                },
            );

            // Put provided LSU tokens in the LSU vault
            self.lsu_vault.put(lsu_tokens);

            Runtime::emit_event(LsuDepositEvent {
                box_nr,
                nft_id,
                lsu_amount,
            });

            // Return NFT as proof of LSU deposit to the user
            pool_nft
        }

        pub fn withdraw_lsu(&mut self, pool_nft: Bucket) -> (Bucket, Bucket) {
            // Ensure LSU NFT is provided
            assert_eq!(
                pool_nft.resource_address(),
                self.pool_nft.address(),
                "Please provide the proof of supply (Pool NFT)"
            );

            // Ensure 1 LSU NFT is provided
            assert_eq!(pool_nft.amount(), dec!("1"), "Please provide only one NFT");

            // Get the local id of the provided NFT, which resembles the key in the supplier indexmap
            let pool_nft_nr = pool_nft.as_non_fungible().non_fungible_local_id();

            // Extract loan terms from transient token data
            let pool_nft_data: LiquiditySupplier = pool_nft.as_non_fungible().non_fungible().data();

            let pool_nft_box_nr: u64 = pool_nft_data.box_nr;

            self.update_supplier_kvs(pool_nft_box_nr);

            let key_value_pair: Vec<Decimal> = self
                .supplier_partitioned_kvs
                .get(&pool_nft_box_nr)
                .unwrap()
                .get(&pool_nft_nr)
                .unwrap()
                .to_vec();

            // Withdraw entitled LSU's and earnings from vaults and return as a bucket
            let lsu_bucket: Bucket = self.lsu_vault.take(key_value_pair[0]);
            let staking_rewards: Decimal = key_value_pair[1];
            let interest_earnings: Decimal = key_value_pair[2];
            let earnings: Decimal = staking_rewards + interest_earnings;
            let earnings_bucket: Bucket = self.liquidity_pool_vault.take(earnings);

            // Remove the supplier's entry from the supplier indexmap
            self.supplier_partitioned_kvs
                .get_mut(&pool_nft_box_nr)
                .unwrap()
                .remove(&pool_nft_nr);

            let im_value = self
                .supplier_aggregate_im
                .get_mut(&pool_nft_box_nr)
                .unwrap();

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

            Runtime::emit_event(LsuWithdrawEvent {
                box_nr: pool_nft_box_nr,
                nft_id: pool_nft_nr,
                lsu_amount: lsu_bucket.amount(),
                staking_rewards,
                interest_earnings,
            });

            // Return LSU's and rewards to the user
            (lsu_bucket, earnings_bucket)
        }

        fn calculate_aggregated_rewards_and_interest(&self) -> (Decimal, Decimal) {
            // calculate the total, already aggregated, rewards and interest
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
                    },
                )
        }

        fn calculate_interest_new_divided(
            &self,
            total_pool: Decimal,
            owner_liquidity: Decimal,
            rewards_new: Decimal,
            rewards_aggregated: Decimal,
            interest_aggregated: Decimal,
        ) -> Decimal {
            /*
            Most contract data is stored in state variables - except for the new (non-distributed) interest earnings.
            This is an unknown that needs to be calculated dynamically.

            The new interest earnings can be calculated as following:

            1. Take the formula to calculate the pool's total liquidity:

                total liquidity = owner liquidity
                                    + supplier aggregated earnings (staking rewards + interest earnings)
                                    + supplier non-aggregated (new) earnings (staking rewards + interest earnings);

            2. Deduce the formula for supplier undistributed earnings from the total liquidity formula.
                This yields the following formula:

                new interest = total liquidity
                                - owner liquidity
                                - new staking rewards
                                - aggregated staking rewards
                                - aggregated interest earnings;

            3. Divide the new interest earnings by 2, as 50% is allocated to the supplier and 50% to the owner.

                new divided interest = new interest / 2
            */

            (total_pool - owner_liquidity - rewards_new - rewards_aggregated - interest_aggregated)
                / 2
        }

        fn allocate_aggregate_rewards_and_interest(
            &mut self,
            // supplier_aggregate_im: &mut IndexMap<KeyType, ValueType>,
            rewards_new: Decimal,
            interest_new_divided: Decimal,
            rewards_aggregated: Decimal,
            total_lsu: Decimal,
        ) {
            // Loop over the aggregate index map to allocate new rewards and interest
            for i in self.supplier_aggregate_im.values_mut() {
                // Allocate new rewards based on relative LSU size of the box compared to the pool
                let box_lsu = i[1];

                // Calculate the box's relative lsu stake compared to the total contract.
                //
                // First of all, ensure that the contract's total LSU is greater than 0.
                // Else overwrite the box's relative LSU to 0, to prevent the contract from breaking.
                let box_relative_lsu_stake: Decimal = if total_lsu > Decimal::ZERO {
                    // Second of all, ensure that the box's LSU stake is larger than 0.
                    // Else overwrite the box's relative LSU to 0, to prevent the contract from breaking.
                    if box_lsu > Decimal::ZERO {
                        box_lsu / total_lsu
                    } else {
                        Decimal::ZERO
                    }
                } else {
                    Decimal::ZERO
                };

                // Allocate new interest earnings based on relative XRD size of the box compared to the pool
                // XRD size of the box is equal to the aggregated distributed and non-distributed rewards
                let box_rewards = i[2] + i[3];

                // Calculate the box's relative xrd stake compared to the total contract.
                //
                // First of all, ensure that the contract's total aggregated rewards is greater than 0.
                //
                // This can happen in two cases:
                //  1. for instance at instantiation of the contract
                //  2. in the rare case that all suppliers withdraw
                //
                // In this case the relative LSU stake is substituted for the relative XRD stake to kickstart
                // the aggregation again.
                let box_relative_xrd_stake: Decimal = if rewards_aggregated > Decimal::ZERO {
                    // Second of all, ensure that the box's LSU stake is larger than 0.
                    // Else overwrite the box's relative LSU to 0, to prevent the contract from breaking.
                    if box_rewards > Decimal::ZERO {
                        box_rewards / rewards_aggregated
                    } else {
                        Decimal::ZERO
                    }
                } else {
                    box_relative_lsu_stake
                };

                // Finally, allocate both new rewards and interest to the box's 'non-distributed' variables.
                i[3] += box_relative_lsu_stake * rewards_new;
                i[5] += box_relative_xrd_stake * interest_new_divided;
            }
        }

        // Method updating the aggregate index map
        fn update_aggregate_im(&mut self) {
            // extract environment values
            let total_pool = self.liquidity_pool_vault.amount();
            let total_lsu = self.lsu_vault.amount();
            let owner_liquidity = self.owner_liquidity;
            let rewards_new = self.rewards_liquidity;

            // Assert in case that the owner liquidity surpassess the contract's total liquidity
            assert!(
                total_pool >= owner_liquidity,
                "owner liquidity: {}, total pool liquidity: {} => The owner liquidity is not allowed to surpass the total liquidity",
                    owner_liquidity, total_pool
            );

            let (rewards_aggregated, interest_aggregated): (Decimal, Decimal) =
                self.calculate_aggregated_rewards_and_interest();

            let interest_new_divided = self.calculate_interest_new_divided(
                total_pool,
                owner_liquidity,
                rewards_new,
                rewards_aggregated,
                interest_aggregated,
            );

            assert!(
                interest_new_divided >= Decimal::ZERO,
                "Interest new = {}. The method is aborted as the interest new is not allowed to be negative.",
                interest_new_divided
            );

            // add 50% of the new interest to the owner's liquidity
            self.owner_liquidity += interest_new_divided;

            // Allocate new rewards and interest
            if !self.supplier_aggregate_im.is_empty() {
                self.allocate_aggregate_rewards_and_interest(
                    rewards_new,
                    interest_new_divided,
                    rewards_aggregated,
                    total_lsu,
                );
                self.rewards_liquidity = Decimal::ZERO;
            }
        }

        fn extract_box_values(&self, box_nr: u64) -> (Decimal, Decimal, Decimal, Decimal, Decimal) {
            // Determine various values and log them in one go
            let supplier_aggregate = self.supplier_aggregate_im.get(&box_nr).unwrap();

            (
                supplier_aggregate[1],
                supplier_aggregate[2],
                supplier_aggregate[3],
                supplier_aggregate[4],
                supplier_aggregate[5],
            )
        }

        fn allocate_individual_rewards_interest(
            &mut self,
            box_nr: u64,
            box_lsu: Decimal,
            box_distributed_rewards: Decimal,
            box_undistributed_rewards: Decimal,
            box_undistributed_interest: Decimal,
        ) {
            // Loop over all entries in the indexmap to update the information
            for i in self
                .supplier_partitioned_kvs
                .get_mut(&box_nr)
                .unwrap()
                .values_mut()
            {
                // Undistributed rewards are allocated based on relative LSU size of the supplier compared to the box

                // Determine supplier's LSU stake
                let supplier_lsu = i[0];

                if supplier_lsu < Decimal::ZERO {
                    continue;
                }

                // Determine supplier's LSU stake relative to the pool's total LSU
                let supplier_relative_lsu_stake = supplier_lsu / box_lsu;

                // Undistributed interest earnings are allocated based on relative XRD size of the supplier compared to the box

                // Determine supplier's XRD stake
                let supplier_rewards = i[1] + i[2];

                // Determine supplier's XRD stake relative to the distributed earnings
                // FIX 3: changed condition from box_distributed_interest to box_distributed_rewards
                //  As the box_distributed_rewards is applicable in this scenario.
                let supplier_relative_xrd_stake = if box_distributed_rewards > Decimal::ZERO {
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
        }

        // Method updating the individual/partitioned key value store.
        // This method updates the individual suppliers' info in a single box.
        // Only a single LSU deposit or withdrawal is permitted at a time, an event as such will only affect a single box.
        // Therefore updating only the corresponding box information is required.
        // The lazy look up function of the key value store is utilized to ensure that only the information corresponding to that box is loaded.
        // This ensures scalability and cost efficiency of the component.
        pub fn update_supplier_kvs(&mut self, box_nr: u64) {
            // Update the suppliers indexmap before allocating earnings to the individual/partitioned key value store
            self.update_aggregate_im();

            // Determine various values and log them in one go
            let (
                box_lsu,
                box_distributed_rewards,
                box_undistributed_rewards,
                _box_distributed_interest,
                box_undistributed_interest,
            ): (Decimal, Decimal, Decimal, Decimal, Decimal) = self.extract_box_values(box_nr);

            assert!(
                box_lsu > Decimal::ZERO,
                "Box LSU = {}. Asserted as box LSU amount has to be larger than 0.",
                box_lsu
            );

            // allocate undistributed rewards and interest to individual suppliers
            self.allocate_individual_rewards_interest(
                box_nr,
                box_lsu,
                box_distributed_rewards,
                box_undistributed_rewards,
                box_undistributed_interest,
            );

            // Update the aggregate index map's box values:
            // 1. add undistributed rewards and interest to distributed rewards and interest
            // 2. reset the undistributed rewards and interest to 0
            let entry = self.supplier_aggregate_im.get_mut(&box_nr).unwrap();
            //  e.g. undistributed rewards are added to distributed rewards and undistributed rewards are reset to zero.
            entry[2] += box_undistributed_rewards;
            entry[3] = Decimal::ZERO;
            //  Same applies to the interest values
            entry[4] += box_undistributed_interest;
            entry[5] = Decimal::ZERO;

            let epoch: Epoch = Runtime::current_epoch();

            Runtime::emit_event(UpdateIndexmapEvent { epoch });
        }

        pub fn update_interest_rate(&mut self, interest_rate: Decimal) {
            // Ensure interest rate is larger than 0%
            assert!(
                interest_rate >= Decimal::ZERO,
                "Please provide an interest rate larger than or equal to 0%"
            );

            // Ensure interest rate is smaller than 10%
            assert!(
                interest_rate <= dec!("0.1"),
                "Please provide an interest rate smaller than or equal to 10%"
            );

            self.interest_rate = interest_rate;

            Runtime::emit_event(UpdateInterestRateEvent { ir: interest_rate });
        }

        pub fn update_box_size(&mut self, amount: u64) {
            assert!(amount > 0, "Please provide a number larger than 0");
            assert!(
                amount <= 250,
                "Please provide a map size smaller than or equal to 250"
            );

            self.box_size = amount;
        }

        pub fn deposit_validator_owner(&mut self, validator_owner: Bucket) {
            assert_eq!(
                validator_owner.resource_address(),
                self.validator_owner_vault.resource_address(),
                "Please provide a validator node ownership token"
            );

            self.validator_owner_vault.put(validator_owner);
        }

        pub fn withdraw_validator_owner(&mut self) -> Bucket {
            self.validator_owner_vault.take_all()
        }

        pub fn start_unlock_owner_stake_units(
            &mut self,
            requested_stake_unit_amount: Decimal,
            mut validator: Global<Validator>,
            non_fungible_local_id: NonFungibleLocalId,
        ) {
            // Create a mutable IndexSet
            let mut index_set: IndexSet<NonFungibleLocalId> = IndexSet::new();

            index_set.insert(non_fungible_local_id);

            self.validator_owner_vault
                .as_non_fungible()
                .authorize_with_non_fungibles(&index_set, || {
                    validator.start_unlock_owner_stake_units(requested_stake_unit_amount);
                })
        }

        pub fn finish_unlock_owner_stake_units(
            &mut self,
            mut validator: Global<Validator>,
            non_fungible_local_id: NonFungibleLocalId,
        ) {
            // Create a mutable IndexSet
            let mut index_set: IndexSet<NonFungibleLocalId> = IndexSet::new();

            index_set.insert(non_fungible_local_id);

            let lsu_bucket: Bucket = self
                .validator_owner_vault
                .as_non_fungible()
                .authorize_with_non_fungibles(&index_set, || {
                    validator.finish_unlock_owner_stake_units()
                });

            self.unstaking_lsu_vault.put(lsu_bucket);
        }

        pub fn unstake(&mut self, mut validator: Global<Validator>) {
            let stake_unit_bucket: Bucket = self.unstaking_lsu_vault.take_all();

            let nft_bucket: Bucket = validator.unstake(stake_unit_bucket);

            let nft_id = nft_bucket.as_non_fungible().non_fungible_local_id();

            self.nft_vec.push(nft_id);

            self.unstaking_nft_vault.put(nft_bucket);
        }

        pub fn claim_xrd(&mut self, mut validator: Global<Validator>) {
            // Remove the first entry (pop from the front)
            let nft_id: NonFungibleLocalId = self.nft_vec.remove(0);

            let unstake_nft_bucket: Bucket = self
                .unstaking_nft_vault
                .as_non_fungible()
                .take_non_fungible(&nft_id)
                .into();

            let xrd_bucket: Bucket = validator.claim_xrd(unstake_nft_bucket);

            self.rewards_liquidity += xrd_bucket.amount();

            self.liquidity_pool_vault.put(xrd_bucket);
        }
    }
}
