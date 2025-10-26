/**
 * Jobs Tab Component
 * 
 * Displays all jobs for a project and allows posting new jobs
 * Integrates with Walrus for job descriptions and on-chain job storage
 */

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '../hooks/useSuiProvider';
import { PACKAGE_ID } from '../config/constants';
import { fetchJson } from '../utils/walrusClient';
import { createJobDescription } from '../utils/walrusSchemas';
import type { Project, Job } from '../types/contract';
import type { JobDescription } from '../types/walrus';
import PostJobModal from './PostJobModal';
import './JobsTab.css';

interface JobsTabProps {
  project: Project;
  onSuccess?: () => void;
}

export default function JobsTab({ project, onSuccess }: JobsTabProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { executeTransaction } = useExecuteTransaction();

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<Record<string, JobDescription>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);

  // Check if user is project owner
  const isOwner = account && project.owner === account.address;

  // Fetch jobs from the project
  const fetchJobs = async () => {
    if (!project.id.id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching jobs for project:', project.id.id);

      // Get the project object to access the jobs table
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
      const jobsTable = fields.jobs;

      if (!jobsTable || !jobsTable.fields?.contents) {
        console.log('No jobs found in project');
        setJobs([]);
        return;
      }

      // Extract jobs from the table
      const jobsList: Job[] = [];
      const contents = jobsTable.fields.contents;

      for (const [key, value] of Object.entries(contents)) {
        if (value && typeof value === 'object' && 'fields' in value) {
          const jobFields = (value as any).fields;
          
          jobsList.push({
            id: key,
            title: jobFields.title || 'Untitled Job',
            description_cid: jobFields.description_cid || '',
          });
        }
      }

      console.log('📋 Found jobs:', jobsList.length);
      setJobs(jobsList);

      // Fetch job descriptions from Walrus
      await fetchJobDescriptions(jobsList);

    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch job descriptions from Walrus
  const fetchJobDescriptions = async (jobsList: Job[]) => {
    const descriptions: Record<string, JobDescription> = {};

    for (const job of jobsList) {
      if (job.description_cid) {
        try {
          console.log('📥 Fetching job description:', job.description_cid);
          const description = await fetchJson<JobDescription>(job.description_cid);
          descriptions[job.id] = description;
        } catch (error) {
          console.warn('Failed to fetch job description:', job.description_cid, error);
          // Create a fallback description
          descriptions[job.id] = {
            title: job.title,
            description: 'Description not available',
            responsibilities: [],
            requirements: { skills: [], experience: 'Not specified' },
            compensation: { type: 'negotiable' },
            duration: 'Not specified',
            workType: 'remote',
            experienceLevel: 'any',
            applicationInstructions: 'Contact project owner',
            version: '1.0.0',
            createdAt: Date.now(),
          };
        }
      }
    }

    setJobDescriptions(descriptions);
  };

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [project.id.id]);

  // Handle job posting success
  const handleJobPosted = () => {
    console.log('✅ Job posted successfully, refreshing...');
    fetchJobs();
    if (onSuccess) {
      onSuccess();
    }
  };

  // Handle retry
  const handleRetry = () => {
    fetchJobs();
  };

  return (
    <div className="jobs-tab">
      {/* Header */}
      <div className="jobs-header">
        <div className="jobs-title-section">
          <h2>Project Jobs</h2>
          <p>Find opportunities to contribute to this project</p>
        </div>

        {/* Post Job Button (Owner Only) */}
        {isOwner && (
          <button
            className="btn btn-primary post-job-btn"
            onClick={() => setIsPostJobModalOpen(true)}
          >
            📝 Post New Job
          </button>
        )}
      </div>

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
          <p>Loading jobs...</p>
        </div>
      )}

      {/* Jobs List */}
      {!isLoading && !error && (
        <div className="jobs-content">
          {jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💼</div>
              <h3>No Jobs Posted Yet</h3>
              <p>
                {isOwner 
                  ? "Be the first to post a job opportunity for this project."
                  : "No job opportunities have been posted for this project yet."
                }
              </p>
              {isOwner && (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsPostJobModalOpen(true)}
                >
                  Post First Job
                </button>
              )}
            </div>
          ) : (
            <div className="jobs-list">
              {jobs.map((job) => {
                const description = jobDescriptions[job.id];
                
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    description={description}
                    isOwner={isOwner}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Post Job Modal */}
      <PostJobModal
        project={project}
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
        onSuccess={handleJobPosted}
      />
    </div>
  );
}

// Job Card Component
interface JobCardProps {
  job: Job;
  description?: JobDescription;
  isOwner: boolean;
}

function JobCard({ job, description, isOwner }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) {
    return (
      <div className="job-card loading">
        <div className="job-header">
          <h3>{job.title}</h3>
          <span className="job-status">Loading...</span>
        </div>
        <div className="job-content">
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-card">
      <div className="job-header">
        <div className="job-title-section">
          <h3>{description.title}</h3>
          <div className="job-meta">
            <span className="job-type">{description.workType}</span>
            <span className="job-duration">{description.duration}</span>
            <span className="job-level">{description.experienceLevel}</span>
          </div>
        </div>
        <div className="job-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>

      <div className="job-content">
        <p className="job-description">{description.description}</p>

        {isExpanded && (
          <div className="job-details">
            {/* Responsibilities */}
            {description.responsibilities.length > 0 && (
              <div className="job-section">
                <h4>Responsibilities</h4>
                <ul>
                  {description.responsibilities.map((responsibility, index) => (
                    <li key={index}>{responsibility}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            <div className="job-section">
              <h4>Requirements</h4>
              <div className="requirements-grid">
                <div className="requirement-item">
                  <strong>Experience:</strong> {description.requirements.experience}
                </div>
                {description.requirements.skills.length > 0 && (
                  <div className="requirement-item">
                    <strong>Skills:</strong> {description.requirements.skills.join(', ')}
                  </div>
                )}
                {description.requirements.education && (
                  <div className="requirement-item">
                    <strong>Education:</strong> {description.requirements.education}
                  </div>
                )}
              </div>
            </div>

            {/* Compensation */}
            <div className="job-section">
              <h4>Compensation</h4>
              <div className="compensation-details">
                <span className="compensation-type">{description.compensation.type}</span>
                {description.compensation.amount && (
                  <span className="compensation-amount">
                    {description.compensation.amount} {description.compensation.currency || 'SUI'}
                  </span>
                )}
                {description.compensation.description && (
                  <p className="compensation-desc">{description.compensation.description}</p>
                )}
              </div>
            </div>

            {/* Application Instructions */}
            <div className="job-section">
              <h4>How to Apply</h4>
              <p>{description.applicationInstructions}</p>
              {description.contactEmail && (
                <p>
                  <strong>Contact:</strong> 
                  <a href={`mailto:${description.contactEmail}`}>
                    {description.contactEmail}
                  </a>
                </p>
              )}
            </div>

            {/* Additional Info */}
            {(description.location || description.benefits?.length > 0) && (
              <div className="job-section">
                <h4>Additional Information</h4>
                {description.location && (
                  <p><strong>Location:</strong> {description.location}</p>
                )}
                {description.benefits && description.benefits.length > 0 && (
                  <div>
                    <strong>Benefits:</strong>
                    <ul>
                      {description.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
