use radix_engine_common::{ScryptoEvent, ScryptoSbor};
use scrypto::prelude::*;

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct LsuDepositEvent {
    pub box_nr: u64,
    pub nft_id: NonFungibleLocalId,
    pub lsu_amount: Decimal,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct LsuWithdrawEvent {
    pub box_nr: u64,
    pub nft_id: NonFungibleLocalId,
    pub lsu_amount: Decimal,
    pub staking_rewards: Decimal,
    pub interest_earnings: Decimal,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct UpdateIndexmapEvent {
    pub epoch: Epoch,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct UpdateInterestRateEvent {
    pub ir: Decimal,
}
