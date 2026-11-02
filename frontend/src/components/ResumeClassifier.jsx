// frontend/src/components/ResumeClassifier.jsx
import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Zap, Target, Briefcase, MapPin, GraduationCap, X } from 'lucide-react';
import { classifyResume, matchFromResume } from '../services/api';

const SAMPLE_RESUMES = {
  dev: `Alex Morgan - Full Stack Software Developer
Email: alex.morgan@example.com | Bangalore, India
Education: B.Tech in Computer Science

Technical Skills:
- Frontend: React, JavaScript, TypeScript, Next.js, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express, Python, REST APIs, GraphQL
- Databases: PostgreSQL, MongoDB, Redis
- Tools & Cloud: Git, Docker, AWS (S3, EC2), Postman

Experience & Projects:
- E-Commerce Web Platform: Built responsive React frontend with Redux store and Express microservices.
- Collaborative Document Editor: Real-time synchronization using WebSocket, Node.js, and Redis.`,
  ml: `Priya Sharma - Machine Learning & NLP Researcher
Email: priya.sharma@example.com | Delhi, India
Education: M.Tech in Artificial Intelligence

Technical Skills:
- Core: Python, PyTorch, TensorFlow, Hugging Face Transformers, Scikit-Learn
- NLP: BERT, DistilBERT, LLM fine-tuning, Tokenization, Sentence Embeddings, Prompt Engineering
- Tools: MLflow, Docker, Git, Linux, Pandas, NumPy

Experience:
- Resume Classification Engine: Fine-tuned DistilBERT sequence classification model reaching 79% accuracy.
- Semantic Vector Search: Embedded candidate records with Gemini and integrated Pinecone vector store.`
};

export default function ResumeClassifier() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState('match'); // 'classify' or 'match'
  const [classification, setClassification] = useState(null);
  const [matches, setMatches] = useState(null);
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setTextInput('');
      setError(null);
    }
  };

  const handleClearFile = () => {
    setFile(null);
  };

  const handleLoadSample = (key) => {
    setFile(null);
    setTextInput(SAMPLE_RESUMES[key]);
    setError(null);
  };

  const handleSubmit = async (type = 'match') => {
    if (!file && !textInput.trim()) {
      setError('Please choose a PDF/TXT resume or paste text.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setActionType(type);

      if (type === 'match') {
        const res = await matchFromResume({ file, text: textInput, topK: 3 });
        setClassification(res.classification);
        setDetectedSkills(res.detectedSkills || []);
        setMatches(res.matches?.matches || []);
      } else {
        const res = await classifyResume({ file, text: textInput, topK: 3 });
        setClassification(res);
        setDetectedSkills(res.detected_skills || []);
        setMatches(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Processing failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <UploadCloud size={18} color="var(--primary)" />
          Resume Domain Classification & Instant Matching
        </div>
        <p className="card-desc">
          Upload a candidate resume or paste text to predict professional sector with DistilBERT and find matching opportunities.
        </p>

        {/* Upload Zone */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div>
            <div className={`dropzone ${file ? 'drag-active' : ''}`}>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                disabled={loading}
              />
              <div className="dropzone-icon">
                <FileText size={32} />
              </div>
              <div className="dropzone-text">
                {file ? file.name : 'Drop PDF or TXT resume here'}
              </div>
              <div className="dropzone-subtext">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse from your device'}
              </div>
            </div>

            {file && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>File selected</span>
                <button
                  onClick={handleClearFile}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <X size={13} /> Remove
                </button>
              </div>
            )}
          </div>

          <div>
            <textarea
              className="textarea-input"
              rows={5}
              placeholder="Or paste resume contents or candidate bio here..."
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                if (file) setFile(null);
                setError(null);
              }}
              disabled={loading}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quick test:</span>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: 11 }}
                onClick={() => handleLoadSample('dev')}
              >
                Sample Full-Stack
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: 11 }}
                onClick={() => handleLoadSample('ml')}
              >
                Sample ML / NLP
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => handleSubmit('match')}
            disabled={loading}
          >
            {loading && actionType === 'match' ? (
              <>
                <span className="spinner" />
                <span>Classifying & Matching...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Classify & Find Matching Internships</span>
              </>
            )}
          </button>

          <button
            className="btn-secondary"
            onClick={() => handleSubmit('classify')}
            disabled={loading}
          >
            {loading && actionType === 'classify' ? (
              <>
                <span className="spinner" />
                <span>Classifying...</span>
              </>
            ) : (
              <>
                <Target size={15} />
                <span>Only Classify Domain</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {classification && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="card-title">
                <CheckCircle2 size={18} color="var(--success)" />
                Classification Results (DistilBERT Sequence Classifier)
              </div>
              <p className="card-desc" style={{ marginBottom: 12 }}>
                Predicted primary domain: <strong style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{classification.top_category || classification.predictions?.[0]?.label}</strong>
              </p>
            </div>

            {detectedSkills.length > 0 && (
              <div style={{ maxWidth: 450 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Detected Core Skills:
                </div>
                <div>
                  {detectedSkills.map((sk) => (
                    <span key={sk} className="skill-tag highlight">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="predictions-list">
            {classification.predictions?.map((pred) => {
              const pct = Math.round(pred.score * 100);
              return (
                <div key={pred.label} className="prediction-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', background: pred.rank === 1 ? 'var(--primary)' : '#cbd5e1',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700
                    }}>
                      {pred.rank}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
                      {pred.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', minWidth: 40, textAlign: 'right' }}>
                      {pct}%
                    </span>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matched Opportunities / Candidates */}
      {matches && matches.length > 0 && (
        <div className="card">
          <div className="card-title">
            <Target size={18} color="var(--primary)" />
            Top Matching Internship & Candidate Opportunities
          </div>
          <p className="card-desc">
            Retrieved via semantic vector search matching the candidate's skills and classified domain.
          </p>

          <div className="matches-grid">
            {matches.map(({ profile, score, matchedSkills }) => (
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
                      <span>Domain: <strong style={{ textTransform: 'capitalize' }}>{profile.jobSector}</strong></span>
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
                      Required / Active Skills:
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
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Profile #{profile.id}</span>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => alert(`Connecting with candidate/internship #${profile.id}: ${profile.title}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

