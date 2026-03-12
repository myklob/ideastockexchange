import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import TopicPage from './components/TopicPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topics/:topicId" element={<TopicPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
