# Internship Engine 🚀

An AI-powered talent intelligence and internship matching platform that brings together deep learning resume classification and semantic vector search.

---

## 🌟 Key Features

1. **Resume Domain Classifier (Fine-Tuned DistilBERT)**
   - Upload any resume (`.pdf` or `.txt`) or paste raw candidate text.
   - Accurately classifies candidate experience into 24 distinct career domains (IT, Data Science, HR, Finance, Engineering, etc.) with confidence scores and skill extraction.
   - Built with PyTorch and Hugging Face Transformers, reaching ~79% accuracy.

2. **Semantic Opportunity Matcher (Pinecone + Gemini Embeddings)**
   - Translates natural language queries and resume profiles into vector embeddings using Google Gemini (`text-embedding-004`).
   - Retrieves the highest-relevance candidate profiles and internship listings using cosine vector similarity.
   - Features a zero-downtime resilient local semantic matching fallback if external API keys are unavailable.

3. **Minimalist Modern Frontend**
   - Clean, lightweight React SPA (Vite) styled with a Scandinavian / Linear aesthetic.
   - One-click workflow: Upload resume ➔ predict professional sector ➔ discover matching internship opportunities immediately.
   - Searchable, filterable candidate directory of 95+ student and internship profiles.

---

## 📁 Repository Structure

```text
Internship Engine/
├── backend/                       # Unified Express API Server
│   ├── cli/                       # Terminal CLI tools
│   │   ├── indexCli.js            # Pinecone indexing script
│   │   └── queryCli.js            # Interactive vector search CLI
│   ├── data/
│   │   └── profiles.js            # 95 curated student / internship profiles
│   ├── services/
│   │   ├── mlClient.js            # Python Flask ML communication & skill extraction
│   │   └── vectorService.js       # Pinecone + Gemini vector search & resilient fallback
│   └── server.js                  # Main Express backend (Port 3001)
│
├── ml/                            # Machine Learning Engine (Python)
│   ├── app.py                     # Flask REST server for DistilBERT inference (Port 5000)
│   ├── main.ipynb                 # End-to-end model training, evaluation & comparison notebook
│   ├── requirements.txt           # Python dependencies
│   ├── resume_bert_finetuned/     # Fine-tuned DistilBERT weights & tokenizer
│   └── resume-dataset/            # Kaggle resume dataset
│
├── frontend/                      # Minimalist Modern React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx         # Status indicator & system diagnostics
│   │   │   ├── ResumeClassifier.jsx # Drag-and-drop resume upload & instant match
│   │   │   ├── OpportunityMatcher.jsx # Semantic search with filters & chips
│   │   │   └── ProfileExplorer.jsx # 95-profile searchable directory
│   │   ├── services/api.js        # Native fetch API client
│   │   ├── App.jsx                # Layout & navigation
│   │   └── index.css              # Custom minimalist design system
│   └── vite.config.js             # Vite config with API proxy
│
├── index.js                       # CLI alias for indexCli.js
├── query.js                       # CLI alias for queryCli.js
├── start-dev.js                   # Unified all-in-one development launcher
├── package.json                   # Root package scripts
└── .env                           # Environment configuration
```

---

## ⚡ Quick Start

### 1. Configure Environment Variables
Verify your `.env` in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=internship
```

### 2. Launch Full Stack (All Services in 1 Command)
```bash
npm run dev
```
This simultaneously starts:
- **Python ML Flask API**: `http://localhost:5000`
- **Express Backend API**: `http://localhost:3001`
- **React Frontend**: `http://localhost:5173`

---

## 🛠️ Individual Service Commands

If you prefer running services in separate terminal windows:

| Command | Description | Port |
| :--- | :--- | :--- |
| `npm run start:ml` | Starts the Python DistilBERT Flask inference engine | `5000` |
| `npm run start:backend` | Starts the Express REST API backend | `3001` |
| `npm run start:frontend` | Starts Vite React frontend development server | `5173` |
| `npm run cli:query` | Runs the interactive vector search in terminal | CLI |
| `npm run cli:index` | Indexes all 95 student profiles into Pinecone | CLI |

---

## 🔌 API Endpoints

- `GET  /api/health` — System status for ML service, Vector DB, and profile database.
- `POST /api/classify` — Classifies a resume (`.pdf`, `.txt`, or `{ "text": "..." }`).
- `POST /api/match` — Vector search for opportunities (`{ "query": "React Bangalore" }`).
- `POST /api/match-from-resume` — Combined endpoint: classifies resume + returns top vector matches.
- `GET  /api/profiles` — Paginated directory of student profiles with facet filters.
- `POST /api/profiles/index` — Triggers Pinecone indexing.

