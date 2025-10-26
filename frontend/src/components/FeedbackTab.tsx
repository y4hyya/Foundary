/**
 * Feedback Tab Component
 * 
 * Displays feedback form for backers and lists all submitted feedback
 * Integrates with Walrus for feedback storage and on-chain submission
 */

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { PACKAGE_ID, OBJECT_TYPES } from '../config/constants';
import { uploadJson, fetchJson } from '../utils/walrusClient';
import { createFeedbackMessage } from '../utils/walrusSchemas';
import type { Project, Feedback } from '../types/contract';
import type { FeedbackMessage } from '../types/walrus';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';
import './FeedbackTab.css';

interface FeedbackTabProps {
  project: Project;
  onSuccess?: () => void;
}

export default function FeedbackTab({ project, onSuccess }: FeedbackTabProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { executeTransaction } = useExecuteTransaction();

  // State
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, FeedbackMessage>>({});
  const [userContributions, setUserContributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is project owner
  const isOwner = account && project.owner === account.address;
  
  // Check if user is a backer (has contributions)
  const isBacker = userContributions.length > 0;

  // Fetch feedback from the project
  const fetchFeedback = async () => {
    if (!project.id.id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('💬 Fetching feedback for project:', project.id.id);

      // Query for FeedbackSubmitted events for this project
      const { data: events } = await client.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::foundry::FeedbackSubmitted`,
        },
        order: 'descending',
        limit: 100,
      });

      const feedbackList: Feedback[] = [];

      for (const event of events) {
        if (event.parsedJson) {
          const eventData = event.parsedJson as any;
          // Filter events for the current project
          if (eventData.project_id === project.id.id) {
            // Fetch the actual Feedback object to ensure it still exists
            const feedbackObject = await client.getObject({
              id: eventData.feedback_id,
              options: { showContent: true, showType: true },
            });

            if (feedbackObject.data?.content && 'fields' in feedbackObject.data.content) {
              const fields = feedbackObject.data.content.fields as any;
              feedbackList.push({
                id: fields.id as { id: string },
                project_id: fields.project_id as string,
                backer_address: fields.backer_address as string,
                message_cid: fields.message_cid as string,
              });
            }
          }
        }
      }

      console.log('📝 Found feedback:', feedbackList.length);
      setFeedback(feedbackList);

      // Fetch feedback messages from Walrus
      await fetchFeedbackMessages(feedbackList);

    } catch (error) {
      console.error('❌ Error fetching feedback:', error);
      setError('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch feedback messages from Walrus
  const fetchFeedbackMessages = async (feedbackList: Feedback[]) => {
    const messages: Record<string, FeedbackMessage> = {};

    for (const fb of feedbackList) {
      if (fb.message_cid) {
        try {
          console.log('📥 Fetching feedback message:', fb.message_cid);
          const message = await fetchJson<FeedbackMessage>(fb.message_cid);
          messages[fb.id.id] = message;
        } catch (error) {
          console.warn('Failed to fetch feedback message:', fb.message_cid, error);
          // Create a fallback message
          messages[fb.id.id] = {
            message: 'Feedback message not available',
            category: 'general',
            isAnonymous: false,
            version: '1.0.0',
            createdAt: Date.now(),
          };
        }
      }
    }

    setFeedbackMessages(messages);
  };

  // Fetch user's contributions to determine if they can submit feedback
  const fetchUserContributions = useCallback(async () => {
    if (!account || !project.id.id) {
      setUserContributions([]);
      return;
    }

    try {
      console.log('🔍 Fetching user contributions for feedback rights...');

      // Query for ContributionMade events by this user for this project
      const { data: events } = await client.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::foundry::ContributionMade`,
        },
        order: 'descending',
        limit: 100,
      });

      const contributions: any[] = [];

      for (const event of events) {
        if (event.parsedJson) {
          const eventData = event.parsedJson as any;
          // Filter events for the current project and the connected user
          if (eventData.project_id === project.id.id && eventData.backer === account.address) {
            // Fetch the actual Contribution object to ensure it still exists
            const contributionObject = await client.getObject({
              id: eventData.contribution_id,
              options: { showContent: true, showType: true },
            });

            if (contributionObject.data?.content && 'fields' in contributionObject.data.content) {
              contributions.push(contributionObject.data.content.fields);
            }
          }
        }
      }

      console.log('✅ Found user contributions:', contributions.length);
      setUserContributions(contributions);

    } catch (error) {
      console.error('❌ Error fetching user contributions:', error);
      setUserContributions([]);
    }
  }, [account, client, project.id.id]);

  // Load feedback and contributions on mount
  useEffect(() => {
    fetchFeedback();
    fetchUserContributions();
  }, [project.id.id, fetchUserContributions]);

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedbackData: {
    message: string;
    category: 'general' | 'bug_report' | 'feature_request' | 'complaint' | 'praise';
    isAnonymous: boolean;
    rating?: number;
  }) => {
    if (!account || !isBacker || userContributions.length === 0) {
      setError('You need to contribute to this project to submit feedback');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('📝 Submitting feedback...');

      // Step 1: Create feedback message
      const feedbackMessage = createFeedbackMessage({
        message: feedbackData.message,
        category: feedbackData.category,
        isAnonymous: feedbackData.isAnonymous,
        rating: feedbackData.rating,
      });

      console.log('✅ Feedback message created:', feedbackMessage);

      // Step 2: Upload to Walrus
      console.log('📤 Uploading to Walrus...');
      const uploadResult = await uploadJson(feedbackMessage, { epochs: 5 });
      const messageCid = uploadResult.cid;

      console.log('✅ Uploaded to Walrus:', messageCid);

      // Step 3: Build transaction
      console.log('🔧 Building transaction...');
      const tx = new Transaction();

      // Use the first contribution for feedback submission
      const contribution = userContributions[0];
      
      tx.moveCall({
        target: `${PACKAGE_ID}::foundry::submit_feedback`,
        arguments: [
          tx.pure.string(project.id.id),     // project_id: String
          tx.object(contribution.id),        // contribution: &Contribution
          tx.pure.string(messageCid),        // message_cid: String
        ],
      });

      console.log('📦 Transaction built');

      // Step 4: Execute transaction
      console.log('🚀 Executing transaction...');
      await executeTransaction(tx, {
        successMessage: 'Feedback submitted successfully!',
        errorMessage: 'Failed to submit feedback',
        onSuccess: () => {
          console.log('✅ Feedback submitted successfully');
          // Refresh feedback list
          fetchFeedback();
          if (onSuccess) {
            onSuccess();
          }
        },
        onError: (err) => {
          setError(err.message);
        },
      });

    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    fetchFeedback();
    fetchUserContributions();
  };

  return (
    <div className="feedback-tab">
      {/* Header */}
      <div className="feedback-header">
        <div className="feedback-title-section">
          <h2>Project Feedback</h2>
          <p>Share your thoughts and suggestions about this project</p>
        </div>
      </div>

      {/* Feedback Rights Info */}
      {account && (
        <div className="feedback-rights-info">
          {isBacker ? (
            <div className="rights-badge can-submit">
              <span className="rights-icon">✅</span>
              <span>You can submit feedback (you have contributed to this project)</span>
            </div>
          ) : (
            <div className="rights-badge cannot-submit">
              <span className="rights-icon">ℹ️</span>
              <span>Contribute to this project to submit feedback</span>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <p>{error}</p>
            <button className="retry-btn" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Feedback Form */}
      {isBacker && (
        <div className="feedback-form-section">
          <FeedbackForm
            onSubmit={handleFeedbackSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      )}

      {/* Feedback List */}
      <div className="feedback-list-section">
        <h3>Community Feedback</h3>
        
        {isLoading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading feedback...</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {feedback.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h4>No Feedback Yet</h4>
                <p>
                  {isBacker 
                    ? "Be the first to share your thoughts about this project."
                    : "No feedback has been submitted for this project yet."
                  }
                </p>
              </div>
            ) : (
              <FeedbackList
                feedback={feedback}
                feedbackMessages={feedbackMessages}
                isOwner={isOwner}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
