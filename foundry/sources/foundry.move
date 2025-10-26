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
    use std::vector;
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
    const EDeadlineNotPassed: u64 = 7;
    const EFundingGoalMet: u64 = 8;
    const EInvalidContribution: u64 = 9;
    const EPollNotFound: u64 = 10;
    const EInvalidOption: u64 = 11;
    const EAlreadyVoted: u64 = 12;

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
        
        /// Table storing jobs/tasks for the project
        /// Key: job ID, Value: Job struct
        jobs: Table<u64, Job>,
        
        /// Table storing polls/voting items for the project
        /// Key: poll ID, Value: Poll struct
        polls: Table<u64, Poll>,
        
        /// Counter for generating unique job IDs
        job_counter: u64,
        
        /// Counter for generating unique poll IDs
        poll_counter: u64,
        
        /// Flag indicating if funds have been withdrawn by owner
        is_withdrawn: bool,
    }

    /// Job struct representing a job posting within a crowdfunding project
    /// 
    /// Jobs allow project owners to post opportunities, tasks, or positions related
    /// to their funded project. The description is stored off-chain via Walrus.
    public struct Job has store, drop {
        /// Unique identifier for the job (matches the table key)
        id: u64,
        
        /// Title of the job/task
        title: String,
        
        /// Walrus Content Identifier (CID) for detailed job description
        /// Stores reference to JSON with full job details, requirements, etc.
        description_cid: String,
    }

    /// Poll struct representing a decentralized voting poll within a project
    /// 
    /// Polls allow project stakeholders to vote on decisions. Each poll has a question,
    /// multiple options, and tracks votes to prevent double voting.
    public struct Poll has store {
        /// Unique identifier for the poll
        id: UID,
        
        /// The question being asked in the poll
        question: String,
        
        /// List of available voting options
        options: vector<String>,
        
        /// Vote count for each option (option index -> vote count)
        votes: Table<u64, u64>,
        
        /// Tracks who has voted to prevent double voting (voter address -> has_voted)
        voters: Table<address, bool>,
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

    /// Feedback struct representing contributor feedback to project owners
    /// 
    /// Contributors can submit feedback about projects they've backed. Feedback is
    /// transferred to the project owner as an on-chain message with off-chain content.
    public struct Feedback has key, store {
        /// Unique identifier for the feedback
        id: UID,
        
        /// Reference to the Project this feedback is about
        project_id: ID,
        
        /// Address of the contributor who submitted the feedback
        backer_address: address,
        
        /// Walrus Content Identifier (CID) for the feedback message
        /// Stores reference to the actual feedback content (text, multimedia, etc.)
        message_cid: String,
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

    /// Event emitted when a backer reclaims their funds after project failure
    public struct RefundIssued has copy, drop {
        project_id: address,
        backer: address,
        amount: u64,
    }

    /// Event emitted when a job is posted to a project
    public struct JobPosted has copy, drop {
        project_id: address,
        job_id: u64,
        title: String,
        description_cid: String,
    }

    /// Event emitted when a poll is created in a project
    public struct PollCreated has copy, drop {
        project_id: address,
        poll_id: u64,
        question: String,
        options_count: u64,
    }

    /// Event emitted when a vote is cast on a poll
    public struct VoteCast has copy, drop {
        project_id: address,
        poll_id: u64,
        voter: address,
        option_index: u64,
        new_vote_count: u64,
    }

    /// Event emitted when feedback is submitted to a project owner
    public struct FeedbackSubmitted has copy, drop {
        feedback_id: address,
        project_id: address,
        backer: address,
        message_cid: String,
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
            jobs: table::new<u64, Job>(ctx),
            polls: table::new<u64, Poll>(ctx),
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

    /// Allows backers to reclaim their funds if the project fails to meet its goal
    /// 
    /// Backers can get a full refund if the project deadline has passed and the
    /// funding goal was not met. This function burns the Contribution object and
    /// returns the original SUI amount to the backer.
    /// 
    /// # Arguments
    /// * `project` - Mutable reference to the Project
    /// * `contribution` - The Contribution object to be refunded (will be burned)
    /// * `clock` - Clock object for deadline verification
    /// * `ctx` - Transaction context
    /// 
    /// # Returns
    /// Transfers SUI back to the backer and burns the Contribution object
    /// 
    /// # Aborts
    /// * `EDeadlineNotPassed` - If the project deadline hasn't passed yet
    /// * `EFundingGoalMet` - If the project successfully met its funding goal
    /// * `EInvalidContribution` - If the contribution doesn't belong to the caller
    /// 
    /// # Examples
    /// ```
    /// // After deadline passes and project fails
    /// reclaim_funds(&mut project, contribution, &clock, ctx);
    /// // Backer receives their SUI back
    /// ```
    public fun reclaim_funds(
        project: &mut Project,
        contribution: Contribution,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Get caller's address
        let caller = tx_context::sender(ctx);
        
        // Verify deadline has passed
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time > project.deadline, EDeadlineNotPassed);
        
        // Verify funding goal was not met
        assert!(project.current_funding < project.funding_goal, EFundingGoalMet);
        
        // Verify the contribution belongs to the caller
        assert!(contribution.backer_address == caller, EInvalidContribution);
        
        // Get the refund amount from the contribution
        let refund_amount = contribution.amount;
        
        // Get project ID for event
        let project_id = object::uid_to_address(&project.id);
        
        // Destructure and burn the Contribution object
        let Contribution { id, project_id: _, backer_address: _, amount: _ } = contribution;
        object::delete(id);
        
        // Withdraw the refund amount from project balance
        let refund_balance = balance::split(&mut project.balance, refund_amount);
        
        // Convert to coin for transfer
        let refund_coin = coin::from_balance(refund_balance, ctx);
        
        // Update project current_funding
        project.current_funding = project.current_funding - refund_amount;
        
        // Update contributors table - remove or update entry
        if (table::contains(&project.contributors, caller)) {
            let current_contribution = table::remove(&mut project.contributors, caller);
            let remaining = current_contribution - refund_amount;
            if (remaining > 0) {
                table::add(&mut project.contributors, caller, remaining);
            };
        };
        
        // Emit refund event
        event::emit(RefundIssued {
            project_id,
            backer: caller,
            amount: refund_amount,
        });
        
        // Transfer the refund to the backer
        transfer::public_transfer(refund_coin, caller);
    }

    /// Posts a new job to a crowdfunding project
    /// 
    /// Allows project owners to create job postings related to their funded project.
    /// Job descriptions are stored off-chain via Walrus for detailed content.
    /// 
    /// # Arguments
    /// * `project` - Mutable reference to the Project
    /// * `title` - Title of the job/task
    /// * `description_cid` - Walrus Content Identifier for detailed job description
    /// * `ctx` - Transaction context
    /// 
    /// # Returns
    /// Adds the job to the project's jobs table
    /// 
    /// # Aborts
    /// * `ENotProjectOwner` - If caller is not the project owner
    /// 
    /// # Examples
    /// ```
    /// // Owner posts a job to their project
    /// post_job(&mut project, string::utf8(b"Senior Developer"), string::utf8(b"walrus_cid_xyz"), ctx);
    /// // Job is added to project.jobs table
    /// ```
    public fun post_job(
        project: &mut Project,
        title: String,
        description_cid: String,
        ctx: &mut TxContext
    ) {
        // Get caller's address
        let caller = tx_context::sender(ctx);
        
        // Verify caller is the project owner
        assert!(caller == project.owner, ENotProjectOwner);
        
        // Increment job counter to get new job ID
        let job_id = project.job_counter;
        project.job_counter = project.job_counter + 1;
        
        // Create new Job
        let job = Job {
            id: job_id,
            title,
            description_cid,
        };
        
        // Add job to project's jobs table
        table::add(&mut project.jobs, job_id, job);
        
        // Emit job posted event
        event::emit(JobPosted {
            project_id: object::uid_to_address(&project.id),
            job_id,
            title,
            description_cid,
        });
    }

    /// Creates a new poll for decentralized voting within a project
    /// 
    /// Allows project owners to create polls for decision-making. Each poll has a question
    /// and multiple voting options. Voters are tracked to prevent double voting.
    /// 
    /// # Arguments
    /// * `project` - Mutable reference to the Project
    /// * `question` - The question to be voted on
    /// * `options` - Vector of voting options
    /// * `ctx` - Transaction context
    /// 
    /// # Returns
    /// Adds the poll to the project's polls table
    /// 
    /// # Aborts
    /// * `ENotProjectOwner` - If caller is not the project owner
    /// 
    /// # Examples
    /// ```
    /// // Owner creates a poll
    /// let options = vector[string::utf8(b"Option A"), string::utf8(b"Option B")];
    /// create_poll(&mut project, string::utf8(b"Which feature?"), options, ctx);
    /// // Poll is added to project.polls table
    /// ```
    public fun create_poll(
        project: &mut Project,
        question: String,
        options: vector<String>,
        ctx: &mut TxContext
    ) {
        // Get caller's address
        let caller = tx_context::sender(ctx);
        
        // Verify caller is the project owner
        assert!(caller == project.owner, ENotProjectOwner);
        
        // Increment poll counter to get new poll ID
        let poll_id = project.poll_counter;
        project.poll_counter = project.poll_counter + 1;
        
        // Create new UID for the poll
        let poll_uid = object::new(ctx);
        
        // Initialize votes table with zero votes for each option
        let mut votes = table::new<u64, u64>(ctx);
        let mut i = 0;
        let options_count = vector::length(&options);
        while (i < options_count) {
            table::add(&mut votes, i, 0);
            i = i + 1;
        };
        
        // Create new Poll
        let poll = Poll {
            id: poll_uid,
            question,
            options,
            votes,
            voters: table::new<address, bool>(ctx),
        };
        
        // Add poll to project's polls table
        table::add(&mut project.polls, poll_id, poll);
        
        // Emit poll created event
        event::emit(PollCreated {
            project_id: object::uid_to_address(&project.id),
            poll_id,
            question,
            options_count,
        });
    }

        /// Casts a vote on a poll within a project
        /// 
        /// Allows contributors to vote on polls. Each contributor can only vote once per poll.
        /// The Contribution object serves as proof of backing and voting eligibility.
        /// 
        /// # Arguments
        /// * `project` - Mutable reference to the Project containing the poll
        /// * `poll_id` - ID of the poll to vote on
        /// * `contribution` - Immutable reference to the voter's Contribution object (proof of backing)
        /// * `option_index` - Index of the option to vote for (0-based)
        /// * `ctx` - Transaction context
        /// 
        /// # Returns
        /// Updates the poll's vote count for the chosen option
        /// 
        /// # Aborts
        /// * `EPollNotFound` - If the poll_id doesn't exist in the project
        /// * `EInvalidContribution` - If the contribution is not for this project
        /// * `EInvalidOption` - If the option_index is out of bounds
        /// * `EAlreadyVoted` - If the voter has already voted on this poll
        /// 
        /// # Examples
        /// ```
        /// // Contributor votes on poll option 0
        /// vote_on_poll(&mut project, 0, &contribution, 0, ctx);
        /// // Vote count for option 0 is incremented
        /// ```
        public fun vote_on_poll(
            project: &mut Project,
            poll_id: u64,
            contribution: &Contribution,
            option_index: u64,
            ctx: &mut TxContext
        ) {
            // Get caller's address
            let caller = tx_context::sender(ctx);
            
            // Verify the poll exists in the project
            assert!(table::contains(&project.polls, poll_id), EPollNotFound);
            
            // Verify the contribution is for this project
            let project_id = object::id(project);
            assert!(contribution.project_id == project_id, EInvalidContribution);
            
            // Verify the caller owns the contribution
            assert!(contribution.backer_address == caller, EInvalidContribution);
            
            // Borrow mutable reference to the poll
            let poll = table::borrow_mut(&mut project.polls, poll_id);
            
            // Verify the option index is valid
            let options_count = vector::length(&poll.options);
            assert!(option_index < options_count, EInvalidOption);
            
            // Verify the caller hasn't voted yet
            assert!(!table::contains(&poll.voters, caller), EAlreadyVoted);
            
            // Get current vote count for the option
            let current_votes = *table::borrow(&poll.votes, option_index);
            
            // Increment the vote count
            let new_vote_count = current_votes + 1;
            *table::borrow_mut(&mut poll.votes, option_index) = new_vote_count;
            
            // Mark the caller as having voted
            table::add(&mut poll.voters, caller, true);
            
            // Emit vote cast event
            event::emit(VoteCast {
                project_id: object::id_to_address(&project_id),
                poll_id,
                voter: caller,
                option_index,
                new_vote_count,
            });
        }

        /// Submits feedback from a contributor to the project owner
        /// 
        /// Allows contributors to send feedback messages to project owners. The Contribution
        /// object serves as proof of backing. Feedback is stored as an on-chain object with
        /// off-chain content (via Walrus CID) and transferred to the project owner.
        /// 
        /// # Arguments
        /// * `project` - Immutable reference to the Project to give feedback on
        /// * `contribution` - Immutable reference to the contributor's Contribution object (proof of backing)
        /// * `message_cid` - Walrus Content Identifier for the feedback message content
        /// * `ctx` - Transaction context
        /// 
        /// # Returns
        /// Creates a Feedback object and transfers it to the project owner
        /// 
        /// # Aborts
        /// * `EInvalidContribution` - If the contribution is not for this project or caller doesn't own it
        /// 
        /// # Examples
        /// ```
        /// // Contributor submits feedback
        /// submit_feedback(&project, &contribution, string::utf8(b"walrus_cid_feedback123"), ctx);
        /// // Project owner receives Feedback object
        /// ```
        public fun submit_feedback(
            project: &Project,
            contribution: &Contribution,
            message_cid: String,
            ctx: &mut TxContext
        ) {
            // Get caller's address
            let caller = tx_context::sender(ctx);
            
            // Verify the contribution is for this project
            let project_id = object::id(project);
            assert!(contribution.project_id == project_id, EInvalidContribution);
            
            // Verify the caller owns the contribution
            assert!(contribution.backer_address == caller, EInvalidContribution);
            
            // Create new UID for the feedback
            let feedback_uid = object::new(ctx);
            let feedback_id = object::uid_to_address(&feedback_uid);
            
            // Create the Feedback object
            let feedback = Feedback {
                id: feedback_uid,
                project_id,
                backer_address: caller,
                message_cid,
            };
            
            // Emit feedback submitted event
            event::emit(FeedbackSubmitted {
                feedback_id,
                project_id: object::id_to_address(&project_id),
                backer: caller,
                message_cid,
            });
            
            // Transfer feedback to the project owner
            transfer::transfer(feedback, project.owner);
        }

        // === Private Functions ===
        // To be implemented in subsequent prompts

        // === Test Functions ===
        #[test_only]
        public fun init_for_testing(ctx: &mut TxContext) {
            // Test initialization function
        }
    }

