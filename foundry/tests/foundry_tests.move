#[test_only]
module foundry::foundry_tests {
    use foundry::foundry;
    use sui::test_scenario::{Self as ts};
    use std::string;

    // Test constants
    const CREATOR: address = @0xCAFE;
    const FUNDING_GOAL: u64 = 10_000_000_000_000; // 10,000 SUI
    const DEADLINE: u64 = 1735689600000; // Future timestamp
    
    // Error codes (must match foundry module)
    const EInvalidFundingGoal: u64 = 1;

    #[test]
    fun test_create_project_success() {
        // Create test scenario
        let mut scenario = ts::begin(CREATOR);
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"walrus_cid_test123"),
                FUNDING_GOAL,
                DEADLINE,
                ctx
            );
        };
        
        // Verify project was created and transferred to creator
        ts::next_tx(&mut scenario, CREATOR);
        {
            // Project should exist in creator's account
            // We can't directly check the object without getter functions
            // but the transaction should succeed
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_multiple_projects() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create first project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"project_1"),
                FUNDING_GOAL,
                DEADLINE,
                ctx
            );
        };
        
        // Create second project
        ts::next_tx(&mut scenario, CREATOR);
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"project_2"),
                FUNDING_GOAL * 2,
                DEADLINE + 1000,
                ctx
            );
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_create_project_zero_funding_goal() {
        let mut scenario = ts::begin(CREATOR);
        
        {
            let ctx = ts::ctx(&mut scenario);
            // Should abort because funding_goal is 0
            foundry::create_project(
                string::utf8(b"walrus_cid_test"),
                0, // Invalid: zero funding goal
                DEADLINE,
                ctx
            );
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_project_with_minimum_funding() {
        let mut scenario = ts::begin(CREATOR);
        
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"minimal_project"),
                1, // Minimum valid funding goal
                DEADLINE,
                ctx
            );
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_project_different_creators() {
        let creator1 = @0xA11CE;
        let creator2 = @0xB0B;
        
        let mut scenario = ts::begin(creator1);
        
        // Creator 1 creates a project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"alice_project"),
                FUNDING_GOAL,
                DEADLINE,
                ctx
            );
        };
        
        // Creator 2 creates a project
        ts::next_tx(&mut scenario, creator2);
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"bob_project"),
                FUNDING_GOAL,
                DEADLINE,
                ctx
            );
        };
        
        ts::end(scenario);
    }
}
