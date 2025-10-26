/// Module: foundry
/// 
/// A decentralized crowdfunding platform built on Sui blockchain with Walrus storage integration.
/// Enables creation of funding projects, contributor management, and dynamic content (jobs/polls).
module foundry::foundry {
    // === Imports ===
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use std::string::String;
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::event;

    // === Errors ===
    const EInvalidFundingGoal: u64 = 1;
    const EDeadlinePassed: u64 = 2;
    const ENotProjectOwner: u64 = 3;
    const EFundingGoalNotMet: u64 = 4;
    const EProjectAlreadyFunded: u64 = 5;
    const EInsufficientFunds: u64 = 6;

    // === Structs ===

    /// Core Project structure representing a crowdfunding campaign
    /// 
    /// The Project struct stores all essential information about a crowdfunding project,
    /// including funding details, metadata reference (Walrus CID), and dynamic content.
    public struct Project has key, store {
        /// Unique identifier for the project
        id: UID,
        
        /// Address of the project creator/owner
        owner: address,
        
        /// Target funding amount in MIST (1 SUI = 1_000_000_000 MIST)
        funding_goal: u64,
        
        /// Current amount of funds raised in MIST
        current_funding: u64,
        
        /// Project deadline as Unix timestamp in milliseconds
        deadline: u64,
        
        /// Walrus Content Identifier (CID) for project metadata
        /// Stores reference to JSON metadata containing title, description, etc.
        metadata_cid: String,
        
        /// Balance holding the actual SUI tokens contributed to the project
        balance: Balance<SUI>,
        
        /// Table storing contributor addresses and their contribution amounts
        /// Key: contributor address, Value: contribution amount in MIST
        contributors: Table<address, u64>,
        
        /// Table storing jobs/tasks for the project (to be implemented)
        /// Key: job ID, Value: Job struct (placeholder for future implementation)
        jobs: Table<u64, JobPlaceholder>,
        
        /// Table storing polls/voting items for the project (to be implemented)
        /// Key: poll ID, Value: Poll struct (placeholder for future implementation)
        polls: Table<u64, PollPlaceholder>,
        
        /// Counter for generating unique job IDs
        job_counter: u64,
        
        /// Counter for generating unique poll IDs
        poll_counter: u64,
        
        /// Flag indicating if funds have been withdrawn by owner
        is_withdrawn: bool,
    }

    /// Placeholder struct for Job functionality (to be implemented in future prompts)
    public struct JobPlaceholder has store, drop {
        placeholder: bool,
    }

    /// Placeholder struct for Poll functionality (to be implemented in future prompts)
    public struct PollPlaceholder has store, drop {
        placeholder: bool,
    }

    /// Contribution struct - Serves as a receipt/proof of backing
    /// 
    /// This object is transferred to contributors as a receipt when they fund a project.
    /// It can be used to prove participation, claim rewards, or exercise voting rights.
    public struct Contribution has key, store {
        /// Unique identifier for the contribution receipt
        id: UID,
        
        /// Reference to the Project's UID that this contribution is for
        project_id: ID,
        
        /// Address of the backer who made the contribution
        backer_address: address,
        
        /// Amount contributed in MIST (1 SUI = 1_000_000_000 MIST)
        amount: u64,
    }

    /// Event emitted when a new project is created
    public struct ProjectCreated has copy, drop {
        project_id: address,
        owner: address,
        funding_goal: u64,
        deadline: u64,
        metadata_cid: String,
    }

    /// Event emitted when a contribution is made to a project
    public struct ContributionMade has copy, drop {
        project_id: address,
        contributor: address,
        amount: u64,
        total_funded: u64,
    }

    /// Event emitted when project funds are withdrawn
    public struct FundsWithdrawn has copy, drop {
        project_id: address,
        owner: address,
        amount: u64,
    }

    // === Public Functions ===
    // To be implemented in subsequent prompts

    // === Private Functions ===
    // To be implemented in subsequent prompts

    // === Test Functions ===
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Test initialization function
    }
}

