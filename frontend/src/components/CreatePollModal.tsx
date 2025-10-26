/**
 * Create Poll Modal Component
 * 
 * Modal for creating new polls for project governance
 * Handles poll data creation, Walrus upload, and on-chain poll creation
 */

import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { PACKAGE_ID } from '../config/constants';
import { uploadJson } from '../utils/walrusClient';
import { createPollData } from '../utils/walrusSchemas';
import type { Project } from '../types/contract';
import type { PollData } from '../types/walrus';
import './CreatePollModal.css';

interface CreatePollModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePollModal({ 
  project, 
  isOpen, 
  onClose, 
  onSuccess 
}: CreatePollModalProps) {
  const account = useCurrentAccount();
  const { executeTransaction } = useExecuteTransaction();

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    options: ['', ''], // Start with 2 empty options
    allowMultipleVotes: false,
    expiresAt: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setError(null);
  };

  // Handle option changes
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions,
    }));
    setError(null);
  };

  // Add new option
  const addOption = () => {
    if (formData.options.length < 10) { // Max 10 options
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, ''],
      }));
    }
  };

  // Remove option
  const removeOption = (index: number) => {
    if (formData.options.length > 2) { // Min 2 options
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions,
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    if (!formData.question.trim()) {
      setError('Poll question is required');
      return false;
    }

    if (formData.question.length < 10) {
      setError('Poll question must be at least 10 characters long');
      return false;
    }

    const validOptions = formData.options.filter(option => option.trim().length > 0);
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return false;
    }

    if (validOptions.length !== formData.options.length) {
      setError('All options must be filled');
      return false;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(option => option.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      setError('All options must be unique');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!account) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create poll data
      setCurrentStep('Creating poll data...');
      console.log('📝 Creating poll data...');

      const pollData = createPollData({
        question: formData.question,
        description: formData.description || undefined,
        options: formData.options.filter(option => option.trim().length > 0),
        allowMultipleVotes: formData.allowMultipleVotes,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
      });

      console.log('✅ Poll data created:', pollData);

      // Step 2: Upload to Walrus
      setCurrentStep('Uploading poll data to Walrus...');
      console.log('📤 Uploading to Walrus...');

      const uploadResult = await uploadJson(pollData, { epochs: 5 });
      const pollDataCid = uploadResult.cid;

      console.log('✅ Uploaded to Walrus:', pollDataCid);

      // Step 3: Build transaction
      setCurrentStep('Building transaction...');
      console.log('🔧 Building transaction...');

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::foundry::create_poll`,
        arguments: [
          tx.object(project.id.id),           // project: &mut Project
          tx.pure.string(formData.question),  // question: String
          tx.pure.vector('string', formData.options.filter(option => option.trim().length > 0)), // options: vector<String>
        ],
      });

      console.log('📦 Transaction built');

      // Step 4: Execute transaction
      setCurrentStep('Submitting transaction to Sui blockchain...');
      console.log('🚀 Executing transaction...');

      const result = await executeTransaction(tx, {
        successMessage: 'Poll created successfully!',
        errorMessage: 'Failed to create poll',
        onSuccess: (digest) => {
          console.log('✅ Poll created successfully:', digest);
          setCurrentStep('Poll created successfully!');
          
          // Reset form and close modal
          setFormData({
            question: '',
            description: '',
            options: ['', ''],
            allowMultipleVotes: false,
            expiresAt: '',
          });
          
          setTimeout(() => {
            onClose();
            if (onSuccess) {
              onSuccess();
            }
          }, 1000);
        },
      });

      console.log('✅ Poll creation complete:', result);

    } catch (error) {
      console.error('❌ Error creating poll:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      setError(`Failed to create poll: ${errorMessage}`);
      setCurrentStep('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        question: '',
        description: '',
        options: ['', ''],
        allowMultipleVotes: false,
        expiresAt: '',
      });
      setError(null);
      setCurrentStep('');
      onClose();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-poll-modal-overlay" onClick={handleClose}>
      <div 
        className="create-poll-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="modal-header">
          <h2>Create New Poll</h2>
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
          <form onSubmit={handleSubmit} className="poll-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Poll Information</h3>
              
              <div className="form-group">
                <label htmlFor="question">
                  Poll Question <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  placeholder="e.g., Should we implement feature X in the next release?"
                  required
                  disabled={isSubmitting}
                  maxLength={200}
                />
                <p className="field-hint">
                  {formData.question.length}/200 characters
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide additional context about this poll..."
                  rows={3}
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <p className="field-hint">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>

            {/* Poll Options */}
            <div className="form-section">
              <h3>Poll Options</h3>
              
              <div className="options-list">
                {formData.options.map((option, index) => (
                  <div key={index} className="option-input-group">
                    <div className="option-number">{index + 1}</div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      disabled={isSubmitting}
                      maxLength={100}
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        className="remove-option-btn"
                        onClick={() => removeOption(index)}
                        disabled={isSubmitting}
                        aria-label={`Remove option ${index + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {formData.options.length < 10 && (
                <button
                  type="button"
                  className="add-option-btn"
                  onClick={addOption}
                  disabled={isSubmitting}
                >
                  + Add Option
                </button>
              )}

              <p className="field-hint">
                Minimum 2 options, maximum 10 options
              </p>
            </div>

            {/* Poll Settings */}
            <div className="form-section">
              <h3>Poll Settings</h3>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="allowMultipleVotes"
                    checked={formData.allowMultipleVotes}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span className="checkbox-custom"></span>
                  Allow multiple votes per user
                </label>
                <p className="field-hint">
                  If enabled, users can vote for multiple options
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="expiresAt">Expiration Date (Optional)</label>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="field-hint">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Progress */}
            {isSubmitting && (
              <div className="progress-section">
                <div className="progress-info">
                  <span className="progress-step">{currentStep}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" />
                </div>
              </div>
            )}
          </form>
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
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.question || formData.options.filter(o => o.trim()).length < 2}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Creating Poll...
              </>
            ) : (
              <>🗳️ Create Poll</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
