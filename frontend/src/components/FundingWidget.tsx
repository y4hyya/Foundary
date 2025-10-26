/**
 * Funding Widget Component
 * 
 * Modal for funding a project with SUI tokens
 * Handles amount input, validation, and transaction execution
 */

import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { PACKAGE_ID, suiToMist, mistToSui } from '../config/constants';
import type { Project } from '../types/contract';
import './FundingWidget.css';

interface FundingWidgetProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FundingWidget({ 
  project, 
  isOpen, 
  onClose,
  onSuccess 
}: FundingWidgetProps) {
  const account = useCurrentAccount();
  const { executeTransaction } = useExecuteTransaction();

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate funding stats
  const currentFunding = mistToSui(parseInt(project.current_funding));
  const fundingGoal = mistToSui(parseInt(project.funding_goal));
  const remainingAmount = fundingGoal - currentFunding;
  const fundingProgress = (currentFunding / fundingGoal) * 100;

  // Preset amounts
  const presetAmounts = [
    Math.min(10, remainingAmount),
    Math.min(50, remainingAmount),
    Math.min(100, remainingAmount),
    Math.min(500, remainingAmount),
  ].filter(amt => amt > 0);

  // Handle amount change
  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  // Set preset amount
  const setPresetAmount = (value: number) => {
    setAmount(value.toString());
    setError(null);
  };

  // Validate amount
  const validateAmount = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    const amountNum = parseFloat(amount);

    if (amountNum < 0.01) {
      setError('Minimum funding amount is 0.01 SUI');
      return false;
    }

    if (amountNum > 10000) {
      setError('Maximum funding amount is 10,000 SUI per transaction');
      return false;
    }

    return true;
  };

  // Handle fund project
  const handleFundProject = async () => {
    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    if (!validateAmount()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const amountMist = suiToMist(parseFloat(amount));

      console.log('🚀 Funding project:', {
        projectId: project.id.id,
        amount: `${amount} SUI`,
        amountMist,
      });

      // Build transaction
      const tx = new Transaction();

      // Split coins to get exact amount
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);

      // Get clock object (0x6 is the shared Clock object on Sui)
      const clock = tx.sharedObjectRef({
        objectId: '0x0000000000000000000000000000000000000000000000000000000000000006',
        initialSharedVersion: 1,
        mutable: false,
      });

      // Call fund_project
      tx.moveCall({
        target: `${PACKAGE_ID}::foundry::fund_project`,
        arguments: [
          tx.object(project.id.id),  // project: &mut Project
          coin,                       // payment: Coin<SUI>
          clock,                      // clock: &Clock
        ],
      });

      console.log('📦 Transaction built');

      // Execute transaction
      const result = await executeTransaction(tx, {
        successMessage: `Successfully funded with ${amount} SUI!`,
        errorMessage: 'Failed to fund project',
        onSuccess: (digest) => {
          console.log('✅ Transaction successful:', digest);
          
          // Close modal and trigger success callback
          setAmount('');
          onClose();
          
          if (onSuccess) {
            setTimeout(() => onSuccess(), 500);
          }
        },
      });

      console.log('✅ Funding complete:', result);

    } catch (error) {
      console.error('❌ Funding error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      setError(`Failed to fund project: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('');
      setError(null);
      onClose();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
      handleClose();
    }
    if (e.key === 'Enter' && amount && !isSubmitting) {
      handleFundProject();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="funding-modal-overlay" onClick={handleClose}>
      <div 
        className="funding-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="modal-header">
          <h2>Fund This Project</h2>
          <button
            className="close-button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Project Info */}
          <div className="project-summary">
            <div className="summary-stat">
              <span className="stat-label">Current Funding</span>
              <span className="stat-value">{currentFunding.toLocaleString()} SUI</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Goal</span>
              <span className="stat-value">{fundingGoal.toLocaleString()} SUI</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Remaining</span>
              <span className="stat-value highlight">{remainingAmount.toLocaleString()} SUI</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="funding-progress">
            <div className="progress-info">
              <span>{fundingProgress.toFixed(1)}% funded</span>
              <span>{remainingAmount > 0 ? `${remainingAmount.toFixed(2)} SUI to go` : 'Goal reached!'}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(fundingProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label htmlFor="amount">
              Amount to Fund (SUI) <span className="required">*</span>
            </label>
            <div className="amount-input-wrapper">
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="amount-input"
                disabled={isSubmitting}
                autoFocus
              />
              <span className="input-suffix">SUI</span>
            </div>
            <p className="field-hint">
              Minimum: 0.01 SUI | Maximum: 10,000 SUI per transaction
            </p>
          </div>

          {/* Preset Amounts */}
          {presetAmounts.length > 0 && (
            <div className="preset-amounts">
              <label>Quick Select:</label>
              <div className="preset-buttons">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="preset-button"
                    onClick={() => setPresetAmount(preset)}
                    disabled={isSubmitting}
                  >
                    {preset} SUI
                  </button>
                ))}
                {remainingAmount > 0 && remainingAmount <= 10000 && (
                  <button
                    type="button"
                    className="preset-button preset-full"
                    onClick={() => setPresetAmount(remainingAmount)}
                    disabled={isSubmitting}
                  >
                    Full Amount ({remainingAmount.toFixed(2)} SUI)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="info-box">
            <h4>💡 What happens when you fund:</h4>
            <ul>
              <li>Your SUI tokens will be transferred to the project</li>
              <li>You'll receive a Contribution NFT as proof of backing</li>
              <li>If the project doesn't reach its goal, you can reclaim your funds</li>
              <li>Gas fees apply (~0.001 SUI)</li>
            </ul>
          </div>

          {/* Wallet Info */}
          {account && (
            <div className="wallet-info">
              <span className="wallet-label">Your Wallet:</span>
              <span className="wallet-address">{account.address.substring(0, 12)}...{account.address.slice(-8)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleFundProject}
            disabled={isSubmitting || !amount}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              <>💰 Fund {amount ? `${amount} SUI` : 'Project'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

