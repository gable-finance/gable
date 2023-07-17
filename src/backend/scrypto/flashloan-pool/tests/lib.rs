use manifests::*;
use scrypto::prelude::*;
use scrypto_unit::*;
use transaction::builder::ManifestBuilder;

mod manifests;

#[test]
fn test_instantiater() {
    // Setup the environment
    let mut test_runner = TestRunner::builder().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (_owner_badge, _component_address, _admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);
}

#[test]
fn test_update_interest_rate() {
    // Setup the environment
    let mut test_runner = TestRunner::builder().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    let mut ir = dec!("0.05");

    // Execute update_interest_rate method test (success)
    let receipt = update_interest_rate(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        admin_badge, 
        ir
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);

    // Execute update_interest_rate method test (success)
    let receipt = update_interest_rate(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge, 
        ir
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);

    // Execute update_interest_rate method test (fail - wrong badge)
    let badge = create_fungible(
        &mut test_runner, 
        account_component, 
        public_key
    );

    let receipt = update_interest_rate(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        badge, 
        ir
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // Execute update_interest_rate method test (fail - neg amount)
    ir = dec!("-0.05");

    let receipt = update_interest_rate(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge, 
        ir
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);
}

#[test]
fn test_owner_deposit_liquidity() {
    // Setup the environment
    let mut test_runner = TestRunner::builder().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, _admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    let mut amount: Decimal = dec!("100");

    // Test the `admin_deposit_liquidity` method (fail - wrong proof)
    let badge = create_fungible(
        &mut test_runner, 
        account_component,
        public_key
    );

    let receipt = protected_deposit_xrd(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        badge, 
        amount);

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // Test the `admin_deposit_liquidity` method (fail - negative amount)
    amount = dec!("-100");
    let receipt = protected_deposit_xrd(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // Test the `admin_deposit_liquidity` method (success)
    amount = dec!("100");

    let receipt = protected_deposit_xrd(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);
}

#[test]
fn test_owner_withdraw_liquidity() {
    // Setup the environment
    let mut test_runner = TestRunner::builder().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, _admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    // put 100 XRD in the pool
    let mut amount: Decimal = dec!("100");

    let receipt = protected_deposit_xrd(
        &mut test_runner, 
        public_key,
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);

    // Test the `protected_withdraw_xrd` method (fail - negative amount)
    amount = dec!("-100");

    let receipt = protected_withdraw_xrd(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // Test the `protected_withdraw_xrd` method (fail - wrong badge)
    amount = dec!("100");

    let badge = create_fungible(
        &mut test_runner, 
        account_component, 
        public_key
    );

    let receipt = protected_withdraw_xrd(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // Test the `protected_withdraw_xrd` method (success)
    amount = dec!("100");

    let receipt = protected_withdraw_xrd(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);
}

#[test]
fn test_get_flashloan() {
    let mut test_runner = TestRunner::builder().build();
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, _admin_badge, transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    // Put 100 XRD in the vault for testing
    let amount: Decimal = dec!("100");

    let _receipt = protected_deposit_xrd(
        &mut test_runner, 
        public_key,
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    // Test the `protected_withdraw_xrd` method (fail - transient token)
    //  The stand-alone get_flashloan function is bound to fail as the transient token
    //  is not allowed to be deposited.
    //  this function should always be used in conjuntion with the repay_flashloan function
    //  that will burn the transient token - enabling the transaction to complete.
    let receipt = get_flashloan(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        amount
    );
    
    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // The following transaction uses the get_flashloan function in conjunction with other methods
    let manifest = ManifestBuilder::new()
        // Test the `get_flashloan` method (success)
        //  Call the get_loan function
        //  Call the repay_loan to burn transient token
        //  Thereafter deposit batch
        .call_method(component_address, "get_flashloan", manifest_args![dec!("100")])
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("110"))
        .take_all_from_worktop(RADIX_TOKEN, "xrd_bucket")
        .take_all_from_worktop(transient, "transient_bucket")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component_address, "repay_flashloan", manifest_args!(lookup.bucket("xrd_bucket"), lookup.bucket("transient_bucket")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);
}


#[test]
fn test_repay_flashloan() {
    let mut test_runner = TestRunner::builder().build();
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, _admin_badge, transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    let transient_replica: ResourceAddress = create_non_fungible(
        &mut test_runner, 
        account_component, 
        public_key
    );

    // Set up dependencies

    // (1) update interest rate
    let ir = dec!("0.05");

    let _receipt = update_interest_rate(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge, 
        ir
    );

    // (2) put 100 XRD in the vault for testing
    let amount: Decimal = dec!("100");

    let _receipt = protected_deposit_xrd(
        &mut test_runner, 
        public_key,
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    // test repay flash loan method
    // this method is bound to fail as long as it is not used in conjunction with the 'get_flashloan' method
    let receipt = repay_flashloan(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        transient_replica,
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // test the 'repay_flashloan' method in conjunction with the 'get_flashloan' 
    let manifest = ManifestBuilder::new()
        // Test the `repay_flashloan` method (fail)
        //  Repayed amount is 0.000000001 smaller than loan amount - should therefore fail
        //  Call the get_loan function
        //  Call the repay_loan to burn transient token
        //  Thereafter deposit batch

        .call_method(component_address, "get_flashloan", manifest_args![amount])
        .withdraw_from_account(account_component, RADIX_TOKEN, amount*ir-dec!("0.00000001"))
        .take_all_from_worktop(RADIX_TOKEN, "xrd_bucket")
        .take_all_from_worktop(transient, "transient_bucket")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component_address, "repay_flashloan", manifest_args!(lookup.bucket("xrd_bucket"), lookup.bucket("transient_bucket")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    // test the 'repay_flashloan' method in conjunction with the 'get_flashloan' 
    let manifest = ManifestBuilder::new()
        // Test the `repay_flashloan` method (succes)
        //  Repayed loan plus interest amount
        //  Call the get_loan function
        //  Call the repay_loan to burn transient token
        //  Thereafter deposit batch

        .call_method(component_address, "get_flashloan", manifest_args![amount])
        .withdraw_from_account(account_component, RADIX_TOKEN, amount*ir)
        .take_all_from_worktop(RADIX_TOKEN, "xrd_bucket")
        .take_all_from_worktop(transient, "transient_bucket")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component_address, "repay_flashloan", manifest_args!(lookup.bucket("xrd_bucket"), lookup.bucket("transient_bucket")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    println!("{:?}\n", receipt);
    receipt.expect_commit(true);
}

#[test]
fn test_staker_deposit_lsu() {

    let mut test_runner = TestRunner::builder().build();
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (_owner_badge, component_address, admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    let mut amount: Decimal = dec!("100");

    // Test the `deposit_lsu` method (succes)
    // provide valid lsu amount, and address.
    let receipt = deposit_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        RADIX_TOKEN,
        amount
    );

    println!("{:?}\n", receipt);

    // Test the `deposit_lsu` method (fail - neg LSU)
    amount = dec!("-100");

    let receipt = deposit_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        RADIX_TOKEN,
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);


    // Test the `deposit_lsu` method (fail - wrong lsu_address)
    amount = dec!("1");

    let receipt = deposit_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        admin_badge,
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);
}


#[test]
fn test_staker_withdraw_lsu() {

    let mut test_runner = TestRunner::builder().build();
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (_owner_badge, component_address, _admin_badge, _transient, nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    let amount: Decimal = dec!("100");

    // Set dependencies

    // (1) deposit lsu
    let receipt = deposit_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        RADIX_TOKEN,
        amount
    );

    println!("{:?}\n", receipt);

    // register the balance changes of the "deposit_lsu" transaction
    let balance_changes = receipt.expect_commit(true).balance_changes();

    // declare variables to get them in scope
    let mut non_fungible_id = &BTreeSet::from([NonFungibleLocalId::integer(1)]);
    let mut mut_balance_change;

    // (2) retrieve the fourth balance change (assuming there is at least one)
    //  which is the non fungible token that is returned to the user
    if let Some((_, inner_map)) = balance_changes.iter().nth(2) {
        // Apply the `added_non_fungibles` function to the first balance change
        if let Some((_, balance_change)) = inner_map.iter().next() {
            mut_balance_change = balance_change.clone();
            non_fungible_id = mut_balance_change.added_non_fungibles();
        }
    }

    // Test the `withdraw_lsu` method (fail)
    // provide invalid nft local id.

    let non_fungible_id_replica = &BTreeSet::from([NonFungibleLocalId::integer(2)]);

    let receipt = withdraw_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        nft,
        non_fungible_id_replica
    );

    println!("{:?}\n", receipt);
    
    receipt.expect_commit(false);

    // Test the `withdraw_lsu` method (succes)
    // provide valid lsu amount, and address.
    let receipt = withdraw_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        nft,
        non_fungible_id
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);
    
}

#[test]
fn test_update_supplier_info() {

    let mut test_runner = TestRunner::builder().build();
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    // Test the `update_supplier_hashmap` method (succes - admin badge)
    let receipt = update_supplier_hashmap(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        admin_badge
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);

    // Test the `update_supplier_hashmap` method (succes - owner badge)
    let receipt = update_supplier_hashmap(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);

    // Test the `update_supplier_hashmap` method (fail - wrong badge)

    let badge = create_fungible(
        &mut test_runner, 
        account_component, 
        public_key
    );

    let receipt = update_supplier_hashmap(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        badge
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);
}
