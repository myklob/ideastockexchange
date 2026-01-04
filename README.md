# Idea Stock Exchange - Objective Criteria System

A platform for systematic evaluation of ideas through objective criteria and evidence-based argumentation.

## Overview

The Idea Stock Exchange implements a structured approach to public discourse by:
- Establishing objective criteria before evaluating evidence
- Scoring criteria quality across four dimensions (Validity, Reliability, Independence, Linkage)
- Using argument-based evaluation to determine criteria scores
- Enabling transparent, measurable debates

## Features

### Objective Criteria System
- Propose and debate measurement standards for any topic
- Four-dimensional quality scoring (Validity, Reliability, Independence, Linkage)
- Argument-based scoring with transparent algorithms
- Community-driven evaluation

### Key Components
- **Validity**: Does this actually measure what we think it measures?
- **Reliability**: Can different people measure this consistently?
- **Independence**: Is the data source neutral?
- **Linkage**: How strongly does this correlate with the ultimate goal?

## Project Structure

```
├── backend/              # FastAPI backend
│   ├── models/          # Database models
│   ├── api/             # API endpoints
│   ├── services/        # Business logic
│   └── algorithms/      # Scoring algorithms
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── services/    # API client
│   │   └── types/       # TypeScript types
└── docs/                # Documentation
```

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Algorithms**: Custom ReasonRank implementation

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## API Documentation

Once running, visit:
- API docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Core Concepts

### Criteria Evaluation Flow

1. **Propose Criteria**: Users suggest objective measures for a topic
2. **Create Arguments**: Community provides pro/con arguments for each dimension
3. **Calculate Scores**: Algorithm weighs arguments by quality
4. **Apply to Evidence**: Claims measured by high-scoring criteria get higher confidence

### Scoring Algorithm

Criteria scores (0-100%) are calculated by:
1. Evaluating arguments for each dimension
2. Weighing by evidence quality and logical validity
3. Calculating weighted average across dimensions
4. Normalizing to 0-100 scale

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
