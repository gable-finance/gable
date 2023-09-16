use manifests::*;
use scrypto_unit::*;
use transaction::builder::ManifestBuilder;
use sundae::test_bindings::*;
use scrypto_test::prelude::*;
use scrypto::prelude::KeyValueStore;
use scrypto::*;

mod manifests;

// THE BELOW UNIT TESTING IS COMMENTED OUT DUE TO A PENDING BUG IN THE SCRYPTO-TEST CRATE.
// THE SIZE AND SCOPE OF THE BELOW UNIT TESTING WILL BE APPLICABLE ONCE THE BUG HAS BEEN FIXED

//----------------------------------
//------ Unit testing -------
//----------------------------------

// // Helper function to set up the test environment and instantiate a Flashloanpool
// fn setup_flashloan_pool() -> Result<(TestEnvironment, Flashloanpool), RuntimeError> {
//     // provision test environment
//     let mut env = TestEnvironment::new();

//     // compile local package
//     let package_address = Package::compile_and_publish(this_package!(), &mut env)?;

//     // provision two resources required as component input
//     // mimicking the owner badge and validator owner token
//     let bucket1 = ResourceBuilder::new_fungible(OwnerRole::None)
//         .divisibility(DIVISIBILITY_NONE)
//         .mint_initial_supply(1, &mut env)?;
//     let bucket2 = ResourceBuilder::new_fungible(OwnerRole::None)
//         .divisibility(DIVISIBILITY_NONE)
//         .mint_initial_supply(1, &mut env)?;

//     // deploy component to local test environment
//     let flashloanpool = Flashloanpool::instantiate_flashloan_pool(
//         bucket1,
//         bucket2,
//         package_address,
//         &mut env,
//     )?;

//     Ok((env, flashloanpool))
// }

// #[test]
// fn creation_of_pool_component() -> Result<(), RuntimeError> {
//     // Arrange
//     let (_, _) = setup_flashloan_pool()?;
//     // No specific assertions for this test, just ensuring it doesn't panic
//     Ok(())
// }

// // Test the 'owner_deposit_xrd' method 
// //  by depositing a single XRD.
// // 
// // This test ensures that the component state is updated accordingly.
// #[test]
// fn unit_test_owner_deposit_xrd() -> Result<(), RuntimeError> {

//     let (mut env, mut flashloanpool) = setup_flashloan_pool()?;

//     // Act
//     env.with_auth_module_disabled(|env| {

//         let rtn = ResourceManager(XRD).mint_fungible(1.into(), env);

//         let _ = flashloanpool.owner_deposit_xrd(rtn.unwrap(), env);

//     });

//     let flashloanpool_state = env.read_component_state::<FlashloanpoolState, _>(flashloanpool)?; 

//     let xrd_amount = flashloanpool_state.liquidity_pool_vault.amount(&mut env)?;
//     let owner_amount = flashloanpool_state.owner_liquidity;

//     // Assert
//     assert_eq!(xrd_amount, dec!("1"));
//     assert_eq!(owner_amount, dec!("1"));

//     Ok(())
// }

// // Test the 'owner_withdraw_xrd' method 
// //  by depositing a 100 XRD and withdrawing 50 XRD.
// // 
// // This test ensures that the component state is updated accordingly,
// //  e.g. the method returns a bucket with 50 XRD
// //  and 50 XRD remains entitled to the owner in the component state.
// #[test]
// fn unit_test_owner_withdraw_xrd() -> Result<(), RuntimeError> {
//     // Arrange
//     let (mut env, mut flashloanpool) = setup_flashloan_pool()?;

//     let xrd_bucket: Bucket = env.with_auth_module_disabled(|env| {
//         // Act
//         let rtn = ResourceManager(XRD).mint_fungible(100.into(), env);

//         let _ = flashloanpool.owner_deposit_xrd(rtn.unwrap(), env);

//         let bucket = flashloanpool.owner_withdraw_xrd(dec!("50"), env);

//         bucket

//     })?;

//     // Act
//     let flashloanpool_state = env.read_component_state::<FlashloanpoolState, _>(flashloanpool)?; 

//     let xrd_amount = flashloanpool_state.liquidity_pool_vault.amount(&mut env)?;
//     let owner_amount = flashloanpool_state.owner_liquidity;

//     // Assert
//     assert_eq!(xrd_bucket.amount(&mut env)?, dec!("50"));
//     assert_eq!(xrd_amount, dec!("50"));
//     assert_eq!(owner_amount, dec!("50"));

//     Ok(())
// }

// // Test the 'deposit_lsu' method 
// //  by depositing a 100 LSU (XRD) as supplier.
// // 
// // This test ensures that:
// //  1. a single pool NFT is returned to the supplier
// //  2. the component state is updated accordingly:
// //      - the aggregate indexmap is created and contains the suppliers info
// //      - the partitioned kvs is created and contains the suppliers info
// #[test]
// fn unit_test_deposit_lsu() -> Result<(), RuntimeError> {
//     // Arrange
//     let (mut env, mut flashloanpool) = setup_flashloan_pool()?;

//     // Act: mint XRD
//     let lsu_bucket: Bucket = env.with_auth_module_disabled(|env| {

//         let rtn = ResourceManager(XRD).mint_fungible(100.into(), env);

//         rtn

//     })?;

//     let lsu_bucket_amount = lsu_bucket.amount(&mut env)?;

//     // Act: deposit lsu as supplier
//     let nft_bucket = flashloanpool.deposit_lsu(lsu_bucket, &mut env)?;

//     // Act: set state and save state variables
//     let flashloanpool_state = env.read_component_state::<FlashloanpoolState, _>(flashloanpool)?; 

//     let nft_address: ResourceAddress = flashloanpool_state.pool_nft.address();
//     // let nft_local_id: NonFungibleLocalId = NonFungibleLocalId::Integer(1.into());

//     let index_map: IndexMap<u64, Vec<Decimal>> = flashloanpool_state.supplier_aggregate_im;
//     let index_map_box_1: &Vec<Decimal> = index_map.get(&1).unwrap();

//     // let key_value_store: KeyValueStore<u64, IndexMap<NonFungibleLocalId, Vec<Decimal>>> = 
//     //     flashloanpool_state.supplier_partitioned_kvs;
//     // let key_value_store_box_1_im_1 = key_value_store.get(&1).get(&nft_local_id).unwrap();

//     // Assert: ensure that the right NFT is returned
//     assert_eq!(nft_bucket.resource_address(&mut env)?, nft_address);
//     assert_eq!(nft_bucket.amount(&mut env)?, Decimal::ONE);

//     // Assert: ensure that the aggregate index map reflects the added supplier,
//     //  e.g. 1 supplier, 100 LSU provided, and 0 rewards and interest
//     assert_eq!(index_map_box_1[0], Decimal::ONE);
//     assert_eq!(index_map_box_1[1], lsu_bucket_amount);
//     assert_eq!(index_map_box_1[2], Decimal::ZERO);
//     assert_eq!(index_map_box_1[3], Decimal::ZERO);
//     assert_eq!(index_map_box_1[4], Decimal::ZERO);
//     assert_eq!(index_map_box_1[5], Decimal::ZERO);

//     Ok(())
// }

// // Test the 'withdraw_lsu' method 
// //  by first depositing and then a 100 LSU (XRD) as supplier. 
// // 
// // This test ensures that:
// //  1. the pool NFT returns the exact amount the supplier is entitled to,
// //      e.g. a bucket with 100 LSU (XRD) and 0 rewards/interest XRD
// //  2. the component state is updated accordingly:
// //      - the aggregate indexmap is updated according to the withdrawn amount
// //      - the partitioned kvs is updated according to the withdrawn amount
// #[test]
// fn unit_test_withdraw_lsu() -> Result<(), RuntimeError> {
//     // Arrange
//     let (mut env, mut flashloanpool) = setup_flashloan_pool()?;

//     // Act: mint XRD
//     let lsu_bucket: Bucket = env.with_auth_module_disabled(|env| {

//         let bucket = ResourceManager(XRD).mint_fungible(100.into(), env);

//         bucket

//     })?;

//     // Act: deposit lsu as supplier
//     let nft_bucket = flashloanpool.deposit_lsu(lsu_bucket, &mut env)?;

//     // Act: execute 'withdraw_lsu' method
//     let (lsu_bucket, xrd_bucket) = flashloanpool.withdraw_lsu(nft_bucket, &mut env)?;

//     // Act: set component state
//     let flashloanpool_state = env.read_component_state::<FlashloanpoolState, _>(flashloanpool)?; 
//     let index_map: IndexMap<u64, Vec<Decimal>> = flashloanpool_state.supplier_aggregate_im;

//     let lsu_address = flashloanpool_state.lsu_vault.resource_address(&mut env)?;

//     // Assert: ensure the LSU and XRD returned are of the correct address
//     assert_eq!(lsu_bucket.resource_address(&mut env)?, lsu_address);
//     assert_eq!(xrd_bucket.resource_address(&mut env)?, XRD);

//     // Assert: ensure the LSU and XRD returned are of the correct amount
//     assert_eq!(lsu_bucket.amount(&mut env)?, dec!("100"));
//     assert_eq!(xrd_bucket.amount(&mut env)?, Decimal::ZERO);

//     // Assert: ensure that the aggregate index map is removed accordingly
//     //  as the only supplier has withdrawn, the index map should be empty
//     assert!(index_map.is_empty());

//     Ok(())
// }

// // Test the 'get_flashloan' method 
// //  by requesting a loan of 50 XRD. 
// // 
// // This test ensures that:
// //  1. the correct amount of XRD is provided as requested.
// //  2. the correct resources (transient token, and XRD) are provided in return 
// #[test]
// fn unit_test_get_flashloan() -> Result<(), RuntimeError> {
//     // Arrange
//     let (mut env, mut flashloanpool) = setup_flashloan_pool()?;

//     // Act: mint XRD and deposit XRD as owner
//     env.with_auth_module_disabled(|env| {
//         // Act
//         let rtn = ResourceManager(XRD).mint_fungible(100.into(), env);

//         let _ = flashloanpool.owner_deposit_xrd(rtn.unwrap(), env);

//     });

//     // execute 'get_flashloan' method
//     let (transient_bucket, xrd_bucket) = flashloanpool.get_flashloan(dec!("50"), &mut env)?;

//     // set component state
//     let flashloanpool_state = env.read_component_state::<FlashloanpoolState, _>(flashloanpool)?; 

//     // save state variables
//     let transient_address = flashloanpool_state.transient_token.address();

//     // Assert: ensure the transient token and XRD returned are of the correct address
//     assert_eq!(transient_bucket.resource_address(&mut env)?, transient_address);
//     assert_eq!(xrd_bucket.resource_address(&mut env)?, XRD);

//     assert_eq!(transient_bucket.amount(&mut env)?, Decimal::ONE);
//     assert_eq!(xrd_bucket.amount(&mut env)?, dec!("50"));

//     Ok(())
// }

// #[test]
// fn unit_test_repay_flashloan() -> Result<(), RuntimeError> {
//     // Arrange
//     let (mut env, mut flashloanpool) = setup_flashloan_pool()?;

//     // Act
    
//     // Mint XRD and deposit XRD as owner
//     env.with_auth_module_disabled(|env| {
//         // Act
//         let xrd_bucket = ResourceManager(XRD).mint_fungible(100.into(), env);

//         let _ = flashloanpool.owner_deposit_xrd(xrd_bucket.unwrap(), env);
//     });

//     // Execute 'get_flashloan' method
//     let (transient_bucket, xrd_bucket) = flashloanpool.get_flashloan(dec!("50"), &mut env)?;

//     // Execute 'repay_flashloan' method
//     let residual_xrd_bucket = flashloanpool.repay_flashloan(xrd_bucket, transient_bucket, &mut env)?;

//     // Assert: ensure that the returned bucket is of the correct XRD address and amount
//     // As the interest rate is 0% by default, the repayment amount equals the loan amount,
//     //  therefore the residual repayment, that is returned, should be 0
//     assert_eq!(residual_xrd_bucket.resource_address(&mut env)?, XRD);
//     assert_eq!(residual_xrd_bucket.amount(&mut env)?, Decimal::ZERO);

//     // Act
    
//     // Update interest rate
//     let interest_bucket = env.with_auth_module_disabled(|env| {

//         let _ = flashloanpool.update_interest_rate(dec!("0.1"), env);

//         let bucket = ResourceManager(XRD).mint_fungible(100.into(), env);

//         bucket

//     })?;

//     // Execute 'get_flashloan' method
//     let (transient_bucket, xrd_bucket) = flashloanpool.get_flashloan(dec!("50"), &mut env)?;

//     // Merge the interest bucket into the loan bucket
//     xrd_bucket.put(interest_bucket, &mut env)?;

//     // Execute 'repay_flashloan' method
//     let residual_xrd_bucket = flashloanpool.repay_flashloan(xrd_bucket, transient_bucket, &mut env)?;

//     // Calculate residual repayment amount
//     //
//     // residual amount = repayment - loan * (1 + interest rate) = 
//     // residual amount = 150       - 50   * (1 + 0.1)           = 95
//     let residual_amount = dec!("95");

//     // Assert
    
//     // Ensure that returned bucket is of correct XRD address and amount
//     assert_eq!(residual_xrd_bucket.resource_address(&mut env)?, XRD);
//     assert_eq!(residual_xrd_bucket.amount(&mut env)?, residual_amount);

//     Ok(())
// }

// // Test the 'update_supplier_kvs' method.
// // This test validates the behavior of the 'update_supplier_kvs' method by simulating various actions that impact the data structures used to store supplier information.
// // To enhance scalability, the data is partitioned into multiple 'boxes,' and a KeyValueStore is used for efficient lookups.
// // Individual supplier data is stored in 'boxes' within the KeyValueStore, while aggregate information is stored in a separate IndexMap.
// // The component maintains two key data structures in its state:
// //   1. An aggregate IndexMap: IndexMap<u64, Vec<Decimal>>
// //   2. An individual/partitioned KeyValueStore: KeyValueStore<u64, IndexMap<NonFungibleLocalId, Decimal>>
// // The 'update_supplier_kvs' method is responsible for updating both of these data structures.
// // This test ensures that both data structures are correctly updated after each event affecting their content.
// #[test]
// fn unit_test_update_supplier_info() -> Result<(), RuntimeError> {
//     // Arrange
//     let (mut env, mut flashloanpool) = setup_flashloan_pool()?;

//     // Act

//     // Set map size at 2 indexes for testing purposes
//     // This entails that after two entries, a new 'box' is created to store new suppliers' info
//     env.with_auth_module_disabled(|env| flashloanpool.update_map_size(2, env))?;

//     // Define the values for LSU (XRD) buckets to be minted and deposited
//     let bucket_values = [
//         100.into(),
//         100.into(),
//         100.into(),
//         100.into(),
//         100.into(),
//     ];

//     // Create a vector to store the resulting LSU (XRD) buckets
//     let mut bucket_results: Vec<Bucket> = Vec::new();

//     // Iterate through the specified bucket values
//     for value in bucket_values.iter() {
//         // Mint an LSU (XRD) bucket with the given value
//         let minted_bucket = env.with_auth_module_disabled(|env| ResourceManager(XRD).mint_fungible(*value, env))?;

//         // Deposit the minted LSU (XRD) bucket into the flashloanpool
//         let deposited_bucket = flashloanpool.deposit_lsu(minted_bucket, &mut env)?;

//         // Store the deposited bucket in 'bucket_results'
//         bucket_results.push(deposited_bucket);
//     }

//     // Mint XRD and deposit it into the pool
//     let xrd_bucket = env.with_auth_module_disabled(|env| ResourceManager(XRD).mint_fungible(50.into(), env))?;

//     // The 'deposit_batch' method mimics the deposit of XRD staking rewards coming from the validator node
//     let _ = flashloanpool.deposit_batch(xrd_bucket, &mut env)?;

//     let (lsu_bucket, xrd_bucket) = flashloanpool.withdraw_lsu(bucket_results.remove(0), &mut env)?;

//     // Save component state
//     let flashloanpool_state = env.read_component_state::<FlashloanpoolState, _>(flashloanpool)?; 

//     let index_map: IndexMap<u64, Vec<Decimal>> = flashloanpool_state.supplier_aggregate_im;

//     let index_map_box_1: &Vec<Decimal> = index_map.get(&1).unwrap();

//     // let key_value_store: KeyValueStore<u64, IndexMap<NonFungibleLocalId, Vec<Decimal>>> = 
//     //     flashloanpool_state.supplier_partitioned_kvs;
//     // let key_value_store_box_1_im_1 = key_value_store.get(&1).get(&nft_local_id).unwrap();

//     // Assert

//     // Ensure that the aggregate index map contains the correct information:
//     //  - 5 suppliers deposited 100 LSU (XRD)
//     //  - A batch of 50 XRD is deposited as rewards
//     //  - 1 supplier has withdrawn (NFT #1#)

//     // Therefore box 1 in the index map contains:
//     //
//     //  - 1 supplier
//     //  - 100 LSU
//     //  - (50/5=) 10 XRD distributed rewards
//     //
//     // Rewards are first assigned as undistributed to the aggregate index map.
//     // The undistributed rewards are only distributed to the individual key value store prior to a supplier entering or leaving the corresponding 'box'.
//     // As NFT #1# has withdrawn from the box, the rewards have been distributed.
//     //
//     //  - 0 XRD undistributed rewards
//     //  - 0 XRD distributed interest
//     //  - 0 XRD undistributed interest
//     assert_eq!(index_map_box_1[0], dec!("1"));
//     assert_eq!(index_map_box_1[1], dec!("100"));
//     assert_eq!(index_map_box_1[2], dec!("10"));
//     assert_eq!(index_map_box_1[3], Decimal::ZERO);
//     assert_eq!(index_map_box_1[4], Decimal::ZERO);
//     assert_eq!(index_map_box_1[5], Decimal::ZERO);

//     let index_map_box_2: &Vec<Decimal> = index_map.get(&2).unwrap();

//     // Therefore box 2 in the index map contains:
//     //
//     //  - 2 supplier
//     //  - 200 LSU
//     //  - 0 XRD distributed rewards
//     //
//     // As mentioned in previous assertions, no supplier has entered or left box 2 after the rewards were deposited.
//     // Therefore, the rewards on aggregate level have not yet been distributed to individual level.
//     //
//     //  - (50/5*2=) 20 XRD undistributed rewards
//     //  - 0 XRD distributed interest
//     //  - 0 XRD undistributed interest
//     assert_eq!(index_map_box_2[0], dec!("2"));
//     assert_eq!(index_map_box_2[1], dec!("200"));
//     assert_eq!(index_map_box_2[2], Decimal::ZERO);
//     assert_eq!(index_map_box_2[3], dec!("20"));
//     assert_eq!(index_map_box_2[4], Decimal::ZERO);
//     assert_eq!(index_map_box_2[5], Decimal::ZERO);

//     let index_map_box_3: &Vec<Decimal> = index_map.get(&3).unwrap();

//     // Therefore box 3 in the index map contains:
//     //
//     //  - 1 supplier
//     //  - 100 LSU
//     //  - 0 XRD distributed rewards
//     //  - (50/5=) 10 XRD undistributed rewards
//     //  - 0 XRD distributed interest
//     //  - 0 XRD undistributed interest
//     assert_eq!(index_map_box_3[0], dec!("1"));
//     assert_eq!(index_map_box_3[1], dec!("100"));
//     assert_eq!(index_map_box_3[2], Decimal::ZERO);
//     assert_eq!(index_map_box_3[3], dec!("10"));
//     assert_eq!(index_map_box_3[4], Decimal::ZERO);
//     assert_eq!(index_map_box_3[5], Decimal::ZERO);

//     Ok(())
// }

//----------------------------------
//------ Integration testing -------
//----------------------------------

#[test]
fn integration_test_create_validator() {
    // Setup the environment
    let mut test_runner = TestRunnerBuilder::new().without_trace().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (receipt, _nft_address, _nft_id) = create_validator(
        &mut test_runner, 
        account_component, 
        public_key,
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);
}

#[test]
fn integration_test_instantiater() {
    // Setup the environment
    let mut test_runner = TestRunnerBuilder::new().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (_owner_badge, _component_address, _admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);
}

#[test]
fn integration_test_update_interest_rate() {
    // Setup the environment
    let mut test_runner = TestRunnerBuilder::new().build();

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
fn integration_test_owner_deposit_liquidity() {
    // Setup the environment
    let mut test_runner = TestRunnerBuilder::new().build();

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

    let receipt = owner_deposit_xrd(
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
    let receipt = owner_deposit_xrd(
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

    let receipt = owner_deposit_xrd(
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
fn integration_test_owner_withdraw_liquidity() {
    // Setup the environment
    let mut test_runner = TestRunnerBuilder::new().build();

    // Create an account
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, _admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    // put 100 XRD in the pool
    let mut amount: Decimal = dec!("100");

    let receipt = owner_deposit_xrd(
        &mut test_runner, 
        public_key,
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);

    // Test the `owner_withdraw_xrd` method (fail - negative amount)
    amount = dec!("-100");

    let receipt = owner_withdraw_xrd(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // Test the `owner_withdraw_xrd` method (fail - wrong badge)
    amount = dec!("100");

    let badge = create_fungible(
        &mut test_runner, 
        account_component, 
        public_key
    );

    let receipt = owner_withdraw_xrd(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        badge, 
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);

    // Test the `owner_withdraw_xrd` method (success)
    amount = dec!("100");

    let receipt = owner_withdraw_xrd(
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
fn integration_test_get_flashloan() {
    let mut test_runner = TestRunnerBuilder::new().build();
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, _admin_badge, transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    // Put 100 XRD in the vault for testing
    let amount: Decimal = dec!("100");

    let _receipt = owner_deposit_xrd(
        &mut test_runner, 
        public_key,
        account_component, 
        component_address, 
        owner_badge, 
        amount
    );

    // Test the `owner_withdraw_xrd` method (fail - transient token)
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
        .withdraw_from_account(account_component, XRD, dec!("110"))
        .take_all_from_worktop(XRD, "xrd_bucket")
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
fn integration_test_repay_flashloan() {
    let mut test_runner = TestRunnerBuilder::new().build();
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

    let _receipt = owner_deposit_xrd(
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
        .withdraw_from_account(account_component, XRD, amount*ir-dec!("0.00000001"))
        .take_all_from_worktop(XRD, "xrd_bucket")
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
        .withdraw_from_account(account_component, XRD, amount*ir)
        .take_all_from_worktop(XRD, "xrd_bucket")
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
fn integration_test_staker_deposit_lsu() {

    let mut test_runner = TestRunnerBuilder::new().build();
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
        XRD,
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);

    // Test the `deposit_lsu` method (fail - neg LSU)
    amount = dec!("-100");

    let receipt = deposit_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        XRD,
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

    // Test the `deposit_lsu` method (succes)
    amount = dec!("1");

    let receipt = deposit_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        XRD,
        amount
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);
}

#[test]
fn integration_test_staker_withdraw_lsu() {

    let mut test_runner = TestRunnerBuilder::new().build();
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
        XRD,
        amount
    );

    println!("{:?}\n", receipt);

    // register the balance changes of the "deposit_lsu" transaction
    let balance_changes = receipt.expect_commit(true).vault_balance_changes();

    // declare variables to get them in scope
    let mut non_fungible_id = &BTreeSet::from([NonFungibleLocalId::integer(1)]);
    let mut mut_balance_change;

    // // (2) retrieve the fourth balance change (assuming there is at least one)
    // //  which is the non fungible token that is returned to the user
    // if let Some((_, inner_map)) = balance_changes.iter().nth(2) {
    //     // Apply the `added_non_fungibles` function to the first balance change
    //     if let Some((_, balance_change)) = inner_map.iter().next() {
    //         mut_balance_change = balance_change.clone();
    //         non_fungible_id = mut_balance_change.added_non_fungibles();
    //     }
    // }

    // (2) retrieve the fourth balance change (assuming there is at least one)
    //  which is the non fungible token that is returned to the user
    if let Some((_, (resource_address, balance_change))) = balance_changes.iter().nth(3) {
        mut_balance_change = balance_change.clone();
        non_fungible_id = mut_balance_change.added_non_fungibles();
    }

    // Test the `withdraw_lsu` method (fail)
    // provide invalid nft local id.

    let non_fungible_id_replica = BTreeSet::from([NonFungibleLocalId::integer(2)]);

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
        non_fungible_id.clone()
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);
    
}

#[test]
fn integration_test_update_supplier_kvs() {

    let mut test_runner = TestRunnerBuilder::new().build();
    let (public_key, _private_key, account_component) = test_runner.new_allocated_account();

    let (owner_badge, component_address, admin_badge, _transient, _nft) =
        create_flashloanpool(&mut test_runner, account_component, public_key);

    // deposit lsu to create the supplier indexmap and keyvaluestore
    // without there is nothing to update, and the 'update_supplier_kvs' will fail
    let receipt = deposit_lsu(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        XRD,
        Decimal::ONE
    );

    // Test the `update_supplier_kvs` method (succes - admin badge)
    let receipt = update_supplier_kvs(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        admin_badge
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(true);

    // Test the `update_supplier_hashmap` method (succes - owner badge)
    let receipt = update_supplier_kvs(
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

    let receipt = update_supplier_kvs(
        &mut test_runner, 
        public_key, 
        account_component, 
        component_address, 
        badge
    );

    println!("{:?}\n", receipt);

    receipt.expect_commit(false);
}
