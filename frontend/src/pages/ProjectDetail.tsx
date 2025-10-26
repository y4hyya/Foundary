import { useParams, Link } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="project-detail-page">
      <Link to="/">← Back to Home</Link>
      
      <h1>Project Details</h1>
      <p>Project ID: {id}</p>

      <section className="project-info">
        <h2>Project Information</h2>
        {/* Project details will be loaded here */}
        <p>Loading project information...</p>
      </section>

      <section className="funding-section">
        <h3>Support This Project</h3>
        <button>Fund Project</button>
      </section>
    </div>
  );
}

