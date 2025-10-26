/**
 * Walrus Schema Utilities
 * 
 * Helper functions for creating and validating data structures
 * that will be stored on Walrus decentralized storage
 */

import type { 
  ProjectMetadata, 
  JobDescription, 
  FeedbackMessage,
  ProjectCategory,
  WorkType,
  ExperienceLevel,
  CompensationType,
  MilestoneStatus
} from '../types/walrus';

/**
 * Creates a ProjectMetadata object with proper defaults and validation
 */
export function createProjectMetadata(data: {
  name: string;
  description: string;
  logoCid?: string;
  category?: ProjectCategory;
  tags?: string[];
  creator?: {
    name: string;
    email?: string;
    website?: string;
    isVerified?: boolean;
  };
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  milestones?: Array<{
    id: string;
    title: string;
    description: string;
    deadline: number;
    status: MilestoneStatus;
  }>;
  risks?: string;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}): ProjectMetadata {
  return {
    name: data.name.trim(),
    description: data.description.trim(),
    logoCid: data.logoCid || '',
    category: data.category || 'other',
    tags: data.tags || [],
    creator: {
      name: data.creator?.name?.trim() || 'Anonymous',
      email: data.creator?.email?.trim() || undefined,
      website: data.creator?.website?.trim() || undefined,
      isVerified: data.creator?.isVerified || false,
    },
    socialLinks: data.socialLinks || [],
    milestones: data.milestones || [],
    risks: data.risks?.trim() || '',
    faq: data.faq || [],
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Creates a JobDescription object with proper defaults and validation
 */
export function createJobDescription(data: {
  title: string;
  description: string;
  responsibilities?: string[];
  requirements?: {
    skills?: string[];
    experience?: string;
    education?: string;
  };
  compensation?: {
    type: CompensationType;
    amount?: number;
    currency?: string;
    description?: string;
  };
  duration?: string;
  workType?: WorkType;
  experienceLevel?: ExperienceLevel;
  location?: string;
  benefits?: string[];
  applicationInstructions: string;
  contactEmail?: string;
}): JobDescription {
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    responsibilities: data.responsibilities || [],
    requirements: {
      skills: data.requirements?.skills || [],
      experience: data.requirements?.experience || 'Not specified',
      education: data.requirements?.education || undefined,
    },
    compensation: {
      type: data.compensation?.type || 'negotiable',
      amount: data.compensation?.amount || undefined,
      currency: data.compensation?.currency || 'SUI',
      description: data.compensation?.description || undefined,
    },
    duration: data.duration || 'Full-time',
    workType: data.workType || 'remote',
    experienceLevel: data.experienceLevel || 'any',
    location: data.location || undefined,
    benefits: data.benefits || [],
    applicationInstructions: data.applicationInstructions.trim(),
    contactEmail: data.contactEmail?.trim() || undefined,
    version: '1.0.0',
    createdAt: Date.now(),
  };
}

/**
 * Creates a FeedbackMessage object with proper defaults and validation
 */
export function createFeedbackMessage(data: {
  message: string;
  rating?: number;
  category?: 'general' | 'bug_report' | 'feature_request' | 'complaint' | 'praise';
  isAnonymous?: boolean;
  contactEmail?: string;
}): FeedbackMessage {
  return {
    message: data.message.trim(),
    rating: data.rating || undefined,
    category: data.category || 'general',
    isAnonymous: data.isAnonymous || false,
    contactEmail: data.contactEmail?.trim() || undefined,
    version: '1.0.0',
    createdAt: Date.now(),
  };
}

/**
 * Creates a PollData object with proper defaults and validation
 */
export function createPollData(data: {
  question: string;
  description?: string;
  options: string[];
  allowMultipleVotes?: boolean;
  expiresAt?: number;
}): PollData {
  return {
    question: data.question.trim(),
    description: data.description?.trim() || undefined,
    options: data.options.map(option => option.trim()).filter(option => option.length > 0),
    allowMultipleVotes: data.allowMultipleVotes || false,
    isActive: true,
    expiresAt: data.expiresAt || undefined,
    version: '1.0.0',
    createdAt: Date.now(),
  };
}

/**
 * Validates a ProjectMetadata object
 */
export function validateProjectMetadata(metadata: any): metadata is ProjectMetadata {
  if (!metadata || typeof metadata !== 'object') return false;
  
  return (
    typeof metadata.name === 'string' && metadata.name.trim().length > 0 &&
    typeof metadata.description === 'string' && metadata.description.trim().length > 0 &&
    typeof metadata.version === 'string' &&
    typeof metadata.createdAt === 'number' &&
    typeof metadata.updatedAt === 'number'
  );
}

/**
 * Validates a JobDescription object
 */
export function validateJobDescription(description: any): description is JobDescription {
  if (!description || typeof description !== 'object') return false;
  
  return (
    typeof description.title === 'string' && description.title.trim().length > 0 &&
    typeof description.description === 'string' && description.description.trim().length > 0 &&
    typeof description.applicationInstructions === 'string' && description.applicationInstructions.trim().length > 0 &&
    typeof description.version === 'string' &&
    typeof description.createdAt === 'number'
  );
}

/**
 * Validates a FeedbackMessage object
 */
export function validateFeedbackMessage(message: any): message is FeedbackMessage {
  if (!message || typeof message !== 'object') return false;
  
  return (
    typeof message.message === 'string' && message.message.trim().length > 0 &&
    typeof message.version === 'string' &&
    typeof message.createdAt === 'number'
  );
}

/**
 * Gets a human-readable label for a project category
 */
export function getCategoryLabel(category?: ProjectCategory): string {
  if (!category) return 'Other';
  
  const labels: Record<ProjectCategory, string> = {
    technology: 'Technology',
    art: 'Art & Design',
    music: 'Music',
    gaming: 'Gaming',
    education: 'Education',
    health: 'Health & Fitness',
    food: 'Food & Drink',
    fashion: 'Fashion',
    travel: 'Travel',
    business: 'Business',
    charity: 'Charity',
    other: 'Other',
  };
  
  return labels[category] || 'Other';
}

/**
 * Gets a human-readable label for work type
 */
export function getWorkTypeLabel(workType: WorkType): string {
  const labels: Record<WorkType, string> = {
    remote: 'Remote',
    hybrid: 'Hybrid',
    on_site: 'On-site',
  };
  
  return labels[workType] || 'Remote';
}

/**
 * Gets a human-readable label for experience level
 */
export function getExperienceLevelLabel(level: ExperienceLevel): string {
  const labels: Record<ExperienceLevel, string> = {
    any: 'Any Level',
    entry: 'Entry Level',
    intermediate: 'Intermediate',
    senior: 'Senior Level',
    expert: 'Expert',
  };
  
  return labels[level] || 'Any Level';
}

/**
 * Gets a human-readable label for compensation type
 */
export function getCompensationTypeLabel(type: CompensationType): string {
  const labels: Record<CompensationType, string> = {
    negotiable: 'Negotiable',
    fixed: 'Fixed Amount',
    hourly: 'Hourly Rate',
    milestone: 'Per Milestone',
    equity: 'Equity/Tokens',
    volunteer: 'Volunteer',
  };
  
  return labels[type] || 'Negotiable';
}

/**
 * Gets a human-readable label for milestone status
 */
export function getMilestoneStatusLabel(status: MilestoneStatus): string {
  const labels: Record<MilestoneStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    delayed: 'Delayed',
    cancelled: 'Cancelled',
  };
  
  return labels[status] || 'Not Started';
}

/**
 * Formats a deadline timestamp for display
 */
export function formatDeadline(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `In ${diffDays} days`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Sanitizes HTML content for safe display
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generates a unique ID for various purposes
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Converts a file size in bytes to a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Default export with all utilities
 */
export default {
  createProjectMetadata,
  createJobDescription,
  createFeedbackMessage,
  validateProjectMetadata,
  validateJobDescription,
  validateFeedbackMessage,
  getCategoryLabel,
  getWorkTypeLabel,
  getExperienceLevelLabel,
  getCompensationTypeLabel,
  getMilestoneStatusLabel,
  formatDeadline,
  sanitizeHtml,
  truncateText,
  generateId,
  formatFileSize,
  isValidEmail,
  isValidUrl,
  extractDomain,
};