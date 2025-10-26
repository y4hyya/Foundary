/**
 * Project Detail Page
 * 
 * Displays comprehensive information about a specific project
 * including funding stats, description, creator info, and more
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useProjectWithMetadata, useFundingProgress, useTimeRemaining } from '../hooks/useProjects';
import { mistToSui } from '../config/constants';
import { getWalrusUrl } from '../utils/walrusClient';
import { getCategoryLabel, formatDeadline } from '../utils/walrusSchemas';
import FundingWidget from '../components/FundingWidget';
import './ProjectDetail.css';

type TabType = 'details' | 'updates' | 'backers' | 'comments';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  // Fetch project and metadata
  const { project, metadata, isLoading, isError, error, refetch } = useProjectWithMetadata(id);
  
  // Calculate funding stats
  const fundingProgress = useFundingProgress(project);
  const timeRemaining = useTimeRemaining(project);

  // Loading state
  if (isLoading) {
    return (
      <div className="project-detail-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !project) {
    return (
      <div className="project-detail-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Failed to Load Project</h2>
          <p>{error instanceof Error ? error.message : 'Project not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Format amounts
  const currentFunding = mistToSui(parseInt(project.current_funding));
  const fundingGoal = mistToSui(parseInt(project.funding_goal));
  const remainingAmount = fundingGoal - currentFunding;

  // Format deadline
  const deadlineDate = new Date(parseInt(project.deadline));
  const isExpired = timeRemaining.expired;
  const isFunded = project.is_withdrawn;

  // Get status
  const getStatus = () => {
    if (isFunded) return { text: 'Successfully Funded', className: 'success' };
    if (isExpired) return { text: 'Campaign Ended', className: 'expired' };
    if (fundingProgress >= 100) return { text: 'Goal Reached!', className: 'success' };
    return { text: 'Active', className: 'active' };
  };

  const status = getStatus();

  return (
    <div className="project-detail-page">
      {/* Back Button */}
      <div className="page-nav">
        <Link to="/" className="back-link">
          ← Back to Projects
        </Link>
      </div>

      {/* Hero Section */}
      <div className="project-hero">
        {/* Project Image */}
        <div className="project-image-container">
          {metadata?.logoCid ? (
            <img 
              src={getWalrusUrl(metadata.logoCid)} 
              alt={metadata.name}
              className="project-hero-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="project-image-placeholder">
              <span className="placeholder-icon">📦</span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className={`status-badge ${status.className}`}>
            {status.text}
          </div>
        </div>

        {/* Project Header */}
        <div className="project-header">
          <div className="project-meta">
            {metadata && (
              <>
                <span className="project-category">
                  {getCategoryLabel(metadata.category)}
                </span>
                {metadata.creator?.verified && (
                  <span className="verified-badge" title="Verified Creator">
                    ✓ Verified
                  </span>
                )}
              </>
            )}
          </div>

          <h1 className="project-title">
            {metadata?.name || 'Loading...'}
          </h1>

          {metadata?.shortDescription && (
            <p className="project-subtitle">
              {metadata.shortDescription}
            </p>
          )}

          {/* Creator Info */}
          {metadata?.creator && (
            <div className="creator-info">
              <span className="creator-label">Created by</span>
              <span className="creator-name">{metadata.creator.name}</span>
              {metadata.creator.verified && (
                <span className="creator-verified">✓</span>
              )}
            </div>
          )}

          {/* Tags */}
          {metadata?.tags && metadata.tags.length > 0 && (
            <div className="project-tags">
              {metadata.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="project-content">
        {/* Left Column - Details */}
        <div className="project-main">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`tab ${activeTab === 'updates' ? 'active' : ''}`}
              onClick={() => setActiveTab('updates')}
            >
              Updates
            </button>
            <button
              className={`tab ${activeTab === 'backers' ? 'active' : ''}`}
              onClick={() => setActiveTab('backers')}
            >
              Backers
            </button>
            <button
              className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Discussion
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'details' && (
              <div className="details-tab">
                {/* Project Description */}
                <section className="section">
                  <h2>About This Project</h2>
                  {metadata?.description ? (
                    <div className="markdown-content">
                      {/* Simple markdown rendering - in production, use a markdown library */}
                      {metadata.description.split('\n').map((paragraph, index) => {
                        if (paragraph.startsWith('# ')) {
                          return <h3 key={index}>{paragraph.slice(2)}</h3>;
                        }
                        if (paragraph.startsWith('## ')) {
                          return <h4 key={index}>{paragraph.slice(3)}</h4>;
                        }
                        if (paragraph.startsWith('### ')) {
                          return <h5 key={index}>{paragraph.slice(4)}</h5>;
                        }
                        if (paragraph.trim()) {
                          return <p key={index}>{paragraph}</p>;
                        }
                        return <br key={index} />;
                      })}
                    </div>
                  ) : (
                    <p className="text-muted">No description available</p>
                  )}
                </section>

                {/* Creator Details */}
                {metadata?.creator && (
                  <section className="section">
                    <h2>About the Creator</h2>
                    <div className="creator-details">
                      <div className="creator-header">
                        {metadata.creator.avatarCid && (
                          <img 
                            src={getWalrusUrl(metadata.creator.avatarCid)}
                            alt={metadata.creator.name}
                            className="creator-avatar"
                          />
                        )}
                        <div>
                          <h3>{metadata.creator.name}</h3>
                          {metadata.creator.reputation && (
                            <div className="creator-reputation">
                              Reputation: {metadata.creator.reputation}/100
                            </div>
                          )}
                        </div>
                      </div>
                      {metadata.creator.bio && (
                        <p className="creator-bio">{metadata.creator.bio}</p>
                      )}
                      {metadata.creator.previousProjects && metadata.creator.previousProjects.length > 0 && (
                        <div className="previous-projects">
                          <strong>Previous Projects:</strong> {metadata.creator.previousProjects.length}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Milestones */}
                {metadata?.milestones && metadata.milestones.length > 0 && (
                  <section className="section">
                    <h2>Project Milestones</h2>
                    <div className="milestones-list">
                      {metadata.milestones.map((milestone, index) => (
                        <div key={index} className="milestone-item">
                          <div className="milestone-header">
                            <h4>{milestone.title}</h4>
                            <span className={`milestone-status ${milestone.status}`}>
                              {milestone.status}
                            </span>
                          </div>
                          <p>{milestone.description}</p>
                          {milestone.deadline && (
                            <p className="milestone-deadline">
                              Deadline: {new Date(milestone.deadline).toLocaleDateString()}
                            </p>
                          )}
                          {milestone.deliverables && milestone.deliverables.length > 0 && (
                            <ul className="deliverables">
                              {milestone.deliverables.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Risks */}
                {metadata?.risks && (
                  <section className="section risks-section">
                    <h2>Risks & Challenges</h2>
                    <div className="risks-content">
                      <p>{metadata.risks}</p>
                    </div>
                  </section>
                )}

                {/* FAQ */}
                {metadata?.faq && metadata.faq.length > 0 && (
                  <section className="section">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-list">
                      {metadata.faq.map((item, index) => (
                        <div key={index} className="faq-item">
                          <h4>{item.question}</h4>
                          <p>{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="updates-tab">
                <div className="empty-state">
                  <span className="empty-icon">📢</span>
                  <h3>No Updates Yet</h3>
                  <p>The creator hasn't posted any updates yet.</p>
                </div>
              </div>
            )}

            {activeTab === 'backers' && (
              <div className="backers-tab">
                <div className="empty-state">
                  <span className="empty-icon">👥</span>
                  <h3>No Backers Yet</h3>
                  <p>Be the first to support this project!</p>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="comments-tab">
                <div className="empty-state">
                  <span className="empty-icon">💬</span>
                  <h3>No Comments Yet</h3>
                  <p>Start the discussion!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Funding */}
        <div className="project-sidebar">
          {/* Funding Stats */}
          <div className="funding-card">
            <div className="funding-header">
              <div className="funding-amount">
                <span className="amount">{currentFunding.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className="currency">SUI</span>
              </div>
              <p className="funding-label">raised of {fundingGoal.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI goal</p>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(fundingProgress, 100)}%` }}
              />
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-value">{fundingProgress.toFixed(0)}%</div>
                <div className="stat-label">Funded</div>
              </div>
              <div className="stat">
                <div className="stat-value">{remainingAmount > 0 ? remainingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</div>
                <div className="stat-label">SUI to go</div>
              </div>
              <div className="stat">
                <div className="stat-value">
                  {isExpired ? 'Ended' : formatDeadline(parseInt(project.deadline))}
                </div>
                <div className="stat-label">Time Remaining</div>
              </div>
            </div>

            {/* Deadline Info */}
            <div className="deadline-info">
              <strong>Campaign ends:</strong> {deadlineDate.toLocaleDateString()}
            </div>

            {/* Fund Button */}
            {!isFunded && !isExpired && (
              <button 
                className="btn btn-primary btn-large"
                onClick={() => {
                  if (!account) {
                    alert('Please connect your wallet to fund this project');
                  } else {
                    setIsFundingModalOpen(true);
                  }
                }}
              >
                💰 Back This Project
              </button>
            )}

            {isFunded && (
              <div className="status-message success">
                ✓ This project has been successfully funded!
              </div>
            )}

            {isExpired && !isFunded && (
              <div className="status-message expired">
                This campaign has ended
              </div>
            )}
          </div>

          {/* Project Owner Actions */}
          {account && project.owner === account.address && (
            <div className="owner-actions">
              <h3>Project Owner</h3>
              <p>You own this project</p>
              
              {fundingProgress >= 100 && !isFunded && (
                <button className="btn btn-primary" onClick={() => alert('Claim funds functionality coming soon!')}>
                  Claim Funds
                </button>
              )}
              
              <button className="btn btn-secondary" onClick={() => alert('Post update functionality coming soon!')}>
                Post Update
              </button>
            </div>
          )}

          {/* Project Info */}
          <div className="info-card">
            <h3>Project Info</h3>
            
            <div className="info-item">
              <span className="info-label">Created</span>
              <span className="info-value">
                {metadata?.createdAt ? new Date(metadata.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Category</span>
              <span className="info-value">
                {metadata ? getCategoryLabel(metadata.category) : 'Unknown'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Project ID</span>
              <span className="info-value mono">{id?.substring(0, 8)}...</span>
            </div>

            <div className="info-item">
              <span className="info-label">Owner</span>
              <span className="info-value mono">{project.owner.substring(0, 8)}...</span>
            </div>
          </div>

          {/* Share */}
          <div className="share-card">
            <h3>Share This Project</h3>
            <div className="share-buttons">
              <button className="share-btn" onClick={() => alert('Share functionality coming soon!')}>
                🐦 Twitter
              </button>
              <button className="share-btn" onClick={() => alert('Share functionality coming soon!')}>
                📱 Telegram
              </button>
              <button className="share-btn" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                🔗 Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Funding Widget Modal */}
      <FundingWidget
        project={project}
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
        onSuccess={() => {
          // Refetch project data to update funding stats
          refetch();
        }}
      />
    </div>
  );
}
