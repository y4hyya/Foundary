/**
 * Walrus Data Schemas
 * 
 * TypeScript interfaces for all JSON objects stored on Walrus decentralized storage.
 * These schemas define the structure of off-chain data referenced by CIDs in the smart contract.
 */

// ============================================================================
// PROJECT METADATA
// ============================================================================

/**
 * Main project metadata stored on Walrus
 * Referenced by Project.metadata_cid in the smart contract
 */
export interface ProjectMetadata {
  // Basic Information
  name: string;                    // Project name/title
  description: string;             // Full project description (markdown supported)
  shortDescription?: string;       // Brief summary for listings (max 200 chars)
  
  // Visual Assets
  logoCid?: string;                // Walrus CID for project logo/image
  bannerCid?: string;              // Walrus CID for banner image
  videoCid?: string;               // Walrus CID for promotional video
  galleryIds?: string[];           // Array of Walrus CIDs for image gallery
  
  // Categorization
  category: ProjectCategory;       // Primary category
  subcategory?: string;            // Optional subcategory
  tags: string[];                  // Searchable tags (e.g., ["DeFi", "NFT", "Gaming"])
  
  // Creator Information
  creator: CreatorInfo;            // Information about project creator
  team?: TeamMember[];             // Optional team members
  
  // Project Details
  milestones: Milestone[];         // Funding milestones and goals
  rewards?: Reward[];              // Backer rewards/perks
  risks: string;                   // Project risks and challenges (markdown)
  
  // Additional Information
  faq: FAQ[];                      // Frequently asked questions
  updates?: ProjectUpdate[];       // Historical project updates
  links?: ProjectLinks;            // External links (website, social media)
  
  // Metadata
  version: string;                 // Schema version (e.g., "1.0.0")
  createdAt: number;               // Unix timestamp
  updatedAt: number;               // Unix timestamp
}

/**
 * Project categories
 */
export const ProjectCategory = {
  TECHNOLOGY: "technology",
  ART: "art",
  GAMES: "games",
  DEFI: "defi",
  NFT: "nft",
  DAO: "dao",
  SOCIAL: "social",
  EDUCATION: "education",
  INFRASTRUCTURE: "infrastructure",
  OTHER: "other",
} as const;

export type ProjectCategory = typeof ProjectCategory[keyof typeof ProjectCategory];

/**
 * Creator information
 */
export interface CreatorInfo {
  name: string;                    // Creator name or pseudonym
  bio: string;                     // Creator biography
  avatarCid?: string;              // Walrus CID for profile picture
  walletAddress: string;           // Sui wallet address
  verified?: boolean;              // Verification status
  reputation?: number;             // Reputation score (0-100)
  previousProjects?: string[];     // Array of previous project IDs
}

/**
 * Team member information
 */
export interface TeamMember {
  name: string;
  role: string;                    // e.g., "Developer", "Designer", "Marketing"
  bio?: string;
  avatarCid?: string;              // Walrus CID
  walletAddress?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

/**
 * Project milestone
 */
export interface Milestone {
  id: string;                      // Unique milestone ID
  title: string;
  description: string;             // What will be achieved
  fundingTarget: number;           // Funding required (in MIST)
  deadline: number;                // Unix timestamp
  status: MilestoneStatus;
  deliverables?: string[];         // List of deliverables
  completedAt?: number;            // Unix timestamp when completed
}

/**
 * Milestone status
 */
export const MilestoneStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  DELAYED: "delayed",
  CANCELLED: "cancelled",
} as const;

export type MilestoneStatus = typeof MilestoneStatus[keyof typeof MilestoneStatus];

/**
 * Backer rewards/perks
 */
export interface Reward {
  id: string;
  title: string;
  description: string;
  minimumContribution: number;     // Minimum amount to qualify (in MIST)
  estimatedDelivery?: number;      // Unix timestamp
  limitedQuantity?: number;        // Max number available
  claimed?: number;                // Number already claimed
  imageCid?: string;               // Walrus CID for reward image
}

/**
 * Frequently Asked Question
 */
export interface FAQ {
  question: string;
  answer: string;                  // Markdown supported
  order?: number;                  // Display order
}

/**
 * Project update/announcement
 */
export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;                 // Markdown supported
  author: string;                  // Creator name
  timestamp: number;               // Unix timestamp
  imageCids?: string[];            // Optional images
  isPublic: boolean;               // Visible to all or backers only
}

/**
 * External links
 */
export interface ProjectLinks {
  website?: string;
  whitepaper?: string;
  github?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  medium?: string;
  youtube?: string;
  [key: string]: string | undefined; // Allow custom links
}

// ============================================================================
// JOB DESCRIPTION
// ============================================================================

/**
 * Job posting metadata stored on Walrus
 * Referenced by Job.description_cid in the smart contract
 */
export interface JobDescription {
  // Basic Information
  title: string;                   // Job title (duplicated from on-chain for convenience)
  description: string;             // Full job description (markdown supported)
  
  // Job Details
  responsibilities: string[];      // List of key responsibilities
  requirements: JobRequirements;   // Skills and qualifications required
  
  // Compensation
  compensation: Compensation;      // Payment details
  
  // Timeline
  duration: string;                // e.g., "3 months", "Ongoing", "Per milestone"
  startDate?: number;              // Unix timestamp (optional)
  deadline?: number;               // Application deadline (unix timestamp)
  
  // Additional Details
  workType: WorkType;              // Remote, hybrid, on-site
  experienceLevel: ExperienceLevel;
  applicationInstructions?: string; // How to apply
  attachmentCids?: string[];       // Additional documents (specs, designs, etc.)
  
  // Metadata
  version: string;                 // Schema version
  createdAt: number;               // Unix timestamp
  updatedAt: number;               // Unix timestamp
}

/**
 * Job requirements
 */
export interface JobRequirements {
  skills: string[];                // Required skills (e.g., ["Solidity", "React", "TypeScript"])
  education?: string;              // Education requirements
  experience?: string;             // Years of experience
  languages?: string[];            // Required languages
  timezone?: string;               // Preferred timezone or "Any"
  other?: string[];                // Other requirements
}

/**
 * Compensation details
 */
export interface Compensation {
  type: CompensationType;
  amount?: number;                 // Amount in MIST
  currency: "SUI" | "USD" | "OTHER";
  description?: string;            // Additional compensation details
  paymentSchedule?: string;        // e.g., "Weekly", "On completion", "Per milestone"
  additionalBenefits?: string[];   // e.g., ["Equity", "Token allocation"]
}

/**
 * Compensation types
 */
export const CompensationType = {
  FIXED: "fixed",                 // Fixed price
  HOURLY: "hourly",               // Hourly rate
  MILESTONE: "milestone",         // Per milestone
  EQUITY: "equity",               // Equity/tokens
  VOLUNTEER: "volunteer",         // Unpaid
  NEGOTIABLE: "negotiable",       // To be negotiated
} as const;

export type CompensationType = typeof CompensationType[keyof typeof CompensationType];

/**
 * Work type
 */
export const WorkType = {
  REMOTE: "remote",
  HYBRID: "hybrid",
  ON_SITE: "on_site",
} as const;

export type WorkType = typeof WorkType[keyof typeof WorkType];

/**
 * Experience level
 */
export const ExperienceLevel = {
  ENTRY: "entry",
  INTERMEDIATE: "intermediate",
  SENIOR: "senior",
  EXPERT: "expert",
  ANY: "any",
} as const;

export type ExperienceLevel = typeof ExperienceLevel[keyof typeof ExperienceLevel];

// ============================================================================
// FEEDBACK MESSAGE
// ============================================================================

/**
 * Feedback message metadata stored on Walrus
 * Referenced by Feedback.message_cid in the smart contract
 */
export interface FeedbackMessage {
  // Core Message
  message: string;                 // Main feedback content (markdown supported)
  
  // Rating
  rating?: number;                 // Star rating (1-5)
  sentiment?: Sentiment;           // Overall sentiment
  
  // Categories
  categories: FeedbackCategory[];  // What the feedback is about
  
  // Detailed Ratings (optional)
  detailedRatings?: {
    communication?: number;        // 1-5
    transparency?: number;         // 1-5
    progress?: number;             // 1-5
    teamResponsiveness?: number;   // 1-5
    valueForMoney?: number;        // 1-5
  };
  
  // Additional Information
  title?: string;                  // Brief title for the feedback
  pros?: string[];                 // What went well
  cons?: string[];                 // What could be improved
  suggestions?: string;            // Suggestions for improvement
  
  // Attachments
  attachmentCids?: string[];       // Screenshots, documents, etc.
  
  // Metadata
  isPublic: boolean;               // Public or private feedback
  isAnonymous: boolean;            // Hide backer identity
  version: string;                 // Schema version
  createdAt: number;               // Unix timestamp
  updatedAt?: number;              // Unix timestamp (if edited)
  editHistory?: FeedbackEdit[];    // Edit history for transparency
}

/**
 * Feedback sentiment
 */
export const Sentiment = {
  VERY_POSITIVE: "very_positive",
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  NEGATIVE: "negative",
  VERY_NEGATIVE: "very_negative",
} as const;

export type Sentiment = typeof Sentiment[keyof typeof Sentiment];

/**
 * Feedback categories
 */
export const FeedbackCategory = {
  COMMUNICATION: "communication",
  PROGRESS: "progress",
  QUALITY: "quality",
  TIMELINE: "timeline",
  TRANSPARENCY: "transparency",
  TEAM: "team",
  DELIVERABLES: "deliverables",
  VALUE: "value",
  GENERAL: "general",
  OTHER: "other",
} as const;

export type FeedbackCategory = typeof FeedbackCategory[keyof typeof FeedbackCategory];

/**
 * Feedback edit record
 */
export interface FeedbackEdit {
  editedAt: number;                // Unix timestamp
  reason?: string;                 // Why it was edited
  previousVersion?: string;        // Previous message content
}

// ============================================================================
// POLL DESCRIPTION (OPTIONAL EXTENDED DATA)
// ============================================================================

/**
 * Extended poll data (optional, for complex polls)
 * Can be referenced by a separate CID if needed
 */
export interface PollDescription {
  title: string;                   // Poll title
  description: string;             // Detailed explanation (markdown)
  context?: string;                // Background information
  
  // Options with extended info
  optionsDetails?: PollOptionDetail[];
  
  // Voting Details
  votingPeriod?: {
    start: number;                 // Unix timestamp
    end: number;                   // Unix timestamp
  };
  minimumVoters?: number;          // Quorum requirement
  
  // Resources
  attachmentCids?: string[];       // Supporting documents
  
  // Metadata
  version: string;
  createdAt: number;
}

/**
 * Extended option details for complex polls
 */
export interface PollOptionDetail {
  optionIndex: number;             // Matches on-chain option index
  description: string;             // Detailed explanation
  pros?: string[];                 // Advantages
  cons?: string[];                 // Disadvantages
  estimatedCost?: number;          // If applicable (in MIST)
  estimatedTime?: string;          // Time estimate
  resourcesCids?: string[];        // Related documents
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate ProjectMetadata schema
 */
export function validateProjectMetadata(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const metadata = data as ProjectMetadata;
  return (
    typeof metadata.name === 'string' &&
    typeof metadata.description === 'string' &&
    typeof metadata.category === 'string' &&
    Array.isArray(metadata.tags) &&
    typeof metadata.creator === 'object' &&
    Array.isArray(metadata.milestones) &&
    typeof metadata.risks === 'string' &&
    Array.isArray(metadata.faq) &&
    typeof metadata.version === 'string' &&
    typeof metadata.createdAt === 'number' &&
    typeof metadata.updatedAt === 'number'
  );
}

/**
 * Validate JobDescription schema
 */
export function validateJobDescription(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const job = data as JobDescription;
  return (
    typeof job.title === 'string' &&
    typeof job.description === 'string' &&
    Array.isArray(job.responsibilities) &&
    typeof job.requirements === 'object' &&
    typeof job.compensation === 'object' &&
    typeof job.duration === 'string' &&
    typeof job.version === 'string' &&
    typeof job.createdAt === 'number'
  );
}

/**
 * Validate FeedbackMessage schema
 */
export function validateFeedbackMessage(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const feedback = data as FeedbackMessage;
  return (
    typeof feedback.message === 'string' &&
    Array.isArray(feedback.categories) &&
    typeof feedback.isPublic === 'boolean' &&
    typeof feedback.isAnonymous === 'boolean' &&
    typeof feedback.version === 'string' &&
    typeof feedback.createdAt === 'number'
  );
}

// ============================================================================
// SCHEMA VERSION
// ============================================================================

/**
 * Current schema version for all Walrus data structures
 */
export const WALRUS_SCHEMA_VERSION = "1.0.0";

/**
 * Default values for optional fields
 */
export const DEFAULTS = {
  projectMetadata: {
    version: WALRUS_SCHEMA_VERSION,
    tags: [],
    faq: [],
    milestones: [],
  },
  jobDescription: {
    version: WALRUS_SCHEMA_VERSION,
    responsibilities: [],
    workType: WorkType.REMOTE,
    experienceLevel: ExperienceLevel.ANY,
  },
  feedbackMessage: {
    version: WALRUS_SCHEMA_VERSION,
    categories: [FeedbackCategory.GENERAL],
    isPublic: true,
    isAnonymous: false,
  },
} as const;

