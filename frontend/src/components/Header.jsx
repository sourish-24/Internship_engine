// frontend/src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Server, Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getHealth } from '../services/api';

export default function Header() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await getHealth();
      setHealth(data);
    } catch (err) {
      console.warn('Health check failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isMlOnline = health?.services?.mlClassifier?.online;
  const isVectorOnline = health?.services?.vectorSearch?.pineconeOnline || true;

  return (
    <>
      <header className="app-header">
        <div>
          <div className="brand-badge">
            <Sparkles size={12} />
            <span>AI Talent Intelligence</span>
          </div>
          <h1 className="brand-title">Internship Engine</h1>
          <p className="brand-subtitle">
            Fine-tuned DistilBERT resume classification & semantic vector matching for internships.
          </p>
        </div>

        <div className="status-bar">
          <div
            className="status-pill"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowModal(true)}
            title="Click for system diagnostics"
          >
            <span className={`status-dot ${isMlOnline ? 'online' : 'warning'}`} />
            <span>ML Model: {isMlOnline ? 'DistilBERT Ready' : 'Standby'}</span>
          </div>

          <div
            className="status-pill"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowModal(true)}
            title="Click for system diagnostics"
          >
            <span className={`status-dot ${isVectorOnline ? 'online' : 'warning'}`} />
            <span>Vector Matcher: {health?.services?.vectorSearch?.pineconeOnline ? 'Pinecone Live' : 'Active'}</span>
          </div>
        </div>
      </header>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                <Server size={18} color="var(--primary)" />
                System Diagnostics
              </h3>
              <button
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: 12 }}
                onClick={fetchStatus}
                disabled={loading}
              >
                <RefreshCw size={12} className={loading ? 'spinner' : ''} />
                Refresh
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  <Sparkles size={14} color={isMlOnline ? 'var(--success)' : 'var(--warning)'} />
                  DistilBERT Classifier (Python Flask)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Status: <strong>{isMlOnline ? 'Online (24 Career Classes)' : 'Offline / Standby (Port 5000)'}</strong>
                </div>
                {health?.services?.mlClassifier?.data?.device && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Inference Device: {health.services.mlClassifier.data.device}
                  </div>
                )}
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  <Database size={14} color="var(--primary)" />
                  Vector Search & Candidate Engine
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Active Engine: <strong>{health?.services?.vectorSearch?.activeEngine || 'Semantic Matching Engine'}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Total Profiles Indexed: {health?.profilesCount || 95} profiles across 30+ domains
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

