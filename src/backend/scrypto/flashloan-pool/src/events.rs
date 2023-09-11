use scrypto::prelude::*;
use radix_engine_common::{ScryptoEvent, ScryptoSbor};

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct DepositEvent {
    pub lsu_amount_deposited: Decimal,
    pub nft_id_minted: NonFungibleLocalId,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct WithdrawEvent {
    pub lsu_amount_withdrawn: Decimal,
    pub staking_rewards_withdrawn: Decimal,
    pub interest_earnings_withdrawn: Decimal,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct UpdateIndexmapEvent {
    pub epoch: Epoch,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct UpdateInterestRateEvent {
    pub ir: Decimal,
}