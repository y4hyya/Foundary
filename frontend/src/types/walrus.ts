/**
 * Walrus Data Types
 * 
 * TypeScript interfaces for data structures stored on Walrus
 * decentralized storage protocol
 */

// Project Categories
export type ProjectCategory = 
  | 'technology'
  | 'art'
  | 'music'
  | 'gaming'
  | 'education'
  | 'health'
  | 'food'
  | 'fashion'
  | 'travel'
  | 'business'
  | 'charity'
  | 'other';

// Work Types for Jobs
export type WorkType = 'remote' | 'hybrid' | 'on_site';

// Experience Levels for Jobs
export type ExperienceLevel = 'any' | 'entry' | 'intermediate' | 'senior' | 'expert';

// Compensation Types for Jobs
export type CompensationType = 'negotiable' | 'fixed' | 'hourly' | 'milestone' | 'equity' | 'volunteer';

// Milestone Status
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

// Feedback Categories
export type FeedbackCategory = 'general' | 'bug_report' | 'feature_request' | 'complaint' | 'praise';

/**
 * Project Metadata stored on Walrus
 * Contains all the rich information about a project
 */
export interface ProjectMetadata {
  // Basic Information
  name: string;
  description: string;
  logoCid: string; // Walrus CID for project logo
  
  // Categorization
  category: ProjectCategory;
  tags: string[];
  
  // Creator Information
  creator: {
    name: string;
    email?: string;
    website?: string;
    isVerified: boolean;
  };
  
  // Social Links
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
  
  // Project Details
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    deadline: number; // Unix timestamp
    status: MilestoneStatus;
  }>;
  
  risks?: string;
  
  // FAQ Section
  faq: Array<{
    question: string;
    answer: string;
  }>;
  
  // Metadata
  version: string;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

/**
 * Job Description stored on Walrus
 * Contains detailed information about a job posting
 */
export interface JobDescription {
  // Basic Information
  title: string;
  description: string;
  
  // Job Details
  responsibilities: string[];
  
  requirements: {
    skills: string[];
    experience: string;
    education?: string;
  };
  
  compensation: {
    type: CompensationType;
    amount?: number;
    currency?: string;
    description?: string;
  };
  
  duration: string; // e.g., "Full-time", "Part-time", "Contract"
  workType: WorkType;
  experienceLevel: ExperienceLevel;
  location?: string;
  benefits: string[];
  
  // Application Process
  applicationInstructions: string;
  contactEmail?: string;
  
  // Metadata
  version: string;
  createdAt: number; // Unix timestamp
}

/**
 * Feedback Message stored on Walrus
 * Contains user feedback about a project
 */
export interface FeedbackMessage {
  // Message Content
  message: string;
  rating?: number; // 1-5 star rating
  
  // Categorization
  category: FeedbackCategory;
  
  // Privacy
  isAnonymous: boolean;
  contactEmail?: string;
  
  // Metadata
  version: string;
  createdAt: number; // Unix timestamp
}

/**
 * Poll Data stored on Walrus
 * Contains poll question and options for voting
 */
export interface PollData {
  question: string;
  description?: string;
  options: string[];
  allowMultipleVotes: boolean;
  isActive: boolean;
  expiresAt?: number; // Unix timestamp
  
  // Metadata
  version: string;
  createdAt: number; // Unix timestamp
}

/**
 * Update/Announcement stored on Walrus
 * Contains project updates and announcements
 */
export interface ProjectUpdate {
  title: string;
  content: string;
  type: 'update' | 'milestone' | 'announcement' | 'issue';
  isPublic: boolean;
  
  // Media
  images?: string[]; // Array of Walrus CIDs
  attachments?: Array<{
    name: string;
    cid: string;
    type: string;
    size: number;
  }>;
  
  // Metadata
  version: string;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

/**
 * User Profile stored on Walrus
 * Contains user profile information
 */
export interface UserProfile {
  // Basic Information
  name: string;
  bio?: string;
  avatarCid?: string; // Walrus CID for profile picture
  
  // Contact Information
  email?: string;
  website?: string;
  
  // Social Links
  socialLinks: Array<{
    platform: string;
    url: string;
    username?: string;
  }>;
  
  // Professional Information
  skills: string[];
  experience?: string;
  location?: string;
  
  // Preferences
  preferences: {
    notifications: boolean;
    publicProfile: boolean;
    showEmail: boolean;
  };
  
  // Metadata
  version: string;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

/**
 * Project Application stored on Walrus
 * Contains job application information
 */
export interface JobApplication {
  // Application Details
  coverLetter: string;
  resumeCid?: string; // Walrus CID for resume file
  portfolioLinks?: string[];
  
  // Applicant Information
  applicantName: string;
  applicantEmail: string;
  applicantAddress?: string; // Sui address
  
  // Application Status
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  
  // Metadata
  version: string;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

/**
 * Notification stored on Walrus
 * Contains notification data for users
 */
export interface Notification {
  // Notification Content
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  
  // Action
  actionUrl?: string;
  actionText?: string;
  
  // Status
  isRead: boolean;
  isArchived: boolean;
  
  // Metadata
  version: string;
  createdAt: number; // Unix timestamp
}

/**
 * Generic Walrus Object
 * Base interface for all objects stored on Walrus
 */
export interface WalrusObject {
  version: string;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Walrus Upload Response
 * Response from Walrus upload operations
 */
export interface WalrusUploadResponse {
  cid: string;
  size: number;
  timestamp: number;
}

/**
 * Walrus Error
 * Error information from Walrus operations
 */
export interface WalrusError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Walrus Health Check
 * Health status of Walrus services
 */
export interface WalrusHealth {
  publisher: {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    lastCheck: number;
  };
  aggregator: {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    lastCheck: number;
  };
}

/**
 * Type guards for runtime validation
 */
export function isProjectMetadata(obj: any): obj is ProjectMetadata {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.createdAt === 'number'
  );
}

export function isJobDescription(obj: any): obj is JobDescription {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.applicationInstructions === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.createdAt === 'number'
  );
}

export function isFeedbackMessage(obj: any): obj is FeedbackMessage {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.message === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.createdAt === 'number'
  );
}

/**
 * Default values for creating new objects
 */
export const DEFAULT_PROJECT_METADATA: Partial<ProjectMetadata> = {
  category: 'other',
  tags: [],
  creator: {
    name: 'Anonymous',
    isVerified: false,
  },
  socialLinks: [],
  milestones: [],
  faq: [],
  version: '1.0.0',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const DEFAULT_JOB_DESCRIPTION: Partial<JobDescription> = {
  responsibilities: [],
  requirements: {
    skills: [],
    experience: 'Not specified',
  },
  compensation: {
    type: 'negotiable',
    currency: 'SUI',
  },
  duration: 'Full-time',
  workType: 'remote',
  experienceLevel: 'any',
  benefits: [],
  version: '1.0.0',
  createdAt: Date.now(),
};

export const DEFAULT_FEEDBACK_MESSAGE: Partial<FeedbackMessage> = {
  category: 'general',
  isAnonymous: false,
  version: '1.0.0',
  createdAt: Date.now(),
};