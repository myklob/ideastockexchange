import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import ReasonRankTemplate from './components/ReasonRankTemplate.js';
import LoginForm from './components/Auth/LoginForm.js';
import RegisterForm from './components/Auth/RegisterForm.js';
import BeliefForm from './components/Beliefs/BeliefForm.js';

// Home Page
const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Idea Stock Exchange</h1>
        <p className="text-xl text-gray-600 mb-4">
          Automated Conflict Resolution through Evidence-Based Reasoning
        </p>
        {!isAuthenticated && (
          <div className="flex gap-4 justify-center">
            <Link
              to="/login"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
      <ReasonRankTemplate />
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);

  const handleLoginSuccess = () => {
    navigate('/');
  };

  const handleRegisterSuccess = () => {
    navigate('/');
  };

  if (showRegister) {
    return (
      <div className="p-8">
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <LoginForm
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    </div>
  );
};

// Register Page
const RegisterPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="p-8">
      <RegisterForm
        onSuccess={handleSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

// Create Belief Page
const CreateBeliefPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-4">Please login to create a belief</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="p-8">
      <BeliefForm onSuccess={handleSuccess} onCancel={() => navigate('/')} />
    </div>
  );
};

// Beliefs List (placeholder)
const BeliefsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">All Beliefs</h1>
    <p>Beliefs list (coming soon)</p>
  </div>
);

// Belief Details (placeholder)
const BeliefDetails = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Belief Details</h1>
    <p>Detailed view of a belief (coming soon)</p>
  </div>
);

// Argument Ranking (placeholder)
const ArgumentRank = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Argument Ranking</h1>
    <p>Argument ranking system (coming soon)</p>
  </div>
);

// Profile (placeholder)
const Profile = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Login</h2>
        <Link to="/login" className="text-blue-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Reputation:</strong> {user?.reputation || 0}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>
    </div>
  );
};

// Not Found
const NotFound = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">404 - Not Found</h1>
    <p className="mb-4">The page you're looking for doesn't exist.</p>
    <Link to="/" className="text-blue-600 hover:underline">
      Go Home
    </Link>
  </div>
);

// Main App Component
const App = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg mb-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl font-bold hover:text-blue-600 transition-colors">
              Idea Stock Exchange
            </Link>

            <div className="flex gap-4 items-center">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link to="/beliefs" className="hover:text-blue-600 transition-colors">
                Beliefs
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/create-belief"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Belief
                  </Link>
                  <Link to="/profile" className="hover:text-blue-600 transition-colors">
                    {user?.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/beliefs" element={<BeliefsPage />} />
          <Route path="/belief/:id" element={<BeliefDetails />} />
          <Route path="/create-belief" element={<CreateBeliefPage />} />
          <Route path="/rank" element={<ArgumentRank />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
