import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/">
          <h1>IdeaStockExchange</h1>
        </Link>
        <nav>
          <Link to="/">Debates</Link>
          <Link to="/media">Media Library</Link>
          {isAuthenticated ? (
            <>
              <Link to="/debates/create">Create Debate</Link>
              <span>Welcome, {user?.username}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
