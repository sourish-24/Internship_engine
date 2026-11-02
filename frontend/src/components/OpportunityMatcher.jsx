// frontend/src/components/OpportunityMatcher.jsx
import React, { useState } from 'react';
import { Search, Filter, Briefcase, MapPin, GraduationCap, Zap, Sparkles } from 'lucide-react';
import { matchOpportunities } from '../services/api';

const QUICK_SEARCHES = [
  "React & Node.js Developer Bangalore",
  "Python Machine Learning Researcher Delhi",
  "DevOps & Kubernetes Pune",
  "Data Analyst with SQL & Tableau Gurgaon",
  "UI/UX Designer Figma",
  "Cybersecurity Analyst Linux"
];

export default function OpportunityMatcher() {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (overrideQuery) => {
    const activeQuery = overrideQuery !== undefined ? overrideQuery : query;
    if (!activeQuery.trim() && !sector && !location && !education) {
      setError('Please enter a query or select a filter.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await matchOpportunities({
        query: activeQuery,
        sector,
        location,
        education,
        topK: 8
      });
      setResults(res);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (q) => {
    setQuery(q);
    handleSearch(q);
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <Search size={18} color="var(--primary)" />
          Semantic Internship & Candidate Search
        </div>
        <p className="card-desc">
          Describe the ideal candidate skills, position, or internship parameters in plain English.
        </p>

        {/* Search Bar */}
        <div className="search-input-box">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="e.g. 'Looking for a Python developer with FastAPI and PostgreSQL in Delhi'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Search'}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Popular queries:</span>
          {QUICK_SEARCHES.map((q) => (
            <button
              key={q}
              type="button"
              className="badge"
              style={{ cursor: 'pointer', border: '1px solid var(--border-color)', background: 'white' }}
              onClick={() => handleChipClick(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Filter size={13} />
            <span>Optional Filters:</span>
          </div>

          <select
            className="filter-select"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="">All Sectors</option>
            <option value="ai dev">AI / ML Dev</option>
            <option value="backend dev">Backend Dev</option>
            <option value="fullstack dev">Fullstack Dev</option>
            <option value="frontend dev">Frontend Dev</option>
            <option value="data scientist">Data Science</option>
            <option value="cloud architect">Cloud & DevOps</option>
            <option value="ui/ux designer">UI/UX Design</option>
            <option value="cybersecurity">Cybersecurity</option>
          </select>

          <select
            className="filter-select"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            <option value="bangalore">Bangalore</option>
            <option value="delhi">Delhi</option>
            <option value="mumbai">Mumbai</option>
            <option value="pune">Pune</option>
            <option value="hyderabad">Hyderabad</option>
            <option value="chennai">Chennai</option>
            <option value="gurgaon">Gurgaon</option>
            <option value="noida">Noida</option>
          </select>

          <select
            className="filter-select"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
          >
            <option value="">All Education</option>
            <option value="btech">B.Tech</option>
            <option value="mtech">M.Tech</option>
            <option value="phd">PhD</option>
            <option value="mba">MBA</option>
            <option value="diploma">Diploma</option>
            <option value="self-taught">Self-Taught</option>
          </select>

          {(sector || location || education) && (
            <button
              className="btn-secondary"
              style={{ padding: '4px 8px', fontSize: 12 }}
              onClick={() => { setSector(''); setLocation(''); setEducation(''); }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>

      {/* Results View */}
      {results && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              Matched Opportunities ({results.matches?.length || 0})
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Source: <strong style={{ color: 'var(--text-secondary)' }}>{results.source === 'pinecone' ? 'Pinecone Vector DB' : 'Semantic Engine'}</strong>
            </span>
          </div>

          {results.matches && results.matches.length > 0 ? (
            <div className="matches-grid">
              {results.matches.map(({ profile, score, matchedSkills }) => (
                <div key={profile.id} className="match-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)' }}>
                        {profile.title}
                      </h4>
                      <span className="match-score-pill">
                        {Math.round(score * 100)}% Match
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={13} color="var(--text-muted)" />
                        <span>Role: <strong style={{ textTransform: 'capitalize' }}>{profile.jobSector}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} color="var(--text-muted)" />
                        <span>Location: <strong style={{ textTransform: 'capitalize' }}>{profile.location}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <GraduationCap size={13} color="var(--text-muted)" />
                        <span>Education: <strong style={{ textTransform: 'uppercase' }}>{profile.education}</strong></span>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
                        Skills:
                      </div>
                      <div>
                        {profile.skills?.map((s) => (
                          <span
                            key={s}
                            className={`skill-tag ${matchedSkills?.includes(s) ? 'highlight' : ''}`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: #{profile.id}</span>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => alert(`Selected profile #${profile.id}: ${profile.title}`)}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No matching profiles found for this query. Try broader keywords or clearing filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

