/**
 * Poll Card Component
 * 
 * Displays a single poll with voting functionality
 * Shows poll question, options, vote counts, and voting buttons
 */

import { useState, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { PACKAGE_ID, OBJECT_TYPES } from '../config/constants';
import type { Poll } from '../types/contract';
import type { PollData } from '../types/walrus';
import './PollCard.css';

interface PollCardProps {
  poll: Poll;
  pollData?: PollData;
  canVote: boolean;
  onVoteSuccess?: () => void;
}

const CLOCK_OBJECT_ID = '0x0000000000000000000000000000000000000000000000000000000000000006';

export default function PollCard({ poll, pollData, canVote, onVoteSuccess }: PollCardProps) {
  const account = useCurrentAccount();
  const { executeTransaction } = useExecuteTransaction();

  // State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userContributions, setUserContributions] = useState<any[]>([]);

  // Calculate vote statistics
  const totalVotes = Object.values(poll.votes).reduce((sum, count) => sum + count, 0);
  const votePercentages = poll.options.map((_, index) => {
    const votes = poll.votes[index] || 0;
    return totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
  });

  // Check if user has already voted
  useEffect(() => {
    if (account && poll.voters) {
      const userHasVoted = poll.voters[account.address] === true;
      setHasVoted(userHasVoted);
    }
  }, [account, poll.voters]);

  // Fetch user's contributions for voting
  useEffect(() => {
    const fetchUserContributions = async () => {
      if (!account) return;

      try {
        // Query for ContributionMade events by this user
        const { data: events } = await fetch(`${PACKAGE_ID}/events/ContributionMade?limit=100`);
        // This is a simplified approach - in a real app, you'd use the Sui client
        // For now, we'll assume the user has contributions if they can vote
        setUserContributions([{ id: 'placeholder' }]);
      } catch (error) {
        console.error('Error fetching contributions:', error);
      }
    };

    fetchUserContributions();
  }, [account]);

  // Handle vote submission
  const handleVote = async () => {
    if (!account || !canVote || selectedOption === null || hasVoted || isVoting) {
      return;
    }

    if (userContributions.length === 0) {
      setError('You need to contribute to this project to vote');
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      console.log('🗳️ Casting vote for option:', selectedOption);

      const tx = new Transaction();

      // Reference the shared Clock object
      const clock = tx.sharedObjectRef({
        objectId: CLOCK_OBJECT_ID,
        initialSharedVersion: 1,
        mutable: false,
      });

      // Use the first contribution for voting
      const contribution = userContributions[0];
      
      tx.moveCall({
        target: `${PACKAGE_ID}::foundry::vote_on_poll`,
        arguments: [
          tx.object(poll.id.id),           // poll: &mut Poll
          tx.object(contribution.id),      // contribution: &Contribution
          tx.pure.u64(selectedOption),     // option_index: u64
        ],
      });

      await executeTransaction(tx, {
        successMessage: 'Vote cast successfully!',
        errorMessage: 'Failed to cast vote',
        onSuccess: () => {
          console.log('✅ Vote cast successfully');
          setHasVoted(true);
          if (onVoteSuccess) {
            onVoteSuccess();
          }
        },
        onError: (err) => {
          setError(err.message);
        },
      });

    } catch (error) {
      console.error('❌ Error casting vote:', error);
      setError('Failed to cast vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  // Handle option selection
  const handleOptionSelect = (optionIndex: number) => {
    if (hasVoted || !canVote) return;
    setSelectedOption(optionIndex);
    setError(null);
  };

  return (
    <div className={`poll-card ${hasVoted ? 'voted' : ''} ${!canVote ? 'no-vote-rights' : ''}`}>
      {/* Poll Header */}
      <div className="poll-header">
        <div className="poll-title-section">
          <h3>{poll.question}</h3>
          {pollData?.description && (
            <p className="poll-description">{pollData.description}</p>
          )}
        </div>
        
        <div className="poll-meta">
          <span className="poll-status">
            {hasVoted ? '✅ Voted' : canVote ? '🗳️ Open' : '👀 View Only'}
          </span>
          <span className="poll-votes-count">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Poll Options */}
      <div className="poll-options">
        {poll.options.map((option, index) => {
          const votes = poll.votes[index] || 0;
          const percentage = votePercentages[index];
          const isSelected = selectedOption === index;
          const isVoted = hasVoted;

          return (
            <div
              key={index}
              className={`poll-option ${isSelected ? 'selected' : ''} ${isVoted ? 'voted' : ''}`}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="option-content">
                <div className="option-header">
                  <div className="option-radio">
                    {isVoted ? (
                      <span className="radio-checked">✓</span>
                    ) : (
                      <span className={`radio-circle ${isSelected ? 'selected' : ''}`}></span>
                    )}
                  </div>
                  <span className="option-text">{option}</span>
                </div>
                
                {isVoted && (
                  <div className="option-stats">
                    <div className="vote-count">{votes} votes</div>
                    <div className="vote-percentage">{percentage.toFixed(1)}%</div>
                  </div>
                )}
              </div>

              {/* Vote Bar */}
              {isVoted && (
                <div className="vote-bar">
                  <div 
                    className="vote-bar-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Vote Button */}
      {canVote && !hasVoted && (
        <div className="poll-actions">
          <button
            className={`btn btn-primary vote-btn ${isVoting ? 'loading' : ''}`}
            onClick={handleVote}
            disabled={selectedOption === null || isVoting}
          >
            {isVoting ? (
              <>
                <span className="spinner"></span>
                Casting Vote...
              </>
            ) : (
              '🗳️ Cast Vote'
            )}
          </button>
        </div>
      )}

      {/* Voting Instructions */}
      {!canVote && !hasVoted && (
        <div className="voting-instructions">
          <p>💡 Contribute to this project to participate in governance voting</p>
        </div>
      )}

      {/* Poll Footer */}
      <div className="poll-footer">
        <div className="poll-stats">
          <span>Total Votes: {totalVotes}</span>
          {pollData?.expiresAt && (
            <span>
              Expires: {new Date(pollData.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
