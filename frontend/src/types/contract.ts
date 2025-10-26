/**
 * TypeScript types for Sui Move contract objects
 */

// Project object from the smart contract
export interface Project {
  id: {
    id: string;
  };
  owner: string;
  funding_goal: string;
  current_funding: string;
  deadline: string;
  metadata_cid: string;
  balance: string;
  job_counter: string;
  poll_counter: string;
  is_withdrawn: boolean;
}

// Contribution object (receipt of backing)
export interface Contribution {
  id: {
    id: string;
  };
  project_id: string;
  backer_address: string;
  amount: string;
}

// Job posting
export interface Job {
  id: string;
  title: string;
  description_cid: string;
}

// Poll for voting
export interface Poll {
  id: {
    id: string;
  };
  question: string;
  options: string[];
  votes: Record<string, string>; // option_index -> vote_count
  voters: Record<string, boolean>; // address -> has_voted
}

// Feedback object
export interface Feedback {
  id: {
    id: string;
  };
  project_id: string;
  backer_address: string;
  message_cid: string;
}

// Project metadata stored in Walrus
export interface ProjectMetadata {
  title: string;
  description: string;
  category: string;
  image_url?: string;
  tags?: string[];
  creator_info?: {
    name: string;
    bio?: string;
    avatar_url?: string;
  };
  milestones?: {
    title: string;
    description: string;
    deadline: number;
  }[];
  risks?: string;
  faq?: {
    question: string;
    answer: string;
  }[];
}

// Job metadata stored in Walrus
export interface JobMetadata {
  description: string;
  requirements?: string[];
  compensation?: string;
  duration?: string;
  skills?: string[];
}

// Feedback metadata stored in Walrus
export interface FeedbackMetadata {
  message: string;
  rating?: number;
  timestamp: number;
}

// Contract events
export interface ProjectCreatedEvent {
  project_id: string;
  owner: string;
  funding_goal: string;
  deadline: string;
  metadata_cid: string;
}

export interface ContributionMadeEvent {
  project_id: string;
  contribution_id: string;
  backer: string;
  amount: string;
}

export interface FundsWithdrawnEvent {
  project_id: string;
  owner: string;
  amount: string;
}

export interface RefundIssuedEvent {
  project_id: string;
  backer: string;
  amount: string;
}

export interface JobPostedEvent {
  project_id: string;
  job_id: string;
  title: string;
}

export interface PollCreatedEvent {
  project_id: string;
  poll_id: string;
  question: string;
}

export interface VoteCastEvent {
  poll_id: string;
  voter: string;
  option_index: string;
}

export interface FeedbackSubmittedEvent {
  project_id: string;
  feedback_id: string;
  backer: string;
}

