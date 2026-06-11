import React, { useState } from 'react';
import StakeholderDirectory from './components/StakeholderDirectory';
import StakeholderProfile   from './components/StakeholderProfile';
import ConflictPage         from './components/ConflictPage';

/**
 * App — simple client-side router using state.
 * Routes:
 *   home       → StakeholderDirectory
 *   stakeholder → StakeholderProfile (+ id)
 *   conflict    → ConflictPage        (+ id)
 */
export default function App() {
  const [route, setRoute] = useState({ page: 'home', id: null });

  const navigate = (page, id = null) => setRoute({ page, id });

  return (
    <div className="ise-app">
      <Header navigate={navigate} />
      <main className="ise-main">
        {route.page === 'home'        && <StakeholderDirectory navigate={navigate} />}
        {route.page === 'stakeholder' && <StakeholderProfile id={route.id} navigate={navigate} />}
        {route.page === 'conflict'    && <ConflictPage id={route.id} navigate={navigate} />}
      </main>
      <footer className="ise-footer">
        <p>
          <a href="https://github.com/myklob/ideastockexchange" target="_blank" rel="noreferrer">GitHub</a>
          {' · '}
          <span>ISE Stakeholder Analysis Platform v1.0</span>
          {' · '}
          <span>Scores update as evidence is added. <a href="#contribute">Contribute</a></span>
        </p>
      </footer>
    </div>
  );
}

function Header({ navigate }) {
  return (
    <header className="ise-header">
      <div className="ise-header-inner">
        <h1 className="ise-logo" onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>
          <span className="ise-logo-icon">⚖️</span> Idea Stock Exchange
          <span className="ise-logo-sub">Stakeholder Analysis Platform</span>
        </h1>
        <nav className="ise-nav">
          <button onClick={() => navigate('home')} className="ise-nav-btn">Stakeholder Directory</button>
          <button onClick={() => navigate('conflict', 'CFL-001')} className="ise-nav-btn ise-nav-btn--primary">Iran Policy Analysis</button>
        </nav>
      </div>
      <div className="ise-breadcrumb">
        <a href="/" onClick={e => { e.preventDefault(); navigate('home'); }}>Home</a>
        {' › '}
        <a href="/topics">Topics</a>
        {' › '}
        <strong>Foreign Policy &amp; National Security › Middle East › Iran</strong>
      </div>
    </header>
  );
}
