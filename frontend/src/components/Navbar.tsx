import { Link, useLocation } from 'react-router-dom';
import WalletConnectButton from './WalletConnectButton';
import './Navbar.css';

/**
 * Navbar - Global navigation bar component
 * 
 * Provides navigation links and wallet connection functionality
 */
export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/">
            <h1>Foundry</h1>
          </Link>
          <span className="navbar-subtitle">Sui Crowdfunding</span>
        </div>

        <div className="navbar-menu">
          <Link to="/" className={`navbar-link ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/create-project" className={`navbar-link ${isActive('/create-project')}`}>
            Create Project
          </Link>
        </div>

        <div className="navbar-wallet">
          <WalletConnectButton />
        </div>
      </div>
    </nav>
  );
}

