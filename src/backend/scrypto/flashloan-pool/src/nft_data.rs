use scrypto::prelude::*;

#[derive(Debug, NonFungibleData, ScryptoSbor)]
pub struct AmountDue {
    pub amount: Decimal,
    pub interest_rate: Decimal,
}

#[derive(Debug, NonFungibleData, ScryptoSbor)]
pub struct LiquiditySupplier {
    pub box_nr: u64,
    pub lsu_amount: Decimal,
}