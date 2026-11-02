// frontend/src/components/ProfileExplorer.jsx
import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Briefcase, MapPin, GraduationCap, Database, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProfiles, indexProfiles } from '../services/api';

export default function ProfileExplorer() {
  const [data, setData] = useState({ profiles: [], total: 0, totalPages: 1, facets: {} });
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexMessage, setIndexMessage] = useState(null);

  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('');
  const [page, setPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getProfiles({ search, sector, location, education, page, limit: 12 });
      setData(res);
    } catch (err) {
      console.warn('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, sector, location, education]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleIndexPinecone = async () => {
    if (!confirm('Sync all 95 candidate profiles into Pinecone Vector Database?')) return;
    try {
      setIndexing(true);
      setIndexMessage(null);
      const res = await indexProfiles();
      setIndexMessage(`Success! Indexed ${res.count} profiles into Pinecone index '${res.indexName}'`);
    } catch (err) {
      setIndexMessage(`Indexing notice: ${err.message}`);
    } finally {
      setIndexing(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title">
              <Users size={18} color="var(--primary)" />
              Candidate & Internship Directory ({data.total} Profiles)
            </div>
            <p className="card-desc" style={{ marginBottom: 12 }}>
              Browse the indexed repository of student candidates, skillsets, and educational backgrounds.
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={handleIndexPinecone}
            disabled={indexing}
            style={{ fontSize: 12 }}
            title="Index records into Pinecone"
          >
            <Database size={14} className={indexing ? 'spinner' : ''} />
            <span>{indexing ? 'Syncing to Pinecone...' : 'Sync to Pinecone'}</span>
          </button>
        </div>

        {indexMessage && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            {indexMessage}
          </div>
        )}

        {/* Filter Controls */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-box" style={{ flex: '1 1 240px', padding: '4px 12px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by title, skill, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={sector}
            onChange={(e) => { setSector(e.target.value); setPage(1); }}
          >
            <option value="">All Sectors</option>
            {data.facets?.sectors?.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={location}
            onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          >
            <option value="">All Locations</option>
            {data.facets?.locations?.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={education}
            onChange={(e) => { setEducation(e.target.value); setPage(1); }}
          >
            <option value="">All Education</option>
            {data.facets?.educations?.map(ed => (
              <option key={ed} value={ed}>{ed.toUpperCase()}</option>
            ))}
          </select>

          <button type="submit" className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
            Apply
          </button>
        </form>
      </div>

      {/* Directory Grid */}
      <div className="card">
        {loading ? (
          <div className="empty-state">
            <span className="spinner" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'var(--primary)' }} />
            <div style={{ marginTop: 8 }}>Loading profiles...</div>
          </div>
        ) : data.profiles && data.profiles.length > 0 ? (
          <>
            <div className="matches-grid" style={{ marginTop: 0 }}>
              {data.profiles.map((p) => (
                <div key={p.id} className="match-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h4 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.title}
                      </h4>
                      <span className="badge badge-primary">
                        ID #{p.id}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={13} color="var(--text-muted)" />
                        <span>Role: <strong style={{ textTransform: 'capitalize' }}>{p.jobSector}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} color="var(--text-muted)" />
                        <span>Location: <strong style={{ textTransform: 'capitalize' }}>{p.location}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <GraduationCap size={13} color="var(--text-muted)" />
                        <span>Education: <strong style={{ textTransform: 'uppercase' }}>{p.education}</strong></span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
                        Skills:
                      </div>
                      <div>
                        {p.skills?.map((s) => (
                          <span key={s} className="skill-tag">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '3px 9px', fontSize: 11.5 }}
                      onClick={() => alert(`Candidate details for ID #${p.id}: ${p.title} (${p.location})`)}
                    >
                      Connect Candidate
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px' }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Page <strong>{page}</strong> of <strong>{data.totalPages}</strong>
                </span>
                <button
                  className="btn-secondary"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  style={{ padding: '6px 12px' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            No profiles match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}

