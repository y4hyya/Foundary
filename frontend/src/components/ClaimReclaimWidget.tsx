/**
 * Claim and Reclaim Widget Component
 * 
 * Handles claim_funds for project owners and reclaim_funds for backers
 * with dynamic button display based on conditions
 */

import { useState, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { PACKAGE_ID, mistToSui } from '../config/constants';
import type { Project, Contribution } from '../types/contract';
import './ClaimReclaimWidget.css';

interface ClaimReclaimWidgetProps {
  project: Project;
  onSuccess?: () => void;
}

export default function ClaimReclaimWidget({ project, onSuccess }: ClaimReclaimWidgetProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { executeTransaction } = useExecuteTransaction();

  // State
  const [userContributions, setUserContributions] = useState<Contribution[]>([]);
  const [isLoadingContributions, setIsLoadingContributions] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate project status
  const currentFunding = mistToSui(parseInt(project.current_funding));
  const fundingGoal = mistToSui(parseInt(project.funding_goal));
  const fundingProgress = (currentFunding / fundingGoal) * 100;
  const isGoalMet = fundingProgress >= 100;
  const isExpired = new Date(parseInt(project.deadline)) < new Date();
  const isOwner = account && project.owner === account.address;

  // Check if user can claim funds
  const canClaim = isOwner && isGoalMet && !project.is_withdrawn;

  // Check if user can reclaim funds
  const canReclaim = !isOwner && isExpired && !isGoalMet && userContributions.length > 0;

  // Fetch user's contributions
  useEffect(() => {
    const fetchUserContributions = async () => {
      if (!account) {
        setUserContributions([]);
        return;
      }

      setIsLoadingContributions(true);
      setError(null);

      try {
        // Query for Contribution objects owned by the user
        const response = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::foundry::ContributionMade`,
          },
          limit: 100,
          order: 'descending',
        });

        // Filter contributions for this project and user
        const contributions: Contribution[] = [];
        
        for (const event of response.data) {
          if (event.parsedJson) {
            const eventData = event.parsedJson as any;
            
            // Check if this contribution is for the current project and user
            if (
              eventData.project_id === project.id.id &&
              eventData.backer === account.address
            ) {
              // Get the actual Contribution object
              try {
                const contributionObj = await client.getObject({
                  id: eventData.contribution_id,
                  options: {
                    showContent: true,
                    showType: true,
                  },
                });

                if (contributionObj.data?.content && 'fields' in contributionObj.data.content) {
                  const fields = contributionObj.data.content.fields as any;
                  
                  contributions.push({
                    id: { id: eventData.contribution_id },
                    project_id: fields.project_id,
                    backer_address: fields.backer_address,
                    amount: fields.amount,
                  });
                }
              } catch (err) {
                console.warn('Failed to fetch contribution object:', err);
              }
            }
          }
        }

        setUserContributions(contributions);
      } catch (error) {
        console.error('Error fetching contributions:', error);
        setError('Failed to load your contributions');
      } finally {
        setIsLoadingContributions(false);
      }
    };

    fetchUserContributions();
  }, [account, project.id.id, client]);

  // Handle claim funds
  const handleClaimFunds = async () => {
    if (!canClaim || !account) return;

    setIsClaiming(true);
    setError(null);

    try {
      console.log('🚀 Claiming funds for project:', project.id.id);

      // Build transaction
      const tx = new Transaction();

      // Get clock object
      const clock = tx.sharedObjectRef({
        objectId: '0x0000000000000000000000000000000000000000000000000000000000000006',
        initialSharedVersion: 1,
        mutable: false,
      });

      // Call claim_funds
      tx.moveCall({
        target: `${PACKAGE_ID}::foundry::claim_funds`,
        arguments: [
          tx.object(project.id.id),  // project: &mut Project
          clock,                      // clock: &Clock
        ],
      });

      console.log('📦 Transaction built');

      // Execute transaction
      const result = await executeTransaction(tx, {
        successMessage: 'Funds claimed successfully!',
        errorMessage: 'Failed to claim funds',
        onSuccess: (digest) => {
          console.log('✅ Claim successful:', digest);
          if (onSuccess) {
            setTimeout(() => onSuccess(), 500);
          }
        },
      });

      console.log('✅ Claim complete:', result);

    } catch (error) {
      console.error('❌ Claim error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      setError(`Failed to claim funds: ${errorMessage}`);
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle reclaim funds
  const handleReclaimFunds = async () => {
    if (!canReclaim || !account || userContributions.length === 0) return;

    setIsReclaiming(true);
    setError(null);

    try {
      console.log('🚀 Reclaiming funds for contributions:', userContributions.length);

      // Build transaction for each contribution
      const tx = new Transaction();

      // Get clock object
      const clock = tx.sharedObjectRef({
        objectId: '0x0000000000000000000000000000000000000000000000000000000000000006',
        initialSharedVersion: 1,
        mutable: false,
      });

      // For each contribution, call reclaim_funds
      for (const contribution of userContributions) {
        tx.moveCall({
          target: `${PACKAGE_ID}::foundry::reclaim_funds`,
          arguments: [
            tx.object(project.id.id),        // project: &mut Project
            tx.object(contribution.id.id),   // contribution: Contribution
            clock,                           // clock: &Clock
          ],
        });
      }

      console.log('📦 Transaction built for', userContributions.length, 'contributions');

      // Execute transaction
      const result = await executeTransaction(tx, {
        successMessage: `Successfully reclaimed ${userContributions.length} contribution(s)!`,
        errorMessage: 'Failed to reclaim funds',
        onSuccess: (digest) => {
          console.log('✅ Reclaim successful:', digest);
          if (onSuccess) {
            setTimeout(() => onSuccess(), 500);
          }
        },
      });

      console.log('✅ Reclaim complete:', result);

    } catch (error) {
      console.error('❌ Reclaim error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      setError(`Failed to reclaim funds: ${errorMessage}`);
    } finally {
      setIsReclaiming(false);
    }
  };

  // Don't render if no actions available
  if (!canClaim && !canReclaim) {
    return null;
  }

  return (
    <div className="claim-reclaim-widget">
      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Claim Funds Section */}
      {canClaim && (
        <div className="action-section claim-section">
          <div className="action-header">
            <h3>🎉 Goal Reached!</h3>
            <p>Congratulations! Your project has reached its funding goal.</p>
          </div>
          
          <div className="action-stats">
            <div className="stat">
              <span className="stat-label">Raised</span>
              <span className="stat-value">{currentFunding.toLocaleString()} SUI</span>
            </div>
            <div className="stat">
              <span className="stat-label">Goal</span>
              <span className="stat-value">{fundingGoal.toLocaleString()} SUI</span>
            </div>
            <div className="stat">
              <span className="stat-label">Progress</span>
              <span className="stat-value">{fundingProgress.toFixed(1)}%</span>
            </div>
          </div>

          <div className="action-info">
            <p>You can now claim the raised funds to your wallet.</p>
          </div>

          <button
            className="btn btn-primary btn-claim"
            onClick={handleClaimFunds}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <>
                <span className="spinner"></span>
                Claiming Funds...
              </>
            ) : (
              <>💰 Claim {currentFunding.toLocaleString()} SUI</>
            )}
          </button>
        </div>
      )}

      {/* Reclaim Funds Section */}
      {canReclaim && (
        <div className="action-section reclaim-section">
          <div className="action-header">
            <h3>⏰ Campaign Ended</h3>
            <p>The campaign has ended without reaching its goal.</p>
          </div>

          {isLoadingContributions ? (
            <div className="loading-contributions">
              <span className="spinner"></span>
              Loading your contributions...
            </div>
          ) : (
            <>
              <div className="action-stats">
                <div className="stat">
                  <span className="stat-label">Your Contributions</span>
                  <span className="stat-value">{userContributions.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Amount</span>
                  <span className="stat-value">
                    {userContributions.reduce((sum, c) => sum + mistToSui(parseInt(c.amount)), 0).toLocaleString()} SUI
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Goal</span>
                  <span className="stat-value">{fundingGoal.toLocaleString()} SUI</span>
                </div>
              </div>

              <div className="action-info">
                <p>You can reclaim your contributions since the goal wasn't met.</p>
                {userContributions.length > 0 && (
                  <div className="contributions-list">
                    <h4>Your Contributions:</h4>
                    <ul>
                      {userContributions.map((contribution, index) => (
                        <li key={contribution.id.id}>
                          Contribution #{index + 1}: {mistToSui(parseInt(contribution.amount)).toLocaleString()} SUI
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                className="btn btn-secondary btn-reclaim"
                onClick={handleReclaimFunds}
                disabled={isReclaiming || userContributions.length === 0}
              >
                {isReclaiming ? (
                  <>
                    <span className="spinner"></span>
                    Reclaiming Funds...
                  </>
                ) : (
                  <>💸 Reclaim {userContributions.reduce((sum, c) => sum + mistToSui(parseInt(c.amount)), 0).toLocaleString()} SUI</>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
