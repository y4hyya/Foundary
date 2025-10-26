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

    /// Creates a new crowdfunding project
    /// 
    /// # Arguments
    /// * `metadata_cid` - Walrus Content Identifier for project metadata (title, description, etc.)
    /// * `funding_goal` - Target funding amount in MIST (1 SUI = 1_000_000_000 MIST)
    /// * `deadline` - Project deadline as Unix timestamp in milliseconds
    /// * `ctx` - Transaction context
    /// 
    /// # Returns
    /// Creates a new Project object and transfers it to the caller
    /// 
    /// # Aborts
    /// * `EInvalidFundingGoal` - If funding_goal is 0
    /// * `EDeadlinePassed` - If deadline is in the past (requires Clock for validation)
    /// 
    /// # Examples
    /// ```
    /// create_project(
    ///     string::utf8(b"walrus_cid_abc123"),
    ///     10_000_000_000_000,  // 10,000 SUI
    ///     1735689600000,       // Future timestamp
    ///     &mut ctx
    /// );
    /// ```
    public fun create_project(
        metadata_cid: String,
        funding_goal: u64,
        deadline: u64,
        ctx: &mut TxContext
    ) {
        // Validate funding goal
        assert!(funding_goal > 0, EInvalidFundingGoal);
        
        // Note: Deadline validation against current time would require Clock object
        // For now, we accept any future timestamp
        
        // Get the sender's address
        let sender = tx_context::sender(ctx);
        
        // Create new UID for the project
        let project_uid = object::new(ctx);
        let project_id = object::uid_to_address(&project_uid);
        
        // Create the Project object
        let project = Project {
            id: project_uid,
            owner: sender,
            funding_goal,
            current_funding: 0,
            deadline,
            metadata_cid,
            balance: balance::zero<SUI>(),
            contributors: table::new<address, u64>(ctx),
            jobs: table::new<u64, JobPlaceholder>(ctx),
            polls: table::new<u64, PollPlaceholder>(ctx),
            job_counter: 0,
            poll_counter: 0,
            is_withdrawn: false,
        };
        
        // Emit project created event
        event::emit(ProjectCreated {
            project_id,
            owner: sender,
            funding_goal,
            deadline,
            metadata_cid,
        });
        
        // Transfer the project to the caller
        transfer::transfer(project, sender);
    }

    /// Funds a project by contributing SUI tokens
    /// 
    /// Creates a Contribution receipt for the backer and adds funds to the project.
    /// The Contribution object serves as proof of backing and can be used for voting/rewards.
    /// 
    /// # Arguments
    /// * `project` - Mutable reference to the Project to fund
    /// * `payment` - Coin<SUI> object containing the contribution amount
    /// * `ctx` - Transaction context
    /// 
    /// # Returns
    /// Creates and transfers a Contribution object to the backer
    /// 
    /// # Aborts
    /// * `EDeadlinePassed` - If the project deadline has passed (requires Clock for validation)
    /// * `EInsufficientFunds` - If payment amount is 0
    /// 
    /// # Examples
    /// ```
    /// let payment = coin::split(&mut sui_coin, 1_000_000_000, ctx); // 1 SUI
    /// fund_project(&mut project, payment, ctx);
    /// // Backer receives Contribution object as receipt
    /// ```
    public fun fund_project(
        project: &mut Project,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Get contribution amount
        let amount = coin::value(&payment);
        
        // Validate contribution amount
        assert!(amount > 0, EInsufficientFunds);
        
        // Note: Deadline validation would require Clock object
        // For now, we allow contributions at any time
        
        // Get backer's address
        let backer = tx_context::sender(ctx);
        
        // Get project ID for the Contribution
        let project_id = object::id(project);
        
        // Convert Coin to Balance and merge into project balance
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut project.balance, coin_balance);
        
        // Update current funding
        project.current_funding = project.current_funding + amount;
        
        // Update contributors table (add to existing or create new entry)
        if (table::contains(&project.contributors, backer)) {
            let existing_amount = table::remove(&mut project.contributors, backer);
            table::add(&mut project.contributors, backer, existing_amount + amount);
        } else {
            table::add(&mut project.contributors, backer, amount);
        };
        
        // Create Contribution receipt for the backer
        let contribution = Contribution {
            id: object::new(ctx),
            project_id,
            backer_address: backer,
            amount,
        };
        
        // Emit contribution event
        event::emit(ContributionMade {
            project_id: object::id_to_address(&project_id),
            contributor: backer,
            amount,
            total_funded: project.current_funding,
        });
        
        // Transfer Contribution receipt to backer
        transfer::transfer(contribution, backer);
    }

    /// Allows the project owner to claim funds after reaching the funding goal
    /// 
    /// The owner can withdraw all accumulated SUI tokens once the funding goal is met.
    /// This function ensures only the legitimate owner can claim funds and prevents
    /// double withdrawal.
    /// 
    /// # Arguments
    /// * `project` - Mutable reference to the Project
    /// * `ctx` - Transaction context
    /// 
    /// # Returns
    /// Transfers all SUI balance to the project owner
    /// 
    /// # Aborts
    /// * `ENotProjectOwner` - If caller is not the project owner
    /// * `EFundingGoalNotMet` - If current_funding < funding_goal
    /// * `EProjectAlreadyFunded` - If funds have already been withdrawn
    /// 
    /// # Examples
    /// ```
    /// // Owner claims funds after goal is reached
    /// claim_funds(&mut project, ctx);
    /// // All SUI transferred to owner's wallet
    /// ```
    public fun claim_funds(
        project: &mut Project,
        ctx: &mut TxContext
    ) {
        // Get caller's address
        let caller = tx_context::sender(ctx);
        
        // Verify caller is the project owner
        assert!(caller == project.owner, ENotProjectOwner);
        
        // Verify funding goal has been met
        assert!(project.current_funding >= project.funding_goal, EFundingGoalNotMet);
        
        // Verify funds have not already been withdrawn
        assert!(!project.is_withdrawn, EProjectAlreadyFunded);
        
        // Get the total balance amount
        let total_balance = balance::value(&project.balance);
        
        // Extract all balance from project
        let withdrawn_balance = balance::withdraw_all(&mut project.balance);
        
        // Convert balance to coin for transfer
        let payment_coin = coin::from_balance(withdrawn_balance, ctx);
        
        // Mark project as withdrawn
        project.is_withdrawn = true;
        
        // Emit funds withdrawn event
        event::emit(FundsWithdrawn {
            project_id: object::uid_to_address(&project.id),
            owner: caller,
            amount: total_balance,
        });
        
        // Transfer the coin to the owner
        transfer::public_transfer(payment_coin, caller);
    }

    // === Private Functions ===
    // To be implemented in subsequent prompts

    // === Test Functions ===
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Test initialization function
    }
}

