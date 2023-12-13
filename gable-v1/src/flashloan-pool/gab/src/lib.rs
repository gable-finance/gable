use scrypto::prelude::*;

use radix_engine_common::{ScryptoEvent, ScryptoSbor};
use scrypto::prelude::*;

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct GabMinted {
    pub target_date: UtcDateTime,
    pub current_date: UtcDateTime,
    pub period: i64,
    pub gab_minted: Decimal,
    pub pass: bool
}

#[blueprint]
#[events(GabMinted)]
mod gab {

    enable_method_auth! {
        roles {
            admin => updatable_by: [OWNER];
        },
        methods {
            mint_inflation => restrict_to: [admin, OWNER];
            get_inflation => restrict_to: [OWNER];
            mint_owner => restrict_to: [OWNER];
            burn_owner => restrict_to: [OWNER];
        }
    }

    struct Gab {
        gab_vault: Vault, 
        owner_address: ResourceAddress,
        time: UtcDateTime,
        period: i64,
        initial_supply: Decimal,
        inflation: Decimal
    }

    impl Gab {

        pub fn instantiate_gab() -> (
            FungibleBucket,
            FungibleBucket,
            FungibleBucket,
            Global<Gab>
        ) {

            let (address_reservation, component_address) =
                Runtime::allocate_component_address(Gab::blueprint_id());

            let owner_badge: FungibleBucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {
                    roles {
                        metadata_setter => rule!(deny_all);
                        metadata_setter_updater => rule!(deny_all);
                        metadata_locker => rule!(deny_all);
                        metadata_locker_updater => rule!(deny_all);
                    },
                    init {
                        "name" => "Gable Owner Badge", locked;
                        "symbol" => "GO", locked;
                        "description" => "Gable owner badge", locked;
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
                .mint_initial_supply(1);

            let admin_badge: FungibleBucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {
                    roles {
                        metadata_setter => rule!(require(owner_badge.resource_address()));
                        metadata_setter_updater => rule!(deny_all);
                        metadata_locker => rule!(require(owner_badge.resource_address()));
                        metadata_locker_updater => rule!(deny_all);
                    },
                    init {
                        "name" => "GAB Token Admin Badge", updatable;
                        "symbol" => "GTA", updatable;
                        "description" => "Gable custom token 'GAB' admin badge", updatable;
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

            let gab_token: FungibleBucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(18)
                .metadata(metadata! {
                    roles {
                        metadata_setter => rule!(require(owner_badge.resource_address()));
                        metadata_setter_updater => rule!(deny_all);
                        metadata_locker => rule!(require(owner_badge.resource_address()));
                        metadata_locker_updater => rule!(deny_all);
                    },
                    init {
                        "name" => "Gable", locked;
                        "symbol" => "GAB", locked;
                        "tags" => ["DeFi", "Gable"];
                        "description" => "Gable's custom token: 'GAB'", updatable;
                        "info_url" => "https://gable.finance", updatable;
                        "dapp_definitions" => vac<"account_rdx128ku70k3nxy9q0ekcwtwucdwm5jt80xsmxnqm5pfqj2dyjswgh3rm3">, updatable;
                    }
                })
                .mint_roles(mint_roles! {
                    minter => rule!(require(global_caller(component_address)));
                    minter_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner => rule!(deny_all);
                    burner_updater => rule!(deny_all);
                })
                .withdraw_roles(withdraw_roles!{
                    withdrawer => rule!(allow_all);
                    withdrawer_updater => rule!(deny_all);
                })
                .deposit_roles(deposit_roles! {
                    depositor => rule!(allow_all);
                    depositor_updater => rule!(deny_all);
                })
                .recall_roles(recall_roles!{
                    recaller => rule!(deny_all);
                    recaller_updater => rule!(deny_all);
                })
                .freeze_roles(freeze_roles!{
                    freezer => rule!(deny_all);
                    freezer_updater => rule!(deny_all);
                })
                .mint_initial_supply(1000000000);

            // Replace these values with the desired date and time components
            let year = 2028;
            let month = 6;
            let day_of_month = 1;
            let hour = 0;
            let minute = 0;
            let second = 0;

            // Create a UtcDateTime instance
            let utc_date_time = UtcDateTime::new(year, month, day_of_month, hour, minute, second).unwrap();

            let gab_component: Global<Gab> = Self {
                    gab_vault: Vault::new(gab_token.resource_address()),
                    owner_address: owner_badge.resource_address(),
                    time: utc_date_time,
                    initial_supply: dec!("1000000000"),
                    period: 1,
                    inflation: dec!("0.01")
                }
                .instantiate()
                .prepare_to_globalize(OwnerRole::Fixed(rule!(require(
                    owner_badge.resource_address()
                ))))
                .roles(roles! {
                    admin => rule!(require(admin_badge.resource_address()));
                })
                .metadata(metadata! {
                    roles {
                        metadata_setter => rule!(require(owner_badge.resource_address()));
                        metadata_setter_updater => rule!(deny_all);
                        metadata_locker => rule!(require(owner_badge.resource_address()));
                        metadata_locker_updater => rule!(deny_all);
                    },
                    init {
                        "name" => "Gable: GAB custom token", locked;
                        "description" =>
                            "Official Gable 'GAB' component that
                            (1) mints an initial supply of 1Billion GAB, 
                            (2) facilitates 1% perpetual inflation."
                            , locked;
                        "tags" => [
                            "GAB",
                            "Gable",
                            "DeFi",
                            "Lend",
                            "Borrow",
                        ], locked;
                    }
                })
                .with_address(address_reservation)
                .globalize();
    
                (owner_badge, admin_badge, gab_token, gab_component)
        }

        pub fn mint_inflation(&mut self) {

            let target_instant: Instant = self.time.to_instant();
            let target_time: UtcDateTime = self.time;

            let current_instant: Instant = Clock::current_time_rounded_to_minutes();
            let current_time: UtcDateTime = UtcDateTime::from_instant(&current_instant).unwrap();

            // Define the time precision
            let precision = TimePrecision::Minute;  // You can change this to your desired precision

            // Check if the current time is at or after the target instant
            if Clock::current_time_is_at_or_after(target_instant, precision) {

                // Mint amount 
                let amount: Decimal = 
                    self.initial_supply * (Decimal::ONE + self.inflation).checked_powi(self.period).unwrap()
                    - self.initial_supply * (Decimal::ONE + self.inflation).checked_powi(self.period - 1).unwrap();

                // Mint transient token
                let gab_resource_manager: ResourceManager = 
                    ResourceManager::from_address(self.gab_vault.resource_address());
                let gab_bucket: Bucket = gab_resource_manager.mint(amount);
                
                // Emit event
                Runtime::emit_event(GabMinted {
                    target_date: target_time,
                    current_date: current_time,
                    period: self.period,
                    gab_minted: amount,
                    pass: true
                });

                self.period += 1;
                self.gab_vault.put(gab_bucket);

                // Replace these values with the desired date and time components
                let year = self.time.year() + 1;
                let month = self.time.month();
                let day_of_month = self.time.day_of_month();
                let hour = self.time.hour();
                let minute = self.time.minute();
                let second = self.time.second();

                self.time = UtcDateTime::new(year, month, day_of_month, hour, minute, second).unwrap();
                
            } else {

                // Emit event
                Runtime::emit_event(GabMinted {
                    target_date: target_time,
                    current_date: current_time,
                    period: self.period,
                    gab_minted: Decimal::ZERO,
                    pass: false
                });
            }
        }

        pub fn get_inflation(&mut self, amount: Decimal) -> Bucket {
            assert!(amount <= self.gab_vault.amount()
                , "Available amount ({}) is less than requested ({})"
                , self.gab_vault.amount()
                , amount
            );
            
            assert!(amount > Decimal::ZERO, "Provide an amount larger than 0");
            
            let gab_bucket: Bucket = self.gab_vault.take(amount);

            gab_bucket  
        }

        pub fn mint_owner(&mut self) -> Bucket {
            // Mint owner token
            let owner_resource_manager: ResourceManager = 
                ResourceManager::from_address(self.owner_address);
            let owner_bucket: Bucket = owner_resource_manager.mint(Decimal::ONE);

            owner_bucket
        }

        pub fn burn_owner(&mut self, owner_badge: Bucket) {

            assert_eq!(owner_badge.amount(), Decimal::ONE, "You can only burn a single batch at a time.");

            // Burn owner token
            let owner_resource_manager: ResourceManager = 
                ResourceManager::from_address(self.owner_address);
            
            owner_resource_manager.burn(owner_badge);
        }
    }
}