// use radix_engine_interface::model::FromPublicKey;
use scrypto::prelude::*;
use scrypto_unit::*;
use transaction::builder::ManifestBuilder;
// use radix_engine::transaction::*;

#[test]
fn test_flashloan_instantiation() {
    // Setup the environment
    let mut test_runner = TestRunner::builder().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    // Publish package
    let package_address = test_runner.compile_and_publish(this_package!());

    //**** TEST INSTANTIATER ****\\

    // Test the instantiate_lender (succes)
    // Deposit batch to distribute haning batch
    // Simple instantiation that should result in a succesful commitment
    let manifest = ManifestBuilder::new()
        .call_function(package_address, "Flashloan", "instantiate_lender", manifest_args!())
        .call_method(
                    account_component,
                    "deposit_batch",
                    manifest_args!(ManifestExpression::EntireWorktop),
                )
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true)

    let component = receipt.new_component_addresses()[0];
    let transient = receipt.new_resource_addresses()[2];
    let admin_badge = receipt.new_resource_addresses()[1];

    // Test the instantiate_lender function (fail)
    // Call the instantiater correctly but leave tokens in worktop
    // Instantiaten that should fail
    let manifest = ManifestBuilder::new()
        .call_function(package_address, "Flashloan", "instantiate_lender", manifest_args!())
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    //**** TEST UPDATE_INTEREST_RATE ****\\

    // Test the "update_interest_rate" method (fail)
    // Update without admin badge proof should fail
    let manifest = ManifestBuilder::new()
        .call_method(component, "update_interest_rate", manifest_args!(dec!("0.05")))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    // Test the "update_interest_rate" method (true)
    let manifest = ManifestBuilder::new()
        .create_proof_from_account(account_component, admin_badge)
        .call_method(component, "update_interest_rate", manifest_args!(dec!("0.05")))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true);


    //**** TEST ADMIN_DEPOSIT_LIQUIDITY ****\\

    // Test the `admin_deposit_liquidity` method (fail)
    // Provided amount should be a non-negative numeber
    // Transaction should therefore fail
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("-100"))
        .create_proof_from_account(account_component, admin_badge)
        .take_from_worktop(RADIX_TOKEN, |builder1, bucket1| {
            builder1.call_method(component, "admin_deposit_liquidity", manifest_args!(bucket1))
        })
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(false);

    // Test the `admin_deposit_liquidity` method (succes)
    // Provided amount should be a non-negative numeber
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .create_proof_from_account(account_component, admin_badge)
        .take_from_worktop(RADIX_TOKEN, |builder1, bucket1| {
            builder1.call_method(component, "admin_deposit_liquidity", manifest_args!(bucket1))
        })
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true);

    //**** TEST GET_FLASHLOAN ****\\

    // Test the `get_flashloan` method (fail)
    // Transient token should not be allowed to be deposited
    // Transaction should therefore fail
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .create_proof_from_account(account_component, admin_badge)
        .take_from_worktop(RADIX_TOKEN, |builder1, bucket1| {
            builder1.call_method(component, "admin_deposit_liquidity", manifest_args!(bucket1))
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

    // Test the `get_flashloan` method (success)
    // First set up dependencies:
    //  Withdraw XRD for liquidity
    //  Proof retrieved
    //  Deposit liquidity
    // Call the get_loan function
    // Call the repay_loan to burn transient token
    // Thereafter deposit batch
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .create_proof_from_account(account_component, admin_badge)
        .take_from_worktop(RADIX_TOKEN, |builder1, bucket1| {
            builder1.call_method(component, "admin_deposit_liquidity", manifest_args!(bucket1))
        })
        .call_method(component, "get_flashloan", manifest_args![dec!("100")])
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("110"))
        .take_from_worktop(RADIX_TOKEN, |builder1, bucket1| {
            builder1.take_from_worktop(transient, |builder2, bucket2| {
                    builder2.call_method(component, "repay_flashloan", manifest_args!(bucket1, bucket2))
            })
        })
        .call_method(account_component, "deposit_batch", manifest_args!(ManifestExpression::EntireWorktop))
        .build();

    let receipt = test_runner.execute_manifest_ignoring_fee(
        manifest,
        vec![NonFungibleGlobalId::from_public_key(&public_key)],
    );
    println!("{:?}\n", receipt);
    receipt.expect_commit(true);

    //**** TEST REPAY_FLASHLOAN ****\\

    // Test the `repay_flashloan` method (fail)
    // Repayed amount is 0.000000001 smaller than loan amount - should therefore fail
    // First set up dependencies:
    //  (1) Withdraw XRD for liquidity
    //  (2) Proof retrieved
    //  (3) Deposit liquidity
    // Call the get_loan function
    // Call the repay_loan to burn transient token
    // Thereafter deposit batch
    let manifest = ManifestBuilder::new()
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("100"))
        .create_proof_from_account(account_component, admin_badge)
        .take_from_worktop(RADIX_TOKEN, |builder1, bucket1| {
            builder1.call_method(component, "admin_deposit_liquidity", manifest_args!(bucket1))
        })
        .call_method(component, "update_interest_rate", manifest_args!(dec!("0.05")))
        .call_method(component, "get_flashloan", manifest_args![dec!("100")])
        .withdraw_from_account(account_component, RADIX_TOKEN, dec!("4.999999999999999999"))
        .take_from_worktop(RADIX_TOKEN, |builder1, bucket1| {
            builder1.take_from_worktop(transient, |builder2, bucket2| {
                    builder2.call_method(component, "repay_flashloan", manifest_args!(bucket1, bucket2))
            })
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
