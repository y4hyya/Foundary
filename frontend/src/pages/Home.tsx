import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-page">
      <h1>Foundry - Sui Crowdfunding Platform</h1>
      <p>Welcome to Foundry, a decentralized crowdfunding platform built on Sui blockchain.</p>
      
      <div className="actions">
        <Link to="/create-project">
          <button>Create New Project</button>
        </Link>
      </div>

      <section className="projects-section">
        <h2>Featured Projects</h2>
        <p>Browse and support innovative projects on the Sui blockchain.</p>
        {/* Project list will be added here */}
      </section>
    </div>
  );
}

