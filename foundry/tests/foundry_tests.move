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

    // === Fund Project Tests ===

    #[test]
    fun test_fund_project_basic() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        
        // Creator creates a project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"test_project"),
                FUNDING_GOAL,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds the project
        ts::next_tx(&mut scenario, backer);
        {
            // Take project from CREATOR (the owner)
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            
            // Create payment coin (1 SUI = 1,000,000,000 MIST)
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(1_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            
            // Return project to CREATOR
            ts::return_to_address(CREATOR, project);
        };
        
        // Verify backer received Contribution object
        ts::next_tx(&mut scenario, backer);
        {
            // Backer should now own a Contribution object
            assert!(ts::has_most_recent_for_sender<foundry::Contribution>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_fund_project_multiple_contributions() {
        let mut scenario = ts::begin(CREATOR);
        let backer1 = @0xBABE;
        let backer2 = @0xBEEF;
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"multi_funding_project"),
                FUNDING_GOAL,
                DEADLINE,
                ctx
            );
        };
        
        // First backer contributes
        ts::next_tx(&mut scenario, backer1);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(2_000_000_000, ctx); // 2 SUI
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Second backer contributes
        ts::next_tx(&mut scenario, backer2);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(3_000_000_000, ctx); // 3 SUI
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Both backers should have Contribution objects
        ts::next_tx(&mut scenario, backer1);
        {
            assert!(ts::has_most_recent_for_sender<foundry::Contribution>(&scenario), 0);
        };
        
        ts::next_tx(&mut scenario, backer2);
        {
            assert!(ts::has_most_recent_for_sender<foundry::Contribution>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_fund_project_same_backer_multiple_times() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"repeated_funding_project"),
                FUNDING_GOAL,
                DEADLINE,
                ctx
            );
        };
        
        // Backer contributes first time
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(1_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Same backer contributes second time
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(500_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Backer should have 2 Contribution objects
        ts::next_tx(&mut scenario, backer);
        {
            // Each contribution creates a separate Contribution object
            assert!(ts::has_most_recent_for_sender<foundry::Contribution>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_fund_project_zero_amount() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"zero_funding_project"),
                FUNDING_GOAL,
                DEADLINE,
                ctx
            );
        };
        
        // Try to contribute 0 SUI (should fail)
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(0, ctx); // 0 SUI
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_fund_project_reaches_goal() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let small_goal = 5_000_000_000; // 5 SUI
        
        // Create project with smaller goal
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"small_goal_project"),
                small_goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer contributes exactly the goal amount
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(small_goal, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Verify funding was successful
        ts::next_tx(&mut scenario, backer);
        {
            assert!(ts::has_most_recent_for_sender<foundry::Contribution>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    // === Claim Funds Tests ===

    #[test]
    fun test_claim_funds_success() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let small_goal = 5_000_000_000; // 5 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"claimable_project"),
                small_goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds the project to meet goal
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(small_goal, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Owner claims funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::claim_funds(&mut project, ctx);
            
            ts::return_to_sender(&scenario, project);
        };
        
        // Verify owner received the coin
        ts::next_tx(&mut scenario, CREATOR);
        {
            // Owner should have received a Coin<SUI>
            assert!(ts::has_most_recent_for_sender<sui::coin::Coin<sui::sui::SUI>>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)] // ENotProjectOwner
    fun test_claim_funds_non_owner() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let non_owner = @0xDEAD;
        let small_goal = 5_000_000_000; // 5 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"unauthorized_claim"),
                small_goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds the project
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(small_goal, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Non-owner tries to claim (should fail)
        ts::next_tx(&mut scenario, non_owner);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::claim_funds(&mut project, ctx); // Should abort
            
            ts::return_to_address(CREATOR, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4)] // EFundingGoalNotMet
    fun test_claim_funds_goal_not_met() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let goal = 10_000_000_000; // 10 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"unmet_goal_project"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds only partially (5 SUI < 10 SUI goal)
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(5_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Owner tries to claim before goal is met (should fail)
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::claim_funds(&mut project, ctx); // Should abort
            
            ts::return_to_sender(&scenario, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 5)] // EProjectAlreadyFunded
    fun test_claim_funds_double_withdrawal() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let small_goal = 5_000_000_000; // 5 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"double_claim_project"),
                small_goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds the project
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(small_goal, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Owner claims funds (first time - success)
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::claim_funds(&mut project, ctx);
            
            ts::return_to_sender(&scenario, project);
        };
        
        // Owner tries to claim again (should fail)
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::claim_funds(&mut project, ctx); // Should abort
            
            ts::return_to_sender(&scenario, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_claim_funds_overfunded_project() {
        let mut scenario = ts::begin(CREATOR);
        let backer1 = @0xBABE;
        let backer2 = @0xBEEF;
        let goal = 5_000_000_000; // 5 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"overfunded_project"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // First backer funds 5 SUI (meets goal)
        ts::next_tx(&mut scenario, backer1);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(5_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Second backer adds 3 SUI more (overfunding)
        ts::next_tx(&mut scenario, backer2);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(3_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Owner claims all funds (8 SUI total)
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::claim_funds(&mut project, ctx);
            
            ts::return_to_sender(&scenario, project);
        };
        
        // Verify owner received the coin
        ts::next_tx(&mut scenario, CREATOR);
        {
            assert!(ts::has_most_recent_for_sender<sui::coin::Coin<sui::sui::SUI>>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_claim_funds_exactly_at_goal() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let goal = 10_000_000_000; // 10 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"exact_goal_project"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds exactly the goal amount
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(goal, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Owner claims funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::claim_funds(&mut project, ctx);
            
            ts::return_to_sender(&scenario, project);
        };
        
        // Verify claim was successful
        ts::next_tx(&mut scenario, CREATOR);
        {
            assert!(ts::has_most_recent_for_sender<sui::coin::Coin<sui::sui::SUI>>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    // === Reclaim Funds Tests ===

    #[test]
    fun test_reclaim_funds_success() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let goal = 10_000_000_000; // 10 SUI
        let contribution_amount = 3_000_000_000; // 3 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"failed_project"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds project (but not enough to reach goal)
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(contribution_amount, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Time passes, deadline reached, project failed
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let contribution = ts::take_from_sender<foundry::Contribution>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            let mut clock = sui::clock::create_for_testing(ctx);
            sui::clock::set_for_testing(&mut clock, DEADLINE + 1000); // Past deadline
            
            foundry::reclaim_funds(&mut project, contribution, &clock, ctx);
            
            sui::clock::destroy_for_testing(clock);
            ts::return_to_address(CREATOR, project);
        };
        
        // Verify backer received refund
        ts::next_tx(&mut scenario, backer);
        {
            assert!(ts::has_most_recent_for_sender<sui::coin::Coin<sui::sui::SUI>>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 7)] // EDeadlineNotPassed
    fun test_reclaim_funds_before_deadline() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let goal = 10_000_000_000; // 10 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"active_project"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds project
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(3_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Backer tries to reclaim BEFORE deadline (should fail)
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let contribution = ts::take_from_sender<foundry::Contribution>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            let mut clock = sui::clock::create_for_testing(ctx);
            sui::clock::set_for_testing(&mut clock, DEADLINE - 1000); // Before deadline
            
            foundry::reclaim_funds(&mut project, contribution, &clock, ctx); // Should abort
            
            sui::clock::destroy_for_testing(clock);
            ts::return_to_address(CREATOR, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 8)] // EFundingGoalMet
    fun test_reclaim_funds_goal_met() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let goal = 5_000_000_000; // 5 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"successful_project"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds project to reach goal
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(goal, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Backer tries to reclaim after deadline but goal was met (should fail)
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let contribution = ts::take_from_sender<foundry::Contribution>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            let mut clock = sui::clock::create_for_testing(ctx);
            sui::clock::set_for_testing(&mut clock, DEADLINE + 1000); // Past deadline
            
            foundry::reclaim_funds(&mut project, contribution, &clock, ctx); // Should abort
            
            sui::clock::destroy_for_testing(clock);
            ts::return_to_address(CREATOR, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 9)] // EInvalidContribution
    fun test_reclaim_funds_wrong_backer() {
        let mut scenario = ts::begin(CREATOR);
        let backer1 = @0xBABE;
        let backer2 = @0xBEEF;
        let goal = 10_000_000_000; // 10 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"failed_project"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer1 funds project
        ts::next_tx(&mut scenario, backer1);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(3_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Backer2 tries to use backer1's contribution (should fail)
        ts::next_tx(&mut scenario, backer2);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let contribution = ts::take_from_address<foundry::Contribution>(&scenario, backer1);
            let ctx = ts::ctx(&mut scenario);
            let mut clock = sui::clock::create_for_testing(ctx);
            sui::clock::set_for_testing(&mut clock, DEADLINE + 1000);
            
            foundry::reclaim_funds(&mut project, contribution, &clock, ctx); // Should abort
            
            sui::clock::destroy_for_testing(clock);
            ts::return_to_address(CREATOR, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_reclaim_funds_multiple_backers() {
        let mut scenario = ts::begin(CREATOR);
        let backer1 = @0xBABE;
        let backer2 = @0xBEEF;
        let goal = 10_000_000_000; // 10 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"failed_project_multi"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer1 funds project
        ts::next_tx(&mut scenario, backer1);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(3_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Backer2 funds project
        ts::next_tx(&mut scenario, backer2);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(4_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Backer1 reclaims after deadline
        ts::next_tx(&mut scenario, backer1);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let contribution = ts::take_from_sender<foundry::Contribution>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            let mut clock = sui::clock::create_for_testing(ctx);
            sui::clock::set_for_testing(&mut clock, DEADLINE + 1000);
            
            foundry::reclaim_funds(&mut project, contribution, &clock, ctx);
            
            sui::clock::destroy_for_testing(clock);
            ts::return_to_address(CREATOR, project);
        };
        
        // Backer2 reclaims after deadline
        ts::next_tx(&mut scenario, backer2);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let contribution = ts::take_from_sender<foundry::Contribution>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            let mut clock = sui::clock::create_for_testing(ctx);
            sui::clock::set_for_testing(&mut clock, DEADLINE + 1000);
            
            foundry::reclaim_funds(&mut project, contribution, &clock, ctx);
            
            sui::clock::destroy_for_testing(clock);
            ts::return_to_address(CREATOR, project);
        };
        
        // Verify both backers received refunds
        ts::next_tx(&mut scenario, backer1);
        {
            assert!(ts::has_most_recent_for_sender<sui::coin::Coin<sui::sui::SUI>>(&scenario), 0);
        };
        
        ts::next_tx(&mut scenario, backer2);
        {
            assert!(ts::has_most_recent_for_sender<sui::coin::Coin<sui::sui::SUI>>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_reclaim_funds_partial_contribution() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        let goal = 10_000_000_000; // 10 SUI
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"failed_project_partial"),
                goal,
                DEADLINE,
                ctx
            );
        };
        
        // Backer contributes twice (will have 2 Contribution objects)
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment1 = sui::coin::mint_for_testing<sui::sui::SUI>(2_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment1, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment2 = sui::coin::mint_for_testing<sui::sui::SUI>(3_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment2, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Backer reclaims first contribution only
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let contribution1 = ts::take_from_sender<foundry::Contribution>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            let mut clock = sui::clock::create_for_testing(ctx);
            sui::clock::set_for_testing(&mut clock, DEADLINE + 1000);
            
            foundry::reclaim_funds(&mut project, contribution1, &clock, ctx);
            
            sui::clock::destroy_for_testing(clock);
            ts::return_to_address(CREATOR, project);
        };
        
        // Verify backer received first refund
        ts::next_tx(&mut scenario, backer);
        {
            assert!(ts::has_most_recent_for_sender<sui::coin::Coin<sui::sui::SUI>>(&scenario), 0);
            // Second contribution should still exist
            assert!(ts::has_most_recent_for_sender<foundry::Contribution>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    // === Post Job Tests ===

    #[test]
    fun test_post_job_success() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"project_with_jobs"),
                5_000_000_000,
                DEADLINE,
                ctx
            );
        };
        
        // Owner posts a job
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::post_job(
                &mut project,
                string::utf8(b"Senior Blockchain Developer"),
                string::utf8(b"walrus_job_cid_123"),
                ctx
            );
            
            ts::return_to_sender(&scenario, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)] // ENotProjectOwner
    fun test_post_job_non_owner() {
        let mut scenario = ts::begin(CREATOR);
        let non_owner = @0xBAD;
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"unauthorized_job_post"),
                5_000_000_000,
                DEADLINE,
                ctx
            );
        };
        
        // Non-owner tries to post a job (should fail)
        ts::next_tx(&mut scenario, non_owner);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::post_job(
                &mut project,
                string::utf8(b"Unauthorized Job"),
                string::utf8(b"walrus_cid"),
                ctx
            ); // Should abort
            
            ts::return_to_address(CREATOR, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_post_multiple_jobs() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"multi_job_project"),
                10_000_000_000,
                DEADLINE,
                ctx
            );
        };
        
        // Owner posts first job
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::post_job(
                &mut project,
                string::utf8(b"Frontend Developer"),
                string::utf8(b"walrus_job_1"),
                ctx
            );
            
            ts::return_to_sender(&scenario, project);
        };
        
        // Owner posts second job
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::post_job(
                &mut project,
                string::utf8(b"Backend Developer"),
                string::utf8(b"walrus_job_2"),
                ctx
            );
            
            ts::return_to_sender(&scenario, project);
        };
        
        // Owner posts third job
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::post_job(
                &mut project,
                string::utf8(b"Marketing Manager"),
                string::utf8(b"walrus_job_3"),
                ctx
            );
            
            ts::return_to_sender(&scenario, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_post_job_after_funding() {
        let mut scenario = ts::begin(CREATOR);
        let backer = @0xBABE;
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"funded_job_project"),
                5_000_000_000,
                DEADLINE,
                ctx
            );
        };
        
        // Backer funds project
        ts::next_tx(&mut scenario, backer);
        {
            let mut project = ts::take_from_address<foundry::Project>(&scenario, CREATOR);
            let ctx = ts::ctx(&mut scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(6_000_000_000, ctx);
            
            foundry::fund_project(&mut project, payment, ctx);
            ts::return_to_address(CREATOR, project);
        };
        
        // Owner posts job after receiving funding
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::post_job(
                &mut project,
                string::utf8(b"Project Manager"),
                string::utf8(b"walrus_pm_job"),
                ctx
            );
            
            ts::return_to_sender(&scenario, project);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_post_job_with_long_title() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create project
        {
            let ctx = ts::ctx(&mut scenario);
            foundry::create_project(
                string::utf8(b"job_title_test"),
                5_000_000_000,
                DEADLINE,
                ctx
            );
        };
        
        // Owner posts a job with a long title
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut project = ts::take_from_sender<foundry::Project>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            foundry::post_job(
                &mut project,
                string::utf8(b"Senior Full-Stack Blockchain Developer with Experience in Move and Sui"),
                string::utf8(b"walrus_detailed_job_cid"),
                ctx
            );
            
            ts::return_to_sender(&scenario, project);
        };
        
        ts::end(scenario);
    }
}
