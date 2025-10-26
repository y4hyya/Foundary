/**
 * Central type exports
 * 
 * Re-exports all TypeScript types for easy importing throughout the application
 */

// Contract types (on-chain data structures)
export type {
  Project,
  Contribution,
  Job,
  Poll,
  Feedback,
  ProjectCreatedEvent,
  ContributionMadeEvent,
  FundsWithdrawnEvent,
  RefundIssuedEvent,
  JobPostedEvent,
  PollCreatedEvent,
  VoteCastEvent,
  FeedbackSubmittedEvent,
} from './contract';

// Walrus schemas (off-chain data structures)
export type {
  // Project Metadata
  ProjectMetadata,
  CreatorInfo,
  TeamMember,
  Milestone,
  Reward,
  FAQ,
  ProjectUpdate,
  ProjectLinks,
  
  // Job Description
  JobDescription,
  JobRequirements,
  Compensation,
  
  // Feedback Message
  FeedbackMessage,
  FeedbackEdit,
  
  // Poll Description
  PollDescription,
  PollOptionDetail,
} from './walrus';

// Walrus enums
export {
  ProjectCategory,
  MilestoneStatus,
  CompensationType,
  WorkType,
  ExperienceLevel,
  Sentiment,
  FeedbackCategory,
} from './walrus';

// Walrus validation functions
export {
  validateProjectMetadata,
  validateJobDescription,
  validateFeedbackMessage,
  WALRUS_SCHEMA_VERSION,
  DEFAULTS,
} from './walrus';

// Walrus client types
export type { WalrusUploadResponse, WalrusError } from '../utils/walrusClient';

