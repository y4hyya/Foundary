/**
 * ProjectCard Component
 * 
 * Displays a project card with on-chain data and Walrus metadata
 */

import { Link } from 'react-router-dom';
import type { Project } from '../types/contract';
import { useProjectMetadata, useFundingProgress, useTimeRemaining } from '../hooks/useProjects';
import { mistToSui } from '../config/constants';
import { getWalrusUrl } from '../utils/walrusClient';
import { getCategoryLabel } from '../utils/walrusSchemas';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Fetch metadata from Walrus
  const { data: metadata, isLoading: metadataLoading, isError: metadataError } = useProjectMetadata(project.metadata_cid);
  
  // Calculate funding progress
  const fundingProgress = useFundingProgress(project);
  
  // Get time remaining
  const timeRemaining = useTimeRemaining(project);

  // Format amounts
  const currentFunding = mistToSui(parseInt(project.current_funding));
  const fundingGoal = mistToSui(parseInt(project.funding_goal));

  // Format deadline
  const formatTimeRemaining = () => {
    if (timeRemaining.expired) {
      return <span className="deadline expired">Expired</span>;
    }
    if (timeRemaining.days > 0) {
      return <span className="deadline">{timeRemaining.days} day{timeRemaining.days > 1 ? 's' : ''} left</span>;
    }
    if (timeRemaining.hours > 0) {
      return <span className="deadline urgent">{timeRemaining.hours} hour{timeRemaining.hours > 1 ? 's' : ''} left</span>;
    }
    return <span className="deadline critical">{timeRemaining.minutes} minute{timeRemaining.minutes > 1 ? 's' : ''} left</span>;
  };

  return (
    <Link to={`/project/${project.id.id}`} className="project-card-link">
      <article className="project-card">
        {/* Project Image */}
        <div className="project-card-image">
          {metadataLoading ? (
            <div className="image-placeholder loading">
              <div className="spinner"></div>
            </div>
          ) : metadataError ? (
            <div className="image-placeholder error">
              <span>❌</span>
            </div>
          ) : metadata?.logoCid ? (
            <img 
              src={getWalrusUrl(metadata.logoCid)} 
              alt={metadata.name} 
              loading="lazy"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.classList.add('error');
              }}
            />
          ) : (
            <div className="image-placeholder">
              <span>📦</span>
            </div>
          )}
          
          {/* Status Badge */}
          {project.is_withdrawn && (
            <div className="status-badge success">Funded ✓</div>
          )}
          {timeRemaining.expired && !project.is_withdrawn && (
            <div className="status-badge expired">Expired</div>
          )}
          {fundingProgress >= 100 && !project.is_withdrawn && (
            <div className="status-badge success">Goal Reached!</div>
          )}
        </div>

        {/* Project Info */}
        <div className="project-card-content">
          {/* Category */}
          {metadata && (
            <div className="project-category">
              {getCategoryLabel(metadata.category)}
            </div>
          )}

          {/* Title */}
          <h3 className="project-title">
            {metadataLoading ? (
              <span className="skeleton-text">Loading...</span>
            ) : metadataError ? (
              <span className="error-text">Error loading title</span>
            ) : (
              metadata?.name || 'Untitled Project'
            )}
          </h3>

          {/* Short Description */}
          {metadata?.shortDescription && (
            <p className="project-description">
              {metadata.shortDescription}
            </p>
          )}

          {/* Creator */}
          {metadata?.creator && (
            <div className="project-creator">
              <span className="creator-label">by</span>
              <span className="creator-name">{metadata.creator.name}</span>
              {metadata.creator.verified && (
                <span className="verified-badge" title="Verified Creator">✓</span>
              )}
            </div>
          )}

          {/* Funding Progress */}
          <div className="funding-section">
            <div className="funding-stats">
              <div className="stat">
                <span className="stat-value">{currentFunding.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI</span>
                <span className="stat-label">raised</span>
              </div>
              <div className="stat">
                <span className="stat-value">{fundingProgress.toFixed(0)}%</span>
                <span className="stat-label">funded</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(fundingProgress, 100)}%` }}
              ></div>
            </div>
            
            <div className="funding-footer">
              <span className="funding-goal">
                Goal: {fundingGoal.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI
              </span>
              {formatTimeRemaining()}
            </div>
          </div>

          {/* Tags */}
          {metadata?.tags && metadata.tags.length > 0 && (
            <div className="project-tags">
              {metadata.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
              {metadata.tags.length > 3 && (
                <span className="tag more">+{metadata.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

