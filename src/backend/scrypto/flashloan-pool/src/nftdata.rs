use scrypto::prelude::*;
// use radix_engine_common::{Debug, NonFungibleData, ScryptoSbor};

#[derive(Debug, NonFungibleData, ScryptoSbor)]
pub struct AmountDue {
    amount: Decimal,
    interest_rate: Decimal,
}

#[derive(Debug, NonFungibleData, ScryptoSbor)]
pub struct LiquiditySupplier {
    lsu_amount: Decimal,
    entry_epoch: Epoch,
}