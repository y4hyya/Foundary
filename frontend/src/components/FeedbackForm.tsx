/**
 * Feedback Form Component
 * 
 * Form for submitting feedback about a project
 * Handles message creation, Walrus upload, and on-chain submission
 */

import { useState } from 'react';
import type { FeedbackMessage } from '../types/walrus';
import './FeedbackForm.css';

interface FeedbackFormProps {
  onSubmit: (feedbackData: {
    message: string;
    category: 'general' | 'bug_report' | 'feature_request' | 'complaint' | 'praise';
    isAnonymous: boolean;
    rating?: number;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function FeedbackForm({ onSubmit, isSubmitting, error }: FeedbackFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    message: '',
    category: 'general' as 'general' | 'bug_report' | 'feature_request' | 'complaint' | 'praise',
    isAnonymous: false,
    rating: 0,
  });

  const [localError, setLocalError] = useState<string | null>(null);

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setLocalError(null);
  };

  // Handle rating change
  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating,
    }));
    setLocalError(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.message.trim()) {
      setLocalError('Please enter your feedback message');
      return false;
    }

    if (formData.message.trim().length < 10) {
      setLocalError('Feedback message must be at least 10 characters long');
      return false;
    }

    if (formData.message.trim().length > 1000) {
      setLocalError('Feedback message must be less than 1000 characters');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit(formData);
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      message: '',
      category: 'general',
      isAnonymous: false,
      rating: 0,
    });
    setLocalError(null);
  };

  const displayError = localError || error;

  return (
    <div className="feedback-form-container">
      <div className="feedback-form-header">
        <h3>Share Your Feedback</h3>
        <p>Help improve this project by sharing your thoughts and suggestions</p>
      </div>

      <form onSubmit={handleSubmit} className="feedback-form">
        {/* Message */}
        <div className="form-group">
          <label htmlFor="message">
            Your Feedback <span className="required">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Share your thoughts, suggestions, or report issues about this project..."
            rows={6}
            disabled={isSubmitting}
            maxLength={1000}
            required
          />
          <div className="field-meta">
            <span className="char-count">
              {formData.message.length}/1000 characters
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="general">General Feedback</option>
            <option value="bug_report">Bug Report</option>
            <option value="feature_request">Feature Request</option>
            <option value="complaint">Complaint</option>
            <option value="praise">Praise</option>
          </select>
        </div>

        {/* Rating */}
        <div className="form-group">
          <label>Rating (Optional)</label>
          <div className="rating-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= formData.rating ? 'active' : ''}`}
                onClick={() => handleRatingChange(star)}
                disabled={isSubmitting}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >
                ⭐
              </button>
            ))}
            {formData.rating > 0 && (
              <span className="rating-text">
                {formData.rating} star{formData.rating !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Anonymous Option */}
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span className="checkbox-custom"></span>
            Submit anonymously
          </label>
          <p className="field-hint">
            Your wallet address will not be associated with this feedback
          </p>
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {displayError}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            Clear
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !formData.message.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              <>💬 Submit Feedback</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
