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
    lsu_amount: Decimal,
    entry_epoch: Epoch,
}

#[blueprint]
#[events(DepositEvent, WithdrawEvent, UpdateHashmapEvent, UpdateInterestRateEvent)]
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
            deposit_lsu_merge => PUBLIC;
            withdraw_lsu => PUBLIC;
            withdraw_lsu_amount => PUBLIC;
            deposit_batch => PUBLIC;
            update_supplier_hashmap => restrict_to: [admin, OWNER, component];
            update_interest_rate => restrict_to: [admin, OWNER];
            // validator_component => restrict_to: [component];
            provide_validator_owner => restrict_to: [OWNER];
            return_validator_owner => restrict_to: [OWNER];
            start_unlock_owner_stake_units => restrict_to: [admin, OWNER];
            // finish_unlock_owner_stake_units => restrict_to: [admin, OWNER];
            // unstake => restrict_to: [admin, OWNER];
            // claim_xrd => restrict_to: [admin, OWNER];
        }
    }

    // extern_blueprint! {
    //     "package_sim1p40mzz4yg6n4gefzq5teg2gsts63wmez00826p8m5eslr864fr3648",
    //     ValidatorBlueprint {
    //         fn instantiate_validator(stake_unit_bucket: Bucket, xrd_bucket: Bucket) -> Global<ValidatorBlueprint>;
    //         fn start_unlock_owner_stake_units(&mut self, requested_stake_unit_amount: Decimal);
    //         fn finish_unlock_owner_stake_units(&mut self) -> Bucket;
    //         fn unstake(&mut self, stake_unit_bucket: Bucket) -> Bucket;
    //         fn claim_xrd(&mut self, bucket: Bucket) -> Bucket;
    //     }
    // }

    struct Flashloanpool {
        // total liquidity vault
        liquidity_pool_vault: Vault, 
        // validator owner vault
        validator_owner_vault: Vault,
        // reference to the owner badge
        owner_badge_address: ResourceAddress,
        // liquidity that is supplied by the owner
        owner_liquidity: Decimal,
        // reference to the admin badge
        admin_badge_address: ResourceAddress,
        // hashmap registering suppliers
        supplier_hashmap: HashMap<NonFungibleLocalId, Vec<Decimal>>,
        // reference to 'proof of supply nft'
        pool_nft: ResourceManager,
        // nft local id number
        pool_nft_nr: u64,
        // vault storing supplier's LSU's
        lsu_vault: Vault,
        // liquidity that is supplied by staking rewards
        rewards_liquidity: Decimal,
        // liquidity that is supplied by interest earnings
        // interest_liquidity: Decimal,
        // vault storing the unstaking lsu's
        unstaking_lsu_vault: Vault,
        // vault storing unstaking nft
        unstaking_nft_vault: Vault,
        // reference to transient token
        transient_token: ResourceManager,
        // interest rate
        interest_rate: Decimal,
    }

    impl Flashloanpool {
        pub fn instantiate_flashloan_pool(owner_badge: Bucket, validator_owner: Bucket) -> (Bucket, Bucket, Global<Flashloanpool>) {
            let (address_reservation, component_address) =
                Runtime::allocate_component_address(Runtime::blueprint_id());

            // Provision fungible resource and generate admin's badge
            // to support (co-)ownership
            // Mintable and burnable by anyone who owns an admin's badge
            let admin_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
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
                liquidity_pool_vault: Vault::new(RADIX_TOKEN),
                validator_owner_vault: Vault::with_bucket(validator_owner),
                owner_badge_address: owner_badge.resource_address(),
                admin_badge_address: admin_badge.resource_address(),
                owner_liquidity: Decimal::ZERO,
                supplier_hashmap: HashMap::new(),
                pool_nft: pool_nft,
                pool_nft_nr: 0,
                lsu_vault: Vault::new(RADIX_TOKEN),
                rewards_liquidity: Decimal::ZERO,
                // interest_liquidity: Decimal::ZERO,
                unstaking_lsu_vault: Vault::new(RADIX_TOKEN),
                unstaking_nft_vault: Vault::new(RADIX_TOKEN),
                interest_rate: Decimal::ZERO,
                transient_token: transient_token,
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
                    deposit_lsu => Xrd(1.into()), locked;
                    deposit_lsu_merge =>  Xrd(1.into()), locked;
                    deposit_batch => Free, locked;
                    withdraw_lsu => Xrd(1.into()), locked; 
                    withdraw_lsu_amount => Xrd(1.into()), locked; 
                    update_supplier_hashmap => Xrd(1.into()), locked;
                    update_interest_rate => Xrd(1.into()), locked;
                    // validator_component => Free, locked;
                    provide_validator_owner => Free, locked;
                    return_validator_owner => Free, locked;
                    start_unlock_owner_stake_units => Free, locked;
                    // finish_unlock_owner_stake_units => Free, locked;
                    // unstake => Free, locked;
                    // claim_xrd => Free, locked;
                }
            })
            .with_address(address_reservation)
            .globalize();

            info!("{} admin badge is provided to user", admin_badge.amount());

            return (owner_badge, admin_badge, flashloan_component);
        }

        pub fn provide_validator_owner (&mut self, validator_owner: Bucket) {

            assert_eq!(validator_owner.resource_address(), self.validator_owner_vault.resource_address(),
                        "Please provide a validator node ownership token");

            self.validator_owner_vault.put(validator_owner);
        }

        pub fn return_validator_owner (&mut self) -> Bucket {

            let validator_owner = self.validator_owner_vault.take_all();

            validator_owner
        }

        pub fn start_unlock_owner_stake_units(
            &mut self, 
            requested_stake_unit_amount: Decimal,
            mut validator: Global<Validator>,
            non_fungible_local_id: NonFungibleLocalId
        ) {

            self.validator_owner_vault.as_non_fungible().authorize_with_non_fungibles(
                &btreeset!(non_fungible_local_id),
                || {
                validator.start_unlock_owner_stake_units(requested_stake_unit_amount);
                })
        }

        // pub fn validator_component(&mut self, validator: Global<validator>) -> Global<ValidatorBlueprint> {

        //     let validator_component: Global<ValidatorBlueprint> = global_component!(
        //         ValidatorBlueprint,
        //         "component_sim1cz8et5yv5srl909chc9x4dgav32f50rmw4mujuq2trws9xc4y73u6l"
        //     );

        //     validator_component
        // }

        // pub fn start_unlock_owner_stake_units(&mut self, requested_stake_unit_amount: Decimal) {

        //     let mut validator_component: Global<ValidatorBlueprint> = self.validator_component();

        //     validator_component.start_unlock_owner_stake_units(requested_stake_unit_amount);

        // }

        // pub fn validator_component(&mut self, validator_owner: ComponentAddress) -> Global<ValidatorOwner> {

        //     let validator_owner: Global<ValidatorBlueprint> = global_component!(
        //         ValidatorOwner,
        //         validator_owner
        //     );

        //     validator_owner
        // }

        // pub fn finish_unlock_owner_stake_units(&mut self) {

        //     let mut validator_component: Global<ValidatorBlueprint> = self.validator_component();

        //     let lsu_bucket: Bucket = 
        //         validator_component.finish_unlock_owner_stake_units();

        //     self.unstaking_lsu_vault.put(lsu_bucket);
        // }

        // pub fn unstake(&mut self) {

        //     let stake_unit_bucket: Bucket = self.unstaking_lsu_vault.take_all();

        //     let mut validator_component: Global<ValidatorBlueprint> = self.validator_component();

        //     let nft_bucket: Bucket = 
        //         validator_component.unstake(stake_unit_bucket);

        //     self.unstaking_nft_vault.put(nft_bucket);
        // }

        // pub fn claim_xrd(&mut self) {

        //     // NFT vaults work on a 'first in first out' basis
        //     // which entails that the unstake activity that is most likely to being finished
        //     // can be extracted by simply taking the first nft out of the vault
        //     let unstake_nft_bucket: Bucket = self.unstaking_nft_vault.take(dec!("1"));

        //     let mut validator_component: Global<ValidatorBlueprint> = self.validator_component();

        //     let xrd_bucket: Bucket = 
        //         validator_component.claim_xrd(unstake_nft_bucket);

        //     self.rewards_liquidity += xrd_bucket.amount();

        //     self.liquidity_pool_vault.put(xrd_bucket);
        // }

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
                repayment.resource_address() == RADIX_TOKEN,
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
        
            // Allocate the liquidity earnings
            // self.interest_liquidity += interest_amount / dec!("2");
            // self.owner_liquidity += interest_amount / dec!("2");
        
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
                RADIX_TOKEN,
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
        
            debug!("{:?}", self.supplier_hashmap);
        
            // Update the suppliers hashmap before returning earnings
            self.update_supplier_hashmap();
        
            debug!("{:?}", self.supplier_hashmap);
        
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

            // Update the suppliers hashmap (distribute earnings) before adding the current deposit to the hashmap
            debug!("{:?}", self.supplier_hashmap);
            self.update_supplier_hashmap();
            debug!("{:?}", self.supplier_hashmap);

            // Increase the LSU local id by 1
            self.pool_nft_nr += 1;

            // Get the current epoch
            let epoch: Epoch = Runtime::current_epoch();

            // Mint an NFT containing the deposited vector <lsu amount, epoch>
            let lsu_nft_resource_manager = self.pool_nft;
            let pool_nft: Bucket = lsu_nft_resource_manager.mint_non_fungible(
                &NonFungibleLocalId::Integer(self.pool_nft_nr.into()),
                LiquiditySupplier {
                    lsu_amount: lsu_tokens.amount(),
                    entry_epoch: epoch,
                },
            );

            // Determine variables for the vector in the supplier hashmap
            let lsu_amount: Decimal = lsu_tokens.amount() as Decimal;
            let staking_rewards: Decimal = Decimal::ZERO;
            let interest_earnings: Decimal = Decimal::ZERO;

            // Insert variables into the vector
            let lsu_nft_data: Vec<Decimal> = vec![lsu_amount, staking_rewards, interest_earnings];

            let lsu_nft_id: NonFungibleLocalId = NonFungibleLocalId::Integer(self.pool_nft_nr.into());

            // Insert NFT local id as key and vector as value into the supplier hashmap
            self.supplier_hashmap
                .insert(lsu_nft_id.clone(), lsu_nft_data);

            // Put provided LSU tokens in the LSU vault
            self.lsu_vault.put(lsu_tokens);

            debug!("{:?}", self.supplier_hashmap);

            Runtime::emit_event(
                DepositEvent {
                    lsu_amount_deposited: lsu_amount,
                    nft_id_minted: lsu_nft_id,
                },
            );

            // Return NFT as proof of LSU deposit to the user
            return pool_nft;
        }

        // add lsu to an existing pool nft
        pub fn deposit_lsu_merge(&mut self,  pool_nft_proof: Proof, lsu_tokens: Bucket) {

            // Make sure the provided proof is of the right resource address
            let checked_pool_nft_proof = pool_nft_proof.check(self.pool_nft.address());

            // Get the local id of the provided NFT, which resembles the key in the supplier hashmap
            let pool_nft_nr = checked_pool_nft_proof
                .as_non_fungible()
                .non_fungible_local_id();

            // Ensure LSU tokens are provided
            assert_eq!(
                lsu_tokens.resource_address(),
                self.lsu_vault.resource_address(),
                "Please provide liquids staking units (LSU's) generated by the Sundae validator node"
            );

            let lsu_amount: Decimal = lsu_tokens.amount();

            // Ensure LSU's provided is greater than zero
            assert!(
                lsu_amount > Decimal::ZERO,
                "Please provide an amount of liquids staking units (LSU's) greater than zero"
            );

            // Log the number of LSU's provided
            info!("{} LSU's are provided", lsu_amount);

            // Update the suppliers hashmap (distribute earnings) before adding the current deposit to the hashmap
            debug!("{:?}", self.supplier_hashmap);
            self.update_supplier_hashmap();
            debug!("{:?}", self.supplier_hashmap);

            // Put provided LSU tokens in the LSU vault
            self.lsu_vault.put(lsu_tokens);

            self.supplier_hashmap.get_mut(&pool_nft_nr).map(|values| {
                values[0] += lsu_amount;
            });

            debug!("{:?}", self.supplier_hashmap);
        }

        pub fn withdraw_lsu(&mut self, pool_nft: Bucket) -> (Bucket, Bucket) {
            // Ensure LSU NFT is provided
            assert_eq!(
                pool_nft.resource_address(),
                self.pool_nft.address(),
                "Please provide the proof of supply (LSU NFT) generated by the Sundae validator node"
            );

            assert_eq!(
                pool_nft.amount(),
                dec!("1"),
                "Please provide only one NFT"
            );

            // Update the suppliers hashmap (distribute earnings) before returning LSU's and XRD earnings to the user
            // This ensures that the supplier receives the correct amount of resources they are entitled to
            debug!("{:?}", self.supplier_hashmap);
            self.update_supplier_hashmap();
            debug!("{:?}", self.supplier_hashmap);

            // Get the local id of the provided NFT, which resembles the key in the supplier hashmap
            let pool_nft_nr = pool_nft
                .as_non_fungible()
                .non_fungible_local_id();

            debug!("{:?}", pool_nft_nr);

            debug!("{:?}", self.supplier_hashmap[&pool_nft_nr]);

            // Withdraw entitled LSU's and earnings from vaults and return as a bucket
            let lsu_bucket: Bucket = self.lsu_vault.take(self.supplier_hashmap[&pool_nft_nr][0]);
            let staking_rewards: Decimal = self.supplier_hashmap[&pool_nft_nr][1];
            let interest_earnings: Decimal = self.supplier_hashmap[&pool_nft_nr][2];
            let earnings: Decimal = staking_rewards + interest_earnings;
            let earnings_bucket: Bucket = self.liquidity_pool_vault.take(earnings);

            // Log the LSU's and earnings returned to the supplier
            info!(
                "{} LSU's and {} XRD is returned to the supplier",
                lsu_bucket.amount(),
                earnings
            );

            // Remove the supplier's entry from the supplier hashmap
            self.supplier_hashmap.remove(&pool_nft_nr);

            debug!("{:?}", self.supplier_hashmap);

            // Burn the provided NFT
            pool_nft.burn();

            Runtime::emit_event(
                WithdrawEvent {
                    lsu_amount_withdrawn: lsu_bucket.amount(),
                    staking_rewards_withdrawn: staking_rewards,
                    interest_earnings_withdrawn: interest_earnings
                }
            );

            // Return LSU's and rewards to the user
            return (lsu_bucket, earnings_bucket);
        }

        // withdraw lsu and earnings partially
        pub fn withdraw_lsu_amount(&mut self, pool_nft_proof: Proof, lsu_amount: Decimal) -> (Bucket, Bucket) {
            
            // Make sure the provided proof is of the right resource address
            let checked_pool_nft_proof = pool_nft_proof.check(self.pool_nft.address());

            // check if lsu amount is larger than 0
            assert!(lsu_amount > Decimal::ZERO);

            // Update the suppliers hashmap (distribute earnings) before returning LSU's and XRD earnings to the user
            // This ensures that the supplier receives the correct amount of resources they are entitled to
            debug!("{:?}", self.supplier_hashmap);
            self.update_supplier_hashmap();
            debug!("{:?}", self.supplier_hashmap);

            // Get the local id of the provided NFT, which resembles the key in the supplier hashmap
            let pool_nft_nr = checked_pool_nft_proof
                .as_non_fungible()
                .non_fungible_local_id();

            let lsu_amount_total: Decimal = self.supplier_hashmap[&pool_nft_nr][0];

            // check if lsu amount provided is smaller or equal than the entitled lsu amount
            assert!(lsu_amount < lsu_amount_total,
                "Please provide an amount smaller than {}. 
                    In case you want to withdraw all your lsu's, please make use of the 'withdraw_lsu' method", 
                self.supplier_hashmap[&pool_nft_nr][0], 
            );

            debug!("{:?}", pool_nft_nr);
            debug!("{:?}", self.supplier_hashmap[&pool_nft_nr]);

            let lsu_amount_relative = lsu_amount / lsu_amount_total;

            // If lsu_amount is Some, use the provided value to withdraw LSU's and earnings
            let lsu_bucket: Bucket = self.lsu_vault.take(lsu_amount);
            let staking_rewards: Decimal = self.supplier_hashmap[&pool_nft_nr][1] * lsu_amount_relative;
            let interest_earnings: Decimal = self.supplier_hashmap[&pool_nft_nr][2] * lsu_amount_relative;
            let earnings: Decimal = staking_rewards + interest_earnings;
            let earnings_bucket: Bucket = self.liquidity_pool_vault.take(earnings);

            // Log the LSU's and earnings returned to the supplier
            info!(
                "{} LSU's and {} XRD is returned to the supplier",
                lsu_bucket.amount(),
                earnings
            );

            self.supplier_hashmap.get_mut(&pool_nft_nr).map(|values| {
                values[0] -= lsu_amount;
                values[1] -= staking_rewards;
                values[2] -= interest_earnings;
            });

            Runtime::emit_event(
                WithdrawEvent {
                    lsu_amount_withdrawn: lsu_bucket.amount(),
                    staking_rewards_withdrawn: staking_rewards,
                    interest_earnings_withdrawn: interest_earnings
                }
            );

            // Return LSU's and rewards to the user
            return (lsu_bucket, earnings_bucket);
        
        }

        pub fn update_supplier_hashmap(&mut self) {
            // Log pool liquidity, owner liquidity, and supplier hashmap
            info!("Pool liquidity: {} XRD", self.liquidity_pool_vault.amount());
            info!("Owner liquidity: {} XRD", self.owner_liquidity);
            debug!("{:?}", self.supplier_hashmap);

            /*
            To update the supplier's hashmap, the undistributed XRD earnings need to be calculated.
            This can be accomplished by following these steps:

            1. Use the formula to calculate the pool's total liquidity:
                
                total liquidity = owner liquidity
                                    + supplier distributed earnings (staking rewards + interest earnings)
                                    + supplier undistributed earnings (staking rewards + interest earnings)
                                    
            2. Deduce the formula for supplier undistributed earnings from the total liquidity formula.
                This yields the following formula:
                
                supplier undistributed earnings = total liquidity - owner liquidity - supplier distributed earnings
            */

            // Determine 'total liquidity'
            let total_liquidity: Decimal = self.liquidity_pool_vault.amount();

            // Determine 'owner liquidity'
            let owner_liquidity: Decimal = self.owner_liquidity;

            // Determine 'supplier distributed earnings'
            // by summing the rewards in the hashmap
            let supplier_distributed_rewards: Decimal = self
                .supplier_hashmap
                .values()
                .filter_map(|i| i.get(1))
                .copied()
                .sum();

            info!("Supplier distributed rewards: {} XRD", supplier_distributed_rewards);

            let supplier_distributed_interest: Decimal = self
                .supplier_hashmap
                .values()
                .filter_map(|i| i.get(2))
                .copied()
                .sum();

            info!("Supplier distributed interest: {} XRD", supplier_distributed_interest);

            let supplier_distributed_earnings: Decimal =
                supplier_distributed_rewards + supplier_distributed_interest;

            info!("Supplier distributed earnings: {} XRD", supplier_distributed_earnings);

            // let supplier_undistributed_interest: Decimal = self.interest_liquidity;

            // info!("Supplier undistributed interest: {} XRD", supplier_undistributed_interest);

            let supplier_undistributed_rewards: Decimal = self.rewards_liquidity;

            info!("Supplier undistributed rewards: {} XRD", supplier_undistributed_rewards);

            // // Determine the 'suppliers undistributed earnings'
            // let supplier_undistributed_rewards: Decimal = total_liquidity
            //     - owner_liquidity
            //     - supplier_distributed_earnings
            //     - supplier_undistributed_interest;

            // info!("Supplier undistributed rewards: {} XRD", supplier_undistributed_rewards);

            // Determine the 'undistributed interest'
            let undistributed_interest: Decimal = total_liquidity
                - owner_liquidity
                - supplier_distributed_earnings
                - supplier_undistributed_rewards;

            info!("Undistributed interst: {} XRD", undistributed_interest);

            // divide interest earnings by 2
            // to assign equal portion to owner and supplier
            let equal_undistributed_interest: Decimal = undistributed_interest / dec!("2");

            self.owner_liquidity += equal_undistributed_interest;

            let supplier_undistributed_interest: Decimal = equal_undistributed_interest;

            // Loop over all entries in the hashmap to update the information
            for i in self.supplier_hashmap.values_mut() {
                // Determine supplier's LSU stake
                let supplier_lsu = i[0];
                // Determine supplier's XRD stake
                let supplier_xrd = i[1] + i[2];

                // Determine supplier's LSU stake relative to the pool's total LSU
                let supplier_relative_lsu_stake = supplier_lsu / self.lsu_vault.amount();

                let supplier_relative_xrd_stake = if supplier_distributed_interest != Decimal::ZERO {
                    // Determine supplier's XRD stake relative to the distributed earnings
                    supplier_xrd / supplier_distributed_earnings
                } else {
                    // Handle the case where `supplier_distributed_interest` is zero
                    // Assign a default value (`supplier_relative_lsu_stake`)
                    supplier_relative_lsu_stake
                };

                // Distribute the new staking rewards based on the staker's LSU relative to the pool's total LSU
                i[1] += supplier_undistributed_rewards * supplier_relative_lsu_stake;

                // Distribute the new interest earnings based on the staker's XRD relative to the pool's total XRD
                i[2] += supplier_undistributed_interest * supplier_relative_xrd_stake;
            }

            // self.interest_liquidity = Decimal::ZERO;

            self.rewards_liquidity = Decimal::ZERO;

            debug!("{:?}", self.supplier_hashmap);

            let epoch: Epoch = Runtime::current_epoch();

            Runtime::emit_event(
                UpdateHashmapEvent {
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

        // pub fn unlock_fees(&mut self, amount: Decimal) {
        //     // Ensure amount is larger than 0
        //     assert!(
        //         amount >= Decimal::ZERO,
        //         "Please provide an amount larger than 0"
        //     )
        // }
    }
}