/**
 * Post Job Modal Component
 * 
 * Modal for posting new jobs to a project
 * Handles job description creation, Walrus upload, and on-chain job posting
 */

import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { PACKAGE_ID } from '../config/constants';
import { uploadJson } from '../utils/walrusClient';
import { createJobDescription } from '../utils/walrusSchemas';
import type { Project } from '../types/contract';
import type { JobDescription, WorkType, ExperienceLevel, CompensationType } from '../types/walrus';
import './PostJobModal.css';

interface PostJobModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PostJobModal({ 
  project, 
  isOpen, 
  onClose, 
  onSuccess 
}: PostJobModalProps) {
  const account = useCurrentAccount();
  const { executeTransaction } = useExecuteTransaction();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    responsibilities: '',
    experience: '',
    education: '',
    skills: '',
    compensationType: 'negotiable' as CompensationType,
    compensationAmount: '',
    compensationCurrency: 'SUI',
    compensationDescription: '',
    duration: 'Full-time',
    workType: 'remote' as WorkType,
    experienceLevel: 'any' as ExperienceLevel,
    location: '',
    benefits: '',
    applicationInstructions: '',
    contactEmail: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  // Handle array inputs (responsibilities, skills, benefits)
  const handleArrayChange = (field: string, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setFormData(prev => ({
      ...prev,
      [field]: array,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    if (!formData.title.trim()) {
      setError('Job title is required');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Job description is required');
      return false;
    }

    if (!formData.applicationInstructions.trim()) {
      setError('Application instructions are required');
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
      // Step 1: Create job description
      setCurrentStep('Creating job description...');
      console.log('📝 Creating job description...');

      const jobDescription = createJobDescription({
        title: formData.title,
        description: formData.description,
        responsibilities: formData.responsibilities.split(',').map(r => r.trim()).filter(r => r),
        requirements: {
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
          experience: formData.experience || 'Not specified',
          education: formData.education || undefined,
        },
        compensation: {
          type: formData.compensationType,
          amount: formData.compensationAmount ? parseFloat(formData.compensationAmount) : undefined,
          currency: formData.compensationCurrency,
          description: formData.compensationDescription || undefined,
        },
        duration: formData.duration,
        workType: formData.workType,
        experienceLevel: formData.experienceLevel,
        location: formData.location || undefined,
        benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b),
        applicationInstructions: formData.applicationInstructions,
        contactEmail: formData.contactEmail || undefined,
      });

      console.log('✅ Job description created:', jobDescription);

      // Step 2: Upload to Walrus
      setCurrentStep('Uploading job description to Walrus...');
      console.log('📤 Uploading to Walrus...');

      const uploadResult = await uploadJson(jobDescription, { epochs: 5 });
      const descriptionCid = uploadResult.cid;

      console.log('✅ Uploaded to Walrus:', descriptionCid);

      // Step 3: Build transaction
      setCurrentStep('Building transaction...');
      console.log('🔧 Building transaction...');

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::foundry::post_job`,
        arguments: [
          tx.object(project.id.id),           // project: &mut Project
          tx.pure.string(formData.title),     // title: String
          tx.pure.string(descriptionCid),     // description_cid: String
        ],
      });

      console.log('📦 Transaction built');

      // Step 4: Execute transaction
      setCurrentStep('Submitting transaction to Sui blockchain...');
      console.log('🚀 Executing transaction...');

      const result = await executeTransaction(tx, {
        successMessage: 'Job posted successfully!',
        errorMessage: 'Failed to post job',
        onSuccess: (digest) => {
          console.log('✅ Job posted successfully:', digest);
          setCurrentStep('Job posted successfully!');
          
          // Reset form and close modal
          setFormData({
            title: '',
            description: '',
            responsibilities: '',
            experience: '',
            education: '',
            skills: '',
            compensationType: 'negotiable',
            compensationAmount: '',
            compensationCurrency: 'SUI',
            compensationDescription: '',
            duration: 'Full-time',
            workType: 'remote',
            experienceLevel: 'any',
            location: '',
            benefits: '',
            applicationInstructions: '',
            contactEmail: '',
          });
          
          setTimeout(() => {
            onClose();
            if (onSuccess) {
              onSuccess();
            }
          }, 1000);
        },
      });

      console.log('✅ Job posting complete:', result);

    } catch (error) {
      console.error('❌ Error posting job:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      setError(`Failed to post job: ${errorMessage}`);
      setCurrentStep('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        responsibilities: '',
        experience: '',
        education: '',
        skills: '',
        compensationType: 'negotiable',
        compensationAmount: '',
        compensationCurrency: 'SUI',
        compensationDescription: '',
        duration: 'Full-time',
        workType: 'remote',
        experienceLevel: 'any',
        location: '',
        benefits: '',
        applicationInstructions: '',
        contactEmail: '',
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
    <div className="post-job-modal-overlay" onClick={handleClose}>
      <div 
        className="post-job-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="modal-header">
          <h2>Post New Job</h2>
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
          <form onSubmit={handleSubmit} className="job-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="title">
                  Job Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Senior Sui Developer"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  Job Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the role, what the person will be working on, and what makes this opportunity exciting..."
                  rows={4}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="responsibilities">Key Responsibilities</label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => handleArrayChange('responsibilities', e.target.value)}
                  placeholder="e.g., Develop smart contracts, Review code, Mentor junior developers"
                  rows={3}
                  disabled={isSubmitting}
                />
                <p className="field-hint">Separate multiple responsibilities with commas</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="form-section">
              <h3>Requirements</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="experience">Experience Level</label>
                  <select
                    id="experienceLevel"
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="any">Any Experience</option>
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="senior">Senior Level</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="experience">Years of Experience</label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g., 3+ years"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="skills">Required Skills</label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={(e) => handleArrayChange('skills', e.target.value)}
                  placeholder="e.g., Sui Move, React, TypeScript, Smart Contracts"
                  disabled={isSubmitting}
                />
                <p className="field-hint">Separate multiple skills with commas</p>
              </div>

              <div className="form-group">
                <label htmlFor="education">Education Requirements</label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="e.g., Bachelor's in Computer Science or equivalent experience"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Compensation */}
            <div className="form-section">
              <h3>Compensation</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="compensationType">Compensation Type</label>
                  <select
                    id="compensationType"
                    name="compensationType"
                    value={formData.compensationType}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="negotiable">Negotiable</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="milestone">Per Milestone</option>
                    <option value="equity">Equity/Tokens</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>

                {formData.compensationType !== 'negotiable' && formData.compensationType !== 'volunteer' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="compensationAmount">Amount</label>
                      <input
                        type="number"
                        id="compensationAmount"
                        name="compensationAmount"
                        value={formData.compensationAmount}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="compensationCurrency">Currency</label>
                      <select
                        id="compensationCurrency"
                        name="compensationCurrency"
                        value={formData.compensationCurrency}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="SUI">SUI</option>
                        <option value="USD">USD</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="compensationDescription">Additional Compensation Details</label>
                <textarea
                  id="compensationDescription"
                  name="compensationDescription"
                  value={formData.compensationDescription}
                  onChange={handleChange}
                  placeholder="e.g., Payment schedule, bonus structure, equity details..."
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Work Details */}
            <div className="form-section">
              <h3>Work Details</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration</label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="workType">Work Type</label>
                  <select
                    id="workType"
                    name="workType"
                    value={formData.workType}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on_site">On-site</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location (if applicable)</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., San Francisco, CA or Global"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="benefits">Benefits & Perks</label>
                <input
                  type="text"
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={(e) => handleArrayChange('benefits', e.target.value)}
                  placeholder="e.g., Flexible hours, Health insurance, Token allocation"
                  disabled={isSubmitting}
                />
                <p className="field-hint">Separate multiple benefits with commas</p>
              </div>
            </div>

            {/* Application */}
            <div className="form-section">
              <h3>Application Process</h3>
              
              <div className="form-group">
                <label htmlFor="applicationInstructions">
                  How to Apply <span className="required">*</span>
                </label>
                <textarea
                  id="applicationInstructions"
                  name="applicationInstructions"
                  value={formData.applicationInstructions}
                  onChange={handleChange}
                  placeholder="e.g., Send your resume and portfolio to email@example.com, or apply through our website..."
                  rows={3}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactEmail">Contact Email (optional)</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="jobs@project.com"
                  disabled={isSubmitting}
                />
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
            disabled={isSubmitting || !formData.title || !formData.description}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Posting Job...
              </>
            ) : (
              <>📝 Post Job</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
