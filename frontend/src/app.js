import React from "react";
import { Routes, Route } from "react-router-dom";
import ReasonRankTemplate from "./components/ReasonRankTemplate.js";

// Placeholder components - to be implemented
const Home = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">Idea Stock Exchange</h1>
    <p className="text-lg mb-4">Welcome to the Idea Stock Exchange - Automated Conflict Resolution Platform</p>
    <ReasonRankTemplate />
  </div>
);

const BeliefDetails = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Belief Details</h1>
    <p>Detailed view of a belief (coming soon)</p>
  </div>
);

const ArgumentRank = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Argument Ranking</h1>
    <p>Argument ranking system (coming soon)</p>
  </div>
);

const Profile = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Profile</h1>
    <p>User profile (coming soon)</p>
  </div>
);

const NotFound = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">404 - Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
  </div>
);

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="bg-white dark:bg-gray-800 shadow-lg mb-8">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Idea Stock Exchange</h1>
        </div>
      </nav>
      <div className="container mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/belief/:id" element={<BeliefDetails />} />
          <Route path="/rank" element={<ArgumentRank />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
