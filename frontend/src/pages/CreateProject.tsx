/**
 * Create Project Page
 * 
 * Form for creating a new crowdfunding project with Walrus uploads
 * and blockchain transaction execution
 */

import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { createProjectMetadata } from '../utils/walrusSchemas';
import { uploadImage } from '../utils/walrusUpload';
import { uploadJson } from '../utils/walrusClient';
import { ProjectCategory } from '../types/walrus';
import { PACKAGE_ID, suiToMist } from '../config/constants';
import './CreateProject.css';

interface FormData {
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  tags: string;
  fundingGoal: string;
  deadline: string;
  risks: string;
  creatorName: string;
  creatorBio: string;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { executeTransaction } = useExecuteTransaction();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    shortDescription: '',
    category: ProjectCategory.TECHNOLOGY,
    tags: '',
    fundingGoal: '',
    deadline: '',
    risks: '',
    creatorName: '',
    creatorBio: '',
  });

  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Handle text input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get minimum deadline (tomorrow)
  const getMinDeadline = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!account) {
      setError('Please connect your wallet first');
      return false;
    }

    if (!formData.name.trim()) {
      setError('Project name is required');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }

    if (!formData.creatorName.trim()) {
      setError('Creator name is required');
      return false;
    }

    const goal = parseFloat(formData.fundingGoal);
    if (isNaN(goal) || goal <= 0) {
      setError('Funding goal must be greater than 0');
      return false;
    }

    if (!formData.deadline) {
      setError('Deadline is required');
      return false;
    }

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) {
      setError('Deadline must be in the future');
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
    setUploadProgress(0);

    try {
      // Step 1: Upload logo to Walrus (if provided)
      let logoCid: string | undefined;
      
      if (logoFile) {
        setCurrentStep('Uploading project logo to Walrus...');
        console.log('📤 Uploading logo to Walrus...');
        
        const logoUploadResult = await uploadImage(logoFile, {
          epochs: 5,
          maxSizeMB: 5,
          onProgress: (progress) => {
            setUploadProgress(Math.floor(progress * 0.3)); // 0-30%
          },
        });
        
        logoCid = logoUploadResult.cid;
        console.log('✅ Logo uploaded:', logoCid);
      }

      // Step 2: Construct ProjectMetadata
      setCurrentStep('Preparing project metadata...');
      setUploadProgress(35);
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const metadata = createProjectMetadata({
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription || formData.description.substring(0, 200),
        logoCid,
        category: formData.category as ProjectCategory,
        tags: tagsArray,
        creator: {
          name: formData.creatorName,
          bio: formData.creatorBio,
          walletAddress: account.address,
        },
        milestones: [], // Can be added later
        risks: formData.risks || 'No specific risks identified.',
        faq: [],
      });

      console.log('📝 Project metadata created:', metadata);

      // Step 3: Upload metadata JSON to Walrus
      setCurrentStep('Uploading metadata to Walrus...');
      setUploadProgress(40);
      console.log('📤 Uploading metadata to Walrus...');
      
      const metadataUploadResult = await uploadJson(metadata, { epochs: 5 });
      const metadataCid = metadataUploadResult.cid;
      
      console.log('✅ Metadata uploaded:', metadataCid);
      setUploadProgress(60);

      // Step 4: Prepare blockchain transaction
      setCurrentStep('Preparing blockchain transaction...');
      setUploadProgress(70);
      
      const fundingGoalMist = suiToMist(parseFloat(formData.fundingGoal));
      const deadlineTimestamp = new Date(formData.deadline).getTime();

      console.log('🔧 Transaction parameters:', {
        metadataCid,
        fundingGoalMist,
        deadlineTimestamp,
      });

      // Step 5: Build Transaction
      setCurrentStep('Building transaction...');
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::foundry::create_project`,
        arguments: [
          tx.pure.string(metadataCid),
          tx.pure.u64(fundingGoalMist),
          tx.pure.u64(deadlineTimestamp),
        ],
      });

      console.log('📦 Transaction built');
      setUploadProgress(80);

      // Step 6: Execute transaction
      setCurrentStep('Submitting transaction to Sui blockchain...');
      console.log('🚀 Executing transaction...');
      
      const result = await executeTransaction(tx, {
        successMessage: 'Project created successfully!',
        errorMessage: 'Failed to create project',
        onSuccess: (digest) => {
          console.log('✅ Transaction successful:', digest);
          setUploadProgress(100);
          setCurrentStep('Project created successfully!');
          
          // Navigate to home after short delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        },
      });

      console.log('✅ Project created:', result);

    } catch (error) {
      console.error('❌ Error creating project:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      setError(`Failed to create project: ${errorMessage}`);
      setCurrentStep('');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if wallet is connected
  if (!account) {
    return (
      <div className="create-project-page">
        <div className="wallet-required">
          <div className="warning-icon">⚠️</div>
          <h2>Wallet Connection Required</h2>
          <p>Please connect your Sui wallet to create a project.</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="create-project-page">
      <div className="page-header">
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
        <h1>Create New Project</h1>
        <p className="subtitle">
          Launch your crowdfunding campaign on Sui blockchain with decentralized storage
        </p>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        {/* Project Logo */}
        <div className="form-section">
          <h3>Project Logo</h3>
          <div className="form-group">
            <label>Logo Image (Optional)</label>
            <p className="field-hint">Upload a logo for your project (PNG, JPEG, GIF, WebP - max 5MB)</p>
            
            <div className="file-upload-area">
              {!logoPreview ? (
                <div className="file-upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon">📷</div>
                  <p>Click to upload or drag and drop</p>
                  <p className="upload-hint">Recommended: 400x400px</p>
                </div>
              ) : (
                <div className="file-preview">
                  <img src={logoPreview} alt="Logo preview" />
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={handleRemoveFile}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">
              Project Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your project name"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="shortDescription">
              Short Description
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Brief one-line description"
              maxLength={200}
            />
            <p className="field-hint">This will appear in project cards (max 200 characters)</p>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Full Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your project in detail (Markdown supported)"
              rows={8}
              required
            />
            <p className="field-hint">Supports Markdown formatting</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value={ProjectCategory.TECHNOLOGY}>Technology</option>
                <option value={ProjectCategory.ART}>Art & Design</option>
                <option value={ProjectCategory.GAMES}>Gaming</option>
                <option value={ProjectCategory.DEFI}>DeFi</option>
                <option value={ProjectCategory.NFT}>NFT</option>
                <option value={ProjectCategory.DAO}>DAO</option>
                <option value={ProjectCategory.SOCIAL}>Social</option>
                <option value={ProjectCategory.EDUCATION}>Education</option>
                <option value={ProjectCategory.INFRASTRUCTURE}>Infrastructure</option>
                <option value={ProjectCategory.OTHER}>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="blockchain, defi, innovation"
              />
              <p className="field-hint">Comma-separated tags for discoverability</p>
            </div>
          </div>
        </div>

        {/* Funding Details */}
        <div className="form-section">
          <h3>Funding Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fundingGoal">
                Funding Goal (SUI) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="fundingGoal"
                name="fundingGoal"
                value={formData.fundingGoal}
                onChange={handleChange}
                placeholder="1000"
                min="0.01"
                step="0.01"
                required
              />
              <p className="field-hint">Amount of SUI tokens you want to raise</p>
            </div>

            <div className="form-group">
              <label htmlFor="deadline">
                Deadline <span className="required">*</span>
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={getMinDeadline()}
                required
              />
              <p className="field-hint">Campaign end date</p>
            </div>
          </div>
        </div>

        {/* Creator Information */}
        <div className="form-section">
          <h3>Creator Information</h3>
          
          <div className="form-group">
            <label htmlFor="creatorName">
              Your Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="creatorName"
              name="creatorName"
              value={formData.creatorName}
              onChange={handleChange}
              placeholder="Enter your name or alias"
              required
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="creatorBio">Your Bio</label>
            <textarea
              id="creatorBio"
              name="creatorBio"
              value={formData.creatorBio}
              onChange={handleChange}
              placeholder="Tell backers about yourself"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        {/* Risk Disclosure */}
        <div className="form-section">
          <h3>Risks & Challenges</h3>
          
          <div className="form-group">
            <label htmlFor="risks">Project Risks</label>
            <textarea
              id="risks"
              name="risks"
              value={formData.risks}
              onChange={handleChange}
              placeholder="Describe potential risks and challenges (optional)"
              rows={4}
            />
            <p className="field-hint">Transparency builds trust with backers</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Progress Display */}
        {isSubmitting && (
          <div className="progress-section">
            <div className="progress-info">
              <span className="progress-step">{currentStep}</span>
              <span className="progress-percent">{uploadProgress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Project...' : '🚀 Create Project'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
