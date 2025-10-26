/**
 * Walrus Schema Utilities
 * 
 * Helper functions for creating, validating, and managing Walrus data schemas
 */

import type {
  ProjectMetadata,
  JobDescription,
  FeedbackMessage,
} from '../types/walrus';
import {
  ProjectCategory,
  MilestoneStatus,
  CompensationType,
  WorkType,
  ExperienceLevel,
  Sentiment,
  FeedbackCategory,
  WALRUS_SCHEMA_VERSION,
  validateProjectMetadata,
  validateJobDescription,
  validateFeedbackMessage,
} from '../types/walrus';

// ============================================================================
// FACTORY FUNCTIONS - Create new schema objects with defaults
// ============================================================================

/**
 * Create a new ProjectMetadata object with sensible defaults
 */
export function createProjectMetadata(
  partial: Partial<ProjectMetadata> & Pick<ProjectMetadata, 'name' | 'description' | 'creator'>
): ProjectMetadata {
  const now = Date.now();
  
  return {
    // Required fields
    name: partial.name,
    description: partial.description,
    creator: partial.creator,
    category: partial.category || ProjectCategory.OTHER,
    tags: partial.tags || [],
    milestones: partial.milestones || [],
    risks: partial.risks || 'No risks specified',
    faq: partial.faq || [],
    
    // Optional fields
    shortDescription: partial.shortDescription,
    logoCid: partial.logoCid,
    bannerCid: partial.bannerCid,
    videoCid: partial.videoCid,
    galleryIds: partial.galleryIds,
    subcategory: partial.subcategory,
    team: partial.team,
    rewards: partial.rewards,
    updates: partial.updates,
    links: partial.links,
    
    // Metadata
    version: WALRUS_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new JobDescription object with sensible defaults
 */
export function createJobDescription(
  partial: Partial<JobDescription> & 
    Pick<JobDescription, 'title' | 'description' | 'responsibilities' | 'requirements' | 'compensation'>
): JobDescription {
  const now = Date.now();
  
  return {
    // Required fields
    title: partial.title,
    description: partial.description,
    responsibilities: partial.responsibilities,
    requirements: partial.requirements,
    compensation: partial.compensation,
    duration: partial.duration || 'Negotiable',
    
    // Optional fields
    startDate: partial.startDate,
    deadline: partial.deadline,
    workType: partial.workType || WorkType.REMOTE,
    experienceLevel: partial.experienceLevel || ExperienceLevel.ANY,
    applicationInstructions: partial.applicationInstructions,
    attachmentCids: partial.attachmentCids,
    
    // Metadata
    version: WALRUS_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new FeedbackMessage object with sensible defaults
 */
export function createFeedbackMessage(
  partial: Partial<FeedbackMessage> & Pick<FeedbackMessage, 'message'>
): FeedbackMessage {
  const now = Date.now();
  
  return {
    // Required fields
    message: partial.message,
    categories: partial.categories || [FeedbackCategory.GENERAL],
    isPublic: partial.isPublic ?? true,
    isAnonymous: partial.isAnonymous ?? false,
    
    // Optional fields
    rating: partial.rating,
    sentiment: partial.sentiment,
    detailedRatings: partial.detailedRatings,
    title: partial.title,
    pros: partial.pros,
    cons: partial.cons,
    suggestions: partial.suggestions,
    attachmentCids: partial.attachmentCids,
    
    // Metadata
    version: WALRUS_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: partial.updatedAt,
    editHistory: partial.editHistory,
  };
}

// ============================================================================
// UPDATE FUNCTIONS - Update existing schema objects
// ============================================================================

/**
 * Update ProjectMetadata and increment updatedAt timestamp
 */
export function updateProjectMetadata(
  existing: ProjectMetadata,
  updates: Partial<ProjectMetadata>
): ProjectMetadata {
  return {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
}

/**
 * Update JobDescription and increment updatedAt timestamp
 */
export function updateJobDescription(
  existing: JobDescription,
  updates: Partial<JobDescription>
): JobDescription {
  return {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
}

/**
 * Update FeedbackMessage with edit history tracking
 */
export function updateFeedbackMessage(
  existing: FeedbackMessage,
  updates: Partial<FeedbackMessage>,
  reason?: string
): FeedbackMessage {
  const now = Date.now();
  
  // Create edit history entry
  const editHistory = existing.editHistory || [];
  if (updates.message && updates.message !== existing.message) {
    editHistory.push({
      editedAt: now,
      reason,
      previousVersion: existing.message,
    });
  }
  
  return {
    ...existing,
    ...updates,
    updatedAt: now,
    editHistory,
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate and parse ProjectMetadata from unknown data
 * Throws error if validation fails
 */
export function parseProjectMetadata(data: unknown): ProjectMetadata {
  if (!validateProjectMetadata(data)) {
    throw new Error('Invalid ProjectMetadata schema');
  }
  return data as ProjectMetadata;
}

/**
 * Validate and parse JobDescription from unknown data
 * Throws error if validation fails
 */
export function parseJobDescription(data: unknown): JobDescription {
  if (!validateJobDescription(data)) {
    throw new Error('Invalid JobDescription schema');
  }
  return data as JobDescription;
}

/**
 * Validate and parse FeedbackMessage from unknown data
 * Throws error if validation fails
 */
export function parseFeedbackMessage(data: unknown): FeedbackMessage {
  if (!validateFeedbackMessage(data)) {
    throw new Error('Invalid FeedbackMessage schema');
  }
  return data as FeedbackMessage;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate average rating from feedback
 */
export function calculateAverageRating(feedbacks: FeedbackMessage[]): number {
  const ratingsOnly = feedbacks.filter(f => f.rating !== undefined);
  if (ratingsOnly.length === 0) return 0;
  
  const sum = ratingsOnly.reduce((acc, f) => acc + (f.rating || 0), 0);
  return sum / ratingsOnly.length;
}

/**
 * Get milestone completion percentage
 */
export function getMilestoneProgress(milestones: ProjectMetadata['milestones']): number {
  if (milestones.length === 0) return 0;
  
  const completed = milestones.filter(m => m.status === MilestoneStatus.COMPLETED).length;
  return (completed / milestones.length) * 100;
}

/**
 * Check if project metadata is complete (has all recommended fields)
 */
export function isProjectMetadataComplete(metadata: ProjectMetadata): {
  complete: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  if (!metadata.shortDescription) missing.push('shortDescription');
  if (!metadata.logoCid) missing.push('logoCid');
  if (!metadata.bannerCid) missing.push('bannerCid');
  if (metadata.tags.length === 0) missing.push('tags');
  if (metadata.milestones.length === 0) missing.push('milestones');
  if (metadata.faq.length === 0) missing.push('faq');
  if (!metadata.links?.website && !metadata.links?.github) missing.push('links');
  
  return {
    complete: missing.length === 0,
    missing,
  };
}

/**
 * Check if job description is complete
 */
export function isJobDescriptionComplete(job: JobDescription): {
  complete: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  if (job.responsibilities.length === 0) missing.push('responsibilities');
  if (!job.requirements.skills || job.requirements.skills.length === 0) missing.push('requirements.skills');
  if (job.compensation.type === CompensationType.NEGOTIABLE) missing.push('compensation details');
  if (!job.deadline) missing.push('deadline');
  
  return {
    complete: missing.length === 0,
    missing,
  };
}

/**
 * Format compensation for display
 */
export function formatCompensation(compensation: JobDescription['compensation']): string {
  const { type, amount, currency, description } = compensation;
  
  if (type === CompensationType.VOLUNTEER) {
    return 'Volunteer';
  }
  
  if (type === CompensationType.NEGOTIABLE) {
    return 'Negotiable';
  }
  
  if (amount && currency) {
    const formattedAmount = currency === 'SUI' 
      ? `${(amount / 1_000_000_000).toFixed(2)} SUI`
      : `${amount} ${currency}`;
    
    const typeLabel = type === CompensationType.HOURLY ? '/hr' : '';
    return `${formattedAmount}${typeLabel}`;
  }
  
  return description || 'Not specified';
}

/**
 * Get sentiment emoji
 */
export function getSentimentEmoji(sentiment?: Sentiment): string {
  switch (sentiment) {
    case Sentiment.VERY_POSITIVE: return '😍';
    case Sentiment.POSITIVE: return '😊';
    case Sentiment.NEUTRAL: return '😐';
    case Sentiment.NEGATIVE: return '😞';
    case Sentiment.VERY_NEGATIVE: return '😡';
    default: return '💭';
  }
}

/**
 * Get category display label
 */
export function getCategoryLabel(category: ProjectCategory): string {
  const labels: Record<ProjectCategory, string> = {
    [ProjectCategory.TECHNOLOGY]: 'Technology',
    [ProjectCategory.ART]: 'Art & Design',
    [ProjectCategory.GAMES]: 'Gaming',
    [ProjectCategory.DEFI]: 'DeFi',
    [ProjectCategory.NFT]: 'NFT',
    [ProjectCategory.DAO]: 'DAO & Governance',
    [ProjectCategory.SOCIAL]: 'Social',
    [ProjectCategory.EDUCATION]: 'Education',
    [ProjectCategory.INFRASTRUCTURE]: 'Infrastructure',
    [ProjectCategory.OTHER]: 'Other',
  };
  
  return labels[category] || 'Unknown';
}

/**
 * Calculate time until deadline
 */
export function getTimeUntilDeadline(deadline: number): {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
} {
  const now = Date.now();
  const diff = deadline - now;
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, expired: false };
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: number): string {
  const time = getTimeUntilDeadline(deadline);
  
  if (time.expired) {
    return 'Expired';
  }
  
  if (time.days > 0) {
    return `${time.days} day${time.days > 1 ? 's' : ''} left`;
  }
  
  if (time.hours > 0) {
    return `${time.hours} hour${time.hours > 1 ? 's' : ''} left`;
  }
  
  return `${time.minutes} minute${time.minutes > 1 ? 's' : ''} left`;
}

// ============================================================================
// SEARCH & FILTER HELPERS
// ============================================================================

/**
 * Check if project matches search query
 */
export function projectMatchesSearch(metadata: ProjectMetadata, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return (
    metadata.name.toLowerCase().includes(lowerQuery) ||
    metadata.description.toLowerCase().includes(lowerQuery) ||
    metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    metadata.creator.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter projects by category
 */
export function filterProjectsByCategory(
  projects: ProjectMetadata[],
  category: ProjectCategory
): ProjectMetadata[] {
  return projects.filter(p => p.category === category);
}

/**
 * Sort projects by creation date
 */
export function sortProjectsByDate(
  projects: ProjectMetadata[],
  order: 'asc' | 'desc' = 'desc'
): ProjectMetadata[] {
  return [...projects].sort((a, b) => {
    return order === 'desc' 
      ? b.createdAt - a.createdAt
      : a.createdAt - b.createdAt;
  });
}

