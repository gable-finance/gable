use crate::nft_data::{AmountDue, LiquiditySupplier};
use scrypto::prelude::*; // Use the structs as needed

// Provision fungible resource and generate admin's badge
// to support (co-)ownership
// Mintable and burnable by anyone who owns an admin's badge
pub fn provision_admin_badge(owner_badge_address: ResourceAddress) -> FungibleBucket {
    let admin_badge: FungibleBucket = ResourceBuilder::new_fungible(OwnerRole::None)
        .divisibility(DIVISIBILITY_NONE)
        .metadata(metadata! {
            init {
                "name" => "Gable FLP Admin Badge", locked;
                "symbol" => "GFA", locked;
                "description" => "Gable flash loan pool admin badge", locked;
            }
        })
        .mint_roles(mint_roles! {
            minter => rule!(require(owner_badge_address));
            minter_updater => rule!(deny_all);
        })
        .burn_roles(burn_roles! {
            burner => rule!(require(owner_badge_address));
            burner_updater => rule!(deny_all);
        })
        .mint_initial_supply(1);

    admin_badge
}

// Provision transient non-fungible resource
// to enforce flashloan repayment
pub fn provision_transient_token(
    owner_badge_address: ResourceAddress,
    component_address: ComponentAddress,
) -> ResourceManager {
    let transient_token: ResourceManager =
        ResourceBuilder::new_ruid_non_fungible::<AmountDue>(OwnerRole::None)
            .metadata(metadata! {
                roles {
                    metadata_setter => rule!(require(owner_badge_address));
                    metadata_setter_updater => rule!(deny_all);
                    metadata_locker => rule!(require(owner_badge_address));
                    metadata_locker_updater => rule!(deny_all);
                },
                init {
                    "name" => "Gable Transient Token", locked;
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

    transient_token
}

// Provision non-fungible resource
// serves as proof of supply
pub fn provision_pool_nft(
    owner_badge_address: ResourceAddress,
    component_address: ComponentAddress,
) -> ResourceManager {
    let pool_nft: ResourceManager =
        ResourceBuilder::new_integer_non_fungible::<LiquiditySupplier>(OwnerRole::None)
            .metadata(metadata! {
                roles {
                    metadata_setter => rule!(require(owner_badge_address));
                    metadata_setter_updater => rule!(deny_all);
                    metadata_locker => rule!(require(owner_badge_address));
                    metadata_locker_updater => rule!(deny_all);
                },
                init {
                    "name" => "Gable Proof of Supply", locked;
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

    pool_nft
}
