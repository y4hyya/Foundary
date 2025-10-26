/**
 * Governance Tab Component
 * 
 * Displays all polls for a project and allows voting for backers
 * Integrates with Walrus for poll data and on-chain voting
 */

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { PACKAGE_ID, OBJECT_TYPES } from '../config/constants';
import { fetchJson } from '../utils/walrusClient';
import { createPollData } from '../utils/walrusSchemas';
import type { Project, Poll } from '../types/contract';
import type { PollData } from '../types/walrus';
import PollCard from './PollCard';
import CreatePollModal from './CreatePollModal';
import './GovernanceTab.css';

interface GovernanceTabProps {
  project: Project;
  onSuccess?: () => void;
}

export default function GovernanceTab({ project, onSuccess }: GovernanceTabProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { executeTransaction } = useExecuteTransaction();

  // State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollData, setPollData] = useState<Record<string, PollData>>({});
  const [userContributions, setUserContributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePollModalOpen, setIsCreatePollModalOpen] = useState(false);

  // Check if user is project owner
  const isOwner = account && project.owner === account.address;
  
  // Check if user is a backer (has contributions)
  const isBacker = userContributions.length > 0;

  // Fetch polls from the project
  const fetchPolls = async () => {
    if (!project.id.id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🗳️ Fetching polls for project:', project.id.id);

      // Get the project object to access the polls table
      const projectObj = await client.getObject({
        id: project.id.id,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!projectObj.data?.content || !('fields' in projectObj.data.content)) {
        throw new Error('Project not found');
      }

      const fields = projectObj.data.content.fields as any;
      const pollsTable = fields.polls;

      if (!pollsTable || !pollsTable.fields?.contents) {
        console.log('No polls found in project');
        setPolls([]);
        return;
      }

      // Extract polls from the table
      const pollsList: Poll[] = [];
      const contents = pollsTable.fields.contents;

      for (const [key, value] of Object.entries(contents)) {
        if (value && typeof value === 'object' && 'fields' in value) {
          const pollFields = (value as any).fields;
          
          pollsList.push({
            id: { id: key },
            question: pollFields.question || 'Untitled Poll',
            options: pollFields.options || [],
            votes: pollFields.votes || {},
            voters: pollFields.voters || {},
          });
        }
      }

      console.log('📊 Found polls:', pollsList.length);
      setPolls(pollsList);

      // Fetch poll data from Walrus
      await fetchPollData(pollsList);

    } catch (error) {
      console.error('❌ Error fetching polls:', error);
      setError('Failed to load polls');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch poll data from Walrus
  const fetchPollData = async (pollsList: Poll[]) => {
    const data: Record<string, PollData> = {};

    for (const poll of pollsList) {
      try {
        // For now, we'll create a basic PollData from the on-chain data
        // In a real implementation, you might store additional metadata on Walrus
        const pollData: PollData = {
          question: poll.question,
          description: `Poll created for project governance`,
          options: poll.options,
          allowMultipleVotes: false,
          isActive: true,
          expiresAt: undefined, // No expiration for now
          version: '1.0.0',
          createdAt: Date.now(),
        };
        
        data[poll.id.id] = pollData;
      } catch (error) {
        console.warn('Failed to process poll data:', poll.id.id, error);
      }
    }

    setPollData(data);
  };

  // Fetch user's contributions to determine if they can vote
  const fetchUserContributions = useCallback(async () => {
    if (!account || !project.id.id) {
      setUserContributions([]);
      return;
    }

    try {
      console.log('🔍 Fetching user contributions for voting rights...');

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

  // Load polls and contributions on mount
  useEffect(() => {
    fetchPolls();
    fetchUserContributions();
  }, [project.id.id, fetchUserContributions]);

  // Handle poll creation success
  const handlePollCreated = () => {
    console.log('✅ Poll created successfully, refreshing...');
    fetchPolls();
    if (onSuccess) {
      onSuccess();
    }
  };

  // Handle vote success
  const handleVoteSuccess = () => {
    console.log('✅ Vote cast successfully, refreshing...');
    fetchPolls();
    if (onSuccess) {
      onSuccess();
    }
  };

  // Handle retry
  const handleRetry = () => {
    fetchPolls();
    fetchUserContributions();
  };

  return (
    <div className="governance-tab">
      {/* Header */}
      <div className="governance-header">
        <div className="governance-title-section">
          <h2>Project Governance</h2>
          <p>Participate in project decisions through decentralized voting</p>
        </div>

        {/* Create Poll Button (Owner Only) */}
        {isOwner && (
          <button
            className="btn btn-primary create-poll-btn"
            onClick={() => setIsCreatePollModalOpen(true)}
          >
            🗳️ Create Poll
          </button>
        )}
      </div>

      {/* Voting Rights Info */}
      {account && (
        <div className="voting-rights-info">
          {isBacker ? (
            <div className="rights-badge can-vote">
              <span className="rights-icon">✅</span>
              <span>You can vote on polls (you have contributed to this project)</span>
            </div>
          ) : (
            <div className="rights-badge cannot-vote">
              <span className="rights-icon">ℹ️</span>
              <span>Contribute to this project to participate in governance</span>
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

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading polls...</p>
        </div>
      )}

      {/* Polls List */}
      {!isLoading && !error && (
        <div className="polls-content">
          {polls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗳️</div>
              <h3>No Polls Yet</h3>
              <p>
                {isOwner 
                  ? "Create the first poll to start project governance."
                  : "No governance polls have been created for this project yet."
                }
              </p>
              {isOwner && (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsCreatePollModalOpen(true)}
                >
                  Create First Poll
                </button>
              )}
            </div>
          ) : (
            <div className="polls-list">
              {polls.map((poll) => {
                const data = pollData[poll.id.id];
                
                return (
                  <PollCard
                    key={poll.id.id}
                    poll={poll}
                    pollData={data}
                    canVote={isBacker}
                    onVoteSuccess={handleVoteSuccess}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Poll Modal */}
      <CreatePollModal
        project={project}
        isOpen={isCreatePollModalOpen}
        onClose={() => setIsCreatePollModalOpen(false)}
        onSuccess={handlePollCreated}
      />
    </div>
  );
}
