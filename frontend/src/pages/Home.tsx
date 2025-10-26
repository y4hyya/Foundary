/**
 * Home Page
 * 
 * Displays a gallery of all crowdfunding projects on Sui
 */

import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAllProjects } from '../hooks/useProjects';
import ProjectCard from '../components/ProjectCard';
import { ProjectCategory } from '../types/walrus';
import './Home.css';

export default function Home() {
  const { data: projects, isLoading, isError, error, refetch } = useAllProjects();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects by category and search
  // For now, we display all projects as filtering by category
  // requires fetching metadata for each project first
  const filteredProjects = projects;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Fund Innovation on Sui
          </h1>
          <p className="hero-subtitle">
            Discover and support groundbreaking projects on the Sui blockchain.
            Decentralized, transparent, and secure crowdfunding.
          </p>
          <div className="hero-actions">
            <Link to="/create-project">
              <button className="btn btn-primary">
                🚀 Launch Your Project
              </button>
            </Link>
            <button className="btn btn-secondary" onClick={() => {
              document.getElementById('projects-section')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}>
              Explore Projects
            </button>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects-section" className="projects-section">
        <div className="section-header">
          <div className="header-main">
            <h2>Discover Projects</h2>
            <p className="subtitle">
              {isLoading ? (
                'Loading projects...'
              ) : projects && projects.length > 0 ? (
                `${projects.length} project${projects.length === 1 ? '' : 's'} seeking funding`
              ) : (
                'No projects yet. Be the first to create one!'
              )}
            </p>
          </div>
          
          {/* Filters */}
          {projects && projects.length > 0 && (
            <div className="filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <select 
                className="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
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
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Fetching projects from Sui blockchain...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h3>Failed to load projects</h3>
            <p>{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            <button className="btn btn-primary" onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!projects || projects.length === 0) && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Projects Yet</h3>
            <p>
              Be the first to launch a project on Foundry!
              Create innovative campaigns and get funded by the Sui community.
            </p>
            <Link to="/create-project">
              <button className="btn btn-primary">
                Create First Project
              </button>
            </Link>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !isError && filteredProjects && filteredProjects.length > 0 && (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* Stats Section */}
      {projects && projects.length > 0 && (
        <section className="stats-section">
          <h2>Platform Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{projects.length}</div>
              <div className="stat-label">Active Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {projects.reduce((sum, p) => {
                  const current = parseInt(p.current_funding) / 1_000_000_000;
                  return sum + current;
                }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="stat-label">SUI Raised</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {projects.filter(p => !p.is_withdrawn).length}
              </div>
              <div className="stat-label">Seeking Funding</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {projects.filter(p => p.is_withdrawn).length}
              </div>
              <div className="stat-label">Successfully Funded</div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create Project</h3>
            <p>
              Launch your project with detailed information, milestones, and funding goals.
              All data is stored securely on Walrus.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Get Funded</h3>
            <p>
              Backers discover your project and contribute SUI tokens.
              Funds are held in smart contracts for security.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Deliver Results</h3>
            <p>
              Meet your milestones and claim funds when goals are reached.
              Backers can vote and provide feedback.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
