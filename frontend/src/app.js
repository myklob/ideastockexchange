import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext"; // Theme and Global Context
import Layout from "@/components/Layout"; // Navbar, Sidebar, Footer
import Home from "@/pages/Home"; // Dashboard showing trending beliefs
import BeliefDetails from "@/pages/BeliefDetails"; // Detailed view of a belief
import ArgumentRank from "@/pages/ArgumentRank"; // Argument ranking system
import Profile from "@/pages/Profile"; // User profiles
import NotFound from "@/pages/NotFound"; // 404 Page
import "@/styles/global.css"; // Tailwind & Global Styles

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/belief/:id" element={<BeliefDetails />} />
            <Route path="/rank" element={<ArgumentRank />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;
