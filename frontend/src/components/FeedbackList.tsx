/**
 * Feedback List Component
 * 
 * Displays all submitted feedback for a project
 * Shows feedback messages with metadata and filtering options
 */

import { useState, useMemo } from 'react';
import type { Feedback } from '../types/contract';
import type { FeedbackMessage } from '../types/walrus';
import { getFeedbackCategoryLabel } from '../utils/walrusSchemas';
import './FeedbackList.css';

interface FeedbackListProps {
  feedback: Feedback[];
  feedbackMessages: Record<string, FeedbackMessage>;
  isOwner: boolean;
}

export default function FeedbackList({ feedback, feedbackMessages, isOwner }: FeedbackListProps) {
  const [filter, setFilter] = useState<'all' | 'general' | 'bug_report' | 'feature_request' | 'complaint' | 'praise'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');

  // Filter and sort feedback
  const filteredAndSortedFeedback = useMemo(() => {
    let filtered = feedback.filter(fb => {
      const message = feedbackMessages[fb.id.id];
      if (!message) return false;
      
      if (filter === 'all') return true;
      return message.category === filter;
    });

    // Sort feedback
    filtered.sort((a, b) => {
      const messageA = feedbackMessages[a.id.id];
      const messageB = feedbackMessages[b.id.id];
      
      if (!messageA || !messageB) return 0;

      switch (sortBy) {
        case 'newest':
          return messageB.createdAt - messageA.createdAt;
        case 'oldest':
          return messageA.createdAt - messageB.createdAt;
        case 'rating':
          const ratingA = messageA.rating || 0;
          const ratingB = messageB.rating || 0;
          return ratingB - ratingA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [feedback, feedbackMessages, filter, sortBy]);

  // Get category statistics
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    feedback.forEach(fb => {
      const message = feedbackMessages[fb.id.id];
      if (message) {
        stats[message.category] = (stats[message.category] || 0) + 1;
      }
    });
    return stats;
  }, [feedback, feedbackMessages]);

  // Get average rating
  const averageRating = useMemo(() => {
    const ratings = feedback
      .map(fb => feedbackMessages[fb.id.id]?.rating)
      .filter(rating => rating && rating > 0) as number[];
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }, [feedback, feedbackMessages]);

  return (
    <div className="feedback-list">
      {/* Statistics */}
      <div className="feedback-stats">
        <div className="stat-item">
          <span className="stat-value">{feedback.length}</span>
          <span className="stat-label">Total Feedback</span>
        </div>
        {averageRating > 0 && (
          <div className="stat-item">
            <span className="stat-value">{averageRating.toFixed(1)}</span>
            <span className="stat-label">Average Rating</span>
          </div>
        )}
        <div className="stat-item">
          <span className="stat-value">{Object.keys(categoryStats).length}</span>
          <span className="stat-label">Categories</span>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="feedback-controls">
        <div className="filter-group">
          <label htmlFor="category-filter">Filter by Category:</label>
          <select
            id="category-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Categories ({feedback.length})</option>
            {Object.entries(categoryStats).map(([category, count]) => (
              <option key={category} value={category}>
                {getFeedbackCategoryLabel(category)} ({count})
              </option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </div>

      {/* Feedback Items */}
      <div className="feedback-items">
        {filteredAndSortedFeedback.length === 0 ? (
          <div className="empty-filter-state">
            <div className="empty-icon">🔍</div>
            <h4>No Feedback Found</h4>
            <p>No feedback matches your current filter criteria.</p>
          </div>
        ) : (
          filteredAndSortedFeedback.map((fb) => {
            const message = feedbackMessages[fb.id.id];
            if (!message) return null;

            return (
              <FeedbackItem
                key={fb.id.id}
                feedback={fb}
                message={message}
                isOwner={isOwner}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// Individual Feedback Item Component
interface FeedbackItemProps {
  feedback: Feedback;
  message: FeedbackMessage;
  isOwner: boolean;
}

function FeedbackItem({ feedback, message, isOwner }: FeedbackItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={`feedback-item ${message.category}`}>
      {/* Feedback Header */}
      <div className="feedback-header">
        <div className="feedback-meta">
          <div className="feedback-category">
            <span className={`category-badge ${message.category}`}>
              {getFeedbackCategoryLabel(message.category)}
            </span>
            {message.rating && message.rating > 0 && (
              <div className="rating-display">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`star ${i < message.rating! ? 'filled' : 'empty'}`}
                  >
                    ⭐
                  </span>
                ))}
                <span className="rating-value">{message.rating}/5</span>
              </div>
            )}
          </div>
          
          <div className="feedback-info">
            <span className="feedback-date">
              {formatDate(message.createdAt)}
            </span>
            {!message.isAnonymous && (
              <span className="feedback-author">
                by {formatAddress(feedback.backer_address)}
              </span>
            )}
            {message.isAnonymous && (
              <span className="feedback-author anonymous">
                Anonymous
              </span>
            )}
          </div>
        </div>

        <button
          className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse feedback' : 'Expand feedback'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Feedback Content */}
      <div className="feedback-content">
        <div className="feedback-message">
          {isExpanded ? (
            <div className="message-full">
              {message.message.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <div className="message-preview">
              {message.message.length > 200 
                ? `${message.message.substring(0, 200)}...` 
                : message.message
              }
            </div>
          )}
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="owner-actions">
            <button className="action-btn reply-btn">
              Reply
            </button>
            <button className="action-btn flag-btn">
              Flag
            </button>
          </div>
        )}
      </div>

      {/* Feedback Footer */}
      <div className="feedback-footer">
        <div className="feedback-stats">
          <span className="feedback-id">
            ID: {feedback.id.id.slice(0, 8)}...
          </span>
        </div>
      </div>
    </div>
  );
}
