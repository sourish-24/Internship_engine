// frontend/src/App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import ResumeClassifier from './components/ResumeClassifier';
import OpportunityMatcher from './components/OpportunityMatcher';
import ProfileExplorer from './components/ProfileExplorer';
import { FileText, Search, Users } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('classifier');

  return (
    <div className="app-container">
      <Header />

      {/* Modern Minimal Navigation Bar */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'classifier' ? 'active' : ''}`}
          onClick={() => setActiveTab('classifier')}
        >
          <FileText size={16} />
          <span>Resume Classifier & Matcher</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={16} />
          <span>Opportunity Search</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Users size={16} />
          <span>Profiles Directory</span>
        </button>
      </nav>

      {/* Main Tab Content */}
      <main>
        {activeTab === 'classifier' && <ResumeClassifier />}
        {activeTab === 'search' && <OpportunityMatcher />}
        {activeTab === 'directory' && <ProfileExplorer />}
      </main>
    </div>
  );
}
