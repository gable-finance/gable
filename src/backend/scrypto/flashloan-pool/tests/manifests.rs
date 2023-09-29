
use scrypto::prelude::*;
use scrypto_unit::*;
use transaction::builder::ManifestBuilder;
use radix_engine::transaction::TransactionReceipt;

pub fn create_fungible(
    test_runner: &mut DefaultTestRunner,
    account_component: ComponentAddress,
    public_key: Secp256k1PublicKey,
) -> ResourceAddress {
    // Create the manifest for badge creation
    let manifest = ManifestBuilder::new()
        .create_fungible_resource(
            OwnerRole::None,
            false,
            0,
            Default::default(),
            Default::default(),
            Some(1u64.into()),
        )
        .deposit_batch(account_component)
        .build();

    // Execute the manifest for badge creation
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    let fungible: ResourceAddress = receipt.expect_commit(true).new_resource_addresses()[0];

    fungible
}

pub fn create_non_fungible(
    test_runner: &mut DefaultTestRunner,
    account_component: ComponentAddress,
    public_key: Secp256k1PublicKey,
) -> ResourceAddress {
    // Create the manifest for badge creation
    let manifest = ManifestBuilder::new()
        .create_non_fungible_resource(
            OwnerRole::None,
            NonFungibleIdType::Integer,
            false,
            Default::default(),
            Default::default(),
            Some(btreemap!(
                NonFungibleLocalId::integer(1) => (),
            )),
        )
        .deposit_batch(account_component)
        .build();

    // Execute the manifest for badge creation
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    let non_fungible: ResourceAddress = receipt.expect_commit(true).new_resource_addresses()[0];

    non_fungible
}

pub fn create_validator(
    test_runner: &mut DefaultTestRunner,
    account_component: ComponentAddress,
    public_key: Secp256k1PublicKey,
) -> ( 
    TransactionReceipt,
    ResourceAddress,
    BTreeSet<NonFungibleLocalId> 
){
    // Publish package
    let package_address = test_runner.compile_and_publish(this_package!());

    let key = Secp256k1PublicKey([0; 33]);

    let fee_factor = dec!("1");

    // Create the manifest for flashloan pool instantiation
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, XRD, dec!("5000"))
        .take_all_from_worktop(XRD, "xrd_bucket")
        .with_name_lookup(|builder, lookup| {
            builder.create_validator(
                key,
                fee_factor,
                lookup.bucket("xrd_bucket"),
            )
        })
        .deposit_batch(account_component)
        .build();

    // Execute the manifest for flashloan pool instantiation
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    // register the balance changes of the "create_validator" transaction
    let balance_changes = receipt.expect_commit(true).vault_balance_changes();

    // Placeholders:

    // (1) non fungible resource address
    // as the 'resource_address' has to be inititiated
    // but will be overwritten with the validator node owner non fungible address thereafter
    let mut nft_resource_address: ResourceAddress = create_non_fungible(
        test_runner, 
        account_component, 
        public_key
    );

    // (2) non fungible local id
    // as the 'local id' has to be inititiated
    // but will be overwritten with the validator node owner non fungible local id thereafter
    let mut nft_local_id = BTreeSet::from([NonFungibleLocalId::ruid([0x11; 32])]);

    // declare variables to get them in scope
    let mut mut_balance_change;

    // retrieve the inner map from the third key-value pair (assuming there is at least one)
    // from format Indexmap<ComponentAddress, Indexmap<ResourceAddress, Balancechange>>
    if let Some((_, (resource_address, balance_change))) = balance_changes.iter().nth(2) {
            // clone balance change to get remove reference
            mut_balance_change = balance_change.clone();
            // get the nft local id
            nft_local_id = mut_balance_change.added_non_fungibles().clone();
            // get the nft resource address
            nft_resource_address = resource_address.clone();
    }

    return(receipt, nft_resource_address, nft_local_id)

}

pub fn create_flashloanpool(
    test_runner: &mut DefaultTestRunner,
    account_component: ComponentAddress,
    public_key: Secp256k1PublicKey,
) -> (
    ResourceAddress,
    ComponentAddress,
    ResourceAddress,
    ResourceAddress,
    ResourceAddress,
) {
    // Publish package
    let package_address = test_runner.compile_and_publish(this_package!());

    // Create the owner badge
    let owner_badge: ResourceAddress = create_fungible(test_runner, account_component, public_key);

    let (_validator_receipt, validator_owner_address, validator_owner_local_id) = create_validator(
        test_runner, 
        account_component, 
        public_key,
    );

    // Create the manifest for flashloan pool instantiation
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, owner_badge, dec!("1"))
        .withdraw_non_fungibles_from_account(account_component, validator_owner_address, validator_owner_local_id)
        .take_all_from_worktop(owner_badge, "owner_bucket")
        .take_all_from_worktop(validator_owner_address, "validator_bucket")
        .with_name_lookup(|builder, lookup| {
            builder.call_function(
                package_address,
                "Flashloanpool",
                "instantiate_flashloan_pool",
                manifest_args!(
                    lookup.bucket("owner_bucket"), 
                    lookup.bucket("validator_bucket"), 
                    // Provide the XRD address instead of LSU & unstake NFT addresss for testing purposes
                    XRD,
                    XRD
                ),
            )
        })
        .deposit_batch(account_component)
        .build();

    // Execute the manifest for flashloan pool instantiation
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    let component_address: ComponentAddress = receipt.expect_commit(true).new_component_addresses()[0];
    let admin_badge: ResourceAddress = receipt.expect_commit(true).new_resource_addresses()[0];
    let transient: ResourceAddress = receipt.expect_commit(true).new_resource_addresses()[1];
    let nft: ResourceAddress = receipt.expect_commit(true).new_resource_addresses()[2];

    (owner_badge, component_address, admin_badge, transient, nft)
}

pub fn update_interest_rate(
    test_runner: &mut DefaultTestRunner,
    public_key: Secp256k1PublicKey,
    account_component: ComponentAddress,
    component: ComponentAddress,
    admin_badge: ResourceAddress,
    ir: Decimal,
) -> TransactionReceipt {
    // Create the manifest for updating the interest rate
    let manifest = ManifestBuilder::new()
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1"))
        .call_method(component, "update_interest_rate", manifest_args!(ir))
        .build();

    // Execute the manifest for updating the interest rate
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    receipt
}

pub fn owner_deposit_xrd(
    test_runner: &mut DefaultTestRunner,
    public_key: Secp256k1PublicKey,
    account_component: ComponentAddress,
    component: ComponentAddress,
    owner_badge: ResourceAddress,
    amount: Decimal,
) -> TransactionReceipt {
    // Create the manifest for owner depositing liquidity
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, XRD, amount)
        .create_proof_from_account_of_amount(account_component, owner_badge, dec!("1"))
        .take_all_from_worktop(XRD, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(
                component,
                "owner_deposit_xrd",
                manifest_args!(lookup.bucket("bucket1")),
            )
        })
        .build();

    // Execute the manifest for owner depositing liquidity
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    receipt
}

pub fn owner_withdraw_xrd(
    test_runner: &mut DefaultTestRunner,
    public_key: Secp256k1PublicKey,
    account_component: ComponentAddress,
    component: ComponentAddress,
    owner_badge: ResourceAddress,
    amount: Decimal,
) -> TransactionReceipt {
    // Create the manifest for owner withdrawing liquidity
    let manifest = ManifestBuilder::new()
        .create_proof_from_account_of_amount(account_component, owner_badge, dec!("1"))
        .call_method(component, "owner_withdraw_xrd", manifest_args!(amount))
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    // Execute the manifest for owner withdrawing liquidity
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    receipt
}

pub fn get_flashloan(
    test_runner: &mut DefaultTestRunner,
    public_key: Secp256k1PublicKey,
    account_component: ComponentAddress,
    component: ComponentAddress,
    amount: Decimal,
) -> TransactionReceipt {
    let manifest = ManifestBuilder::new()
    // Create the manifest for calling the flash loan
    .call_method(component, "get_flashloan", manifest_args![amount])
    .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
    .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    receipt
}

pub fn repay_flashloan(
    test_runner: &mut DefaultTestRunner,
    public_key: Secp256k1PublicKey,
    account_component: ComponentAddress,
    component: ComponentAddress,
    transient: ResourceAddress,
    amount: Decimal
) -> TransactionReceipt {
    
    // Create the manifest for calling the flash loan
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, XRD, amount)
        .withdraw_from_account(account_component, transient, dec!("1"))
        .take_all_from_worktop(XRD, "xrd_bucket")
        .take_all_from_worktop(transient, "transient_bucket")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "repay_flashloan", manifest_args!(lookup.bucket("xrd_bucket"), lookup.bucket("transient_bucket")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();
    
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    receipt
}

pub fn deposit_lsu(
    test_runner: &mut DefaultTestRunner,
    public_key: Secp256k1PublicKey,
    account_component: ComponentAddress,
    component: ComponentAddress,
    lsu_address: ResourceAddress,
    amount: Decimal
) -> TransactionReceipt {

    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, lsu_address, amount)
        .take_all_from_worktop(lsu_address, "lsu_bucket")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "deposit_lsu", manifest_args!(lookup.bucket("lsu_bucket")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();
    
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    receipt
}

pub fn withdraw_lsu(
    test_runner: &mut DefaultTestRunner,
    public_key: Secp256k1PublicKey,
    account_component: ComponentAddress,
    component: ComponentAddress,
    pool_nft: ResourceAddress,
    pool_nft_non_fungible_id: BTreeSet<NonFungibleLocalId>,
) -> TransactionReceipt {

    let manifest = ManifestBuilder::new()
        // Test the `withdraw_lsu` method (succes)

        .withdraw_non_fungibles_from_account(account_component, pool_nft, pool_nft_non_fungible_id)
        .take_all_from_worktop(pool_nft, "nft_bucket")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "withdraw_lsu", manifest_args!(lookup.bucket("nft_bucket")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    receipt

}

pub fn update_supplier_kvs(
    test_runner: &mut DefaultTestRunner,
    public_key: Secp256k1PublicKey,
    account_component: ComponentAddress,
    component: ComponentAddress,
    admin_badge: ResourceAddress,
) -> TransactionReceipt {

    let box_nr: u64 = 1;

    let manifest = ManifestBuilder::new()
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1"))
        .call_method(component, "update_supplier_kvs", manifest_args!(box_nr))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    receipt
    
}

