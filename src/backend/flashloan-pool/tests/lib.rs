use scrypto::prelude::*;
use scrypto_unit::*;
use transaction::builder::ManifestBuilder;
use transaction::prelude::NewManifestBucket;

#[test]
fn test_flashloan_pool_instantiation() {
    // Setup the environment
    let mut test_runner = TestRunner::builder().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    // Publish package
    let package_address = test_runner.compile_and_publish(this_package!());

    //----------------------------------------------------------------------------------------------\\

    //**** TEST INSTANTIATER ****\\

    let manifest = ManifestBuilder::new()
        // Test the instantiate_lender (succes)
        // Deposit batch to distribute haning batch
        // Simple instantiation that should result in a succesful commitment
        .call_function(package_address, "Flashloanpool", "instantiate_flashloan_pool", manifest_args!())
        .deposit_batch(account_component)
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );

    let component = receipt.expect_commit(true).new_component_addresses()[0];
    let admin_badge = receipt.expect_commit(true).new_resource_addresses()[0];
    let transient = receipt.expect_commit(true).new_resource_addresses()[1];
    let nft = receipt.expect_commit(true).new_resource_addresses()[2];

    println!("{:?}\n", admin_badge);

    //----------------------------------------------------------------------------------------------\\

    //**** TEST UPDATE_INTEREST_RATE ****\\

    let manifest = ManifestBuilder::new()
        // Test the "update_interest_rate" method (fail)
        // Update without admin badge proof should fail
        .call_method(component, "update_interest_rate", manifest_args!(dec!("0.05")))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    let manifest = ManifestBuilder::new()
        // Test the "update_interest_rate" method (true)
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1") )
        .call_method(component, "update_interest_rate", manifest_args!(dec!("0.05")))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true);


    // //----------------------------------------------------------------------------------------------\\

    //**** TEST ADMIN_DEPOSIT_LIQUIDITY ****\\

    let manifest = ManifestBuilder::new()
        // Test the `admin_deposit_liquidity` method (fail)
        // No proof passed, so transaction will be rejected
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "admin_deposit_liquidity", manifest_args!(lookup.bucket("bucket1")))
        })
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    let manifest = ManifestBuilder::new()
        // Test the `admin_deposit_liquidity` method (fail)
        // Provided amount should be a non-negative numeber
        // Transaction should therefore fail

        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("-100"))
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "admin_deposit_liquidity", manifest_args!(lookup.bucket("bucket1")))
        })
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    let manifest = ManifestBuilder::new()
        // Test the `admin_deposit_liquidity` method (succes)
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "admin_deposit_liquidity", manifest_args!(lookup.bucket("bucket1")))
        })
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true);
    
    //----------------------------------------------------------------------------------------------\\

    //**** TEST ADMIN_WITHDRAW_LIQUIDITY ****\\

    let manifest = ManifestBuilder::new()
        // Test the `admin_withdraw_liquidity` method (succes)
        // Proof passed and correct amount provided
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1"))
        .call_method(component, "admin_withdraw_liquidity", manifest_args!(dec!("50")))
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();
    
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true);

    let manifest = ManifestBuilder::new()
        // Test the `admin_withdraw_liquidity` method (fail)
        // Proof passed but incorrect amount provided
        .create_proof_from_account_of_amount(account_component, RADIX_TOKEN, dec!("1"))
        .call_method(component, "admin_withdraw_liquidity", manifest_args!(dec!("51")))
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();
    
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    let manifest = ManifestBuilder::new()
        // Test the `admin_withdraw_liquidity` method (fail)
        // Correct amount provided but wrong proof
        .create_proof_from_account_of_amount(account_component, RADIX_TOKEN, dec!("1"))
        .call_method(component, "admin_withdraw_liquidity", manifest_args!(dec!("50")))
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();
    
    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    //----------------------------------------------------------------------------------------------\\

    //**** TEST GET_FLASHLOAN ****\\

    let manifest = ManifestBuilder::new()
        // Test the `get_flashloan` method (fail)
        // Transient token should not be allowed to be deposited
        // Transaction should therefore fail

        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "admin_deposit_liquidity", manifest_args!(lookup.bucket("bucket1")))
        })
        .call_method(component, "get_flashloan", manifest_args![dec!("100")])
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    let manifest = ManifestBuilder::new()
        // Test the `get_flashloan` method (success)
        // First set up dependencies:
        //  Withdraw XRD for liquidity
        //  Proof retrieved
        //  Deposit liquidity
        // Call the get_loan function
        // Call the repay_loan to burn transient token
        // Thereafter deposit batch

        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "admin_deposit_liquidity", manifest_args!(lookup.bucket("bucket1")))
        })
        .call_method(component, "get_flashloan", manifest_args![dec!("100")])
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("110"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket2")
        .take_all_from_worktop(transient, "bucket3")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "repay_flashloan", manifest_args!(lookup.bucket("bucket2"), lookup.bucket("bucket3")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true);

    //----------------------------------------------------------------------------------------------\\

    //**** TEST REPAY_FLASHLOAN ****\\

    let manifest = ManifestBuilder::new()
        // Test the `repay_flashloan` method (fail)
        // Repayed amount is 0.000000001 smaller than loan amount - should therefore fail
        // First set up dependencies:
        //  (1) Withdraw XRD for liquidity
        //  (2) Proof retrieved
        //  (3) Deposit liquidity
        // Call the get_loan function
        // Call the repay_loan to burn transient token
        // Thereafter deposit batch

        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .create_proof_from_account_of_amount(account_component, admin_badge, dec!("1"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "admin_deposit_liquidity", manifest_args!(lookup.bucket("bucket1")))
        })
        .call_method(component, "update_interest_rate", manifest_args!(dec!("0.05")))
        .call_method(component, "get_flashloan", manifest_args![dec!("100")])
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("4.999999999999999999"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket2")
        .take_all_from_worktop(transient, "bucket3")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "repay_flashloan", manifest_args!(lookup.bucket("bucket2"), lookup.bucket("bucket3")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    //----------------------------------------------------------------------------------------------\\

    //**** TEST staker_deposit_lsu ****\\

    let manifest = ManifestBuilder::new()
        // Test the `staker_deposit_lsu` method (succes)
        // provide valid lsu amount, and address.

        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("10"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "staker_deposit_lsu", manifest_args!(lookup.bucket("bucket1")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);

    // register the balance changes of the "staker_deposit_lsu" transaction
    let balance_changes = receipt.expect_commit(true).balance_changes();

    // declare variables to get them in scope
    let mut non_fungible_id = &BTreeSet::from([NonFungibleLocalId::integer(1)]);
    let mut mut_balance_change;

    // Retrieve the fourth balance change (assuming there is at least one)
    // which is the non fungible token that is returned to the user
    if let Some((_, inner_map)) = balance_changes.iter().nth(2) {
        // Apply the `added_non_fungibles` function to the first balance change
        if let Some((_, balance_change)) = inner_map.iter().next() {
            mut_balance_change = balance_change.clone();
            non_fungible_id = mut_balance_change.added_non_fungibles();
        }
    }

    let manifest = ManifestBuilder::new()
        // Test the `staker_deposit_lsu` method (fail)
        // provide wrong lsu amount.

        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("-10"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "staker_deposit_lsu", manifest_args!(lookup.bucket("bucket1")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);


    let manifest = ManifestBuilder::new()
        // Test the `staker_deposit_lsu` method (fail)
        // provide wrong lsu address.

        .withdraw_from_account(account_component, admin_badge, dec!("10"))
        .take_all_from_worktop(RADIX_TOKEN, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "staker_deposit_lsu", manifest_args!(lookup.bucket("bucket1")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    //----------------------------------------------------------------------------------------------\\

    //**** TEST staker_withdraw_lsu ****\\

    let manifest = ManifestBuilder::new()
        // Test the `staker_withdraw_lsu` method (succes)
        // provide valid lsu amount, and address.

        .withdraw_non_fungibles_from_account(account_component, nft, non_fungible_id)
        .take_all_from_worktop(nft, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "staker_withdraw_lsu", manifest_args!(lookup.bucket("bucket1")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true);


    let manifest = ManifestBuilder::new()
        // Test the `staker_withdraw_lsu` method (fail)
        // provide invalid nft local id.

        .withdraw_non_fungibles_from_account(account_component, nft, &BTreeSet::from([NonFungibleLocalId::integer(1)]))
        .take_all_from_worktop(nft, "bucket1")
        .with_name_lookup(|builder, lookup| {
            builder.call_method(component, "staker_withdraw_lsu", manifest_args!(lookup.bucket("bucket1")))
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);
    
}
