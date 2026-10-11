# Idea Stock Exchange Wiki

Welcome to the comprehensive documentation for the **Idea Stock Exchange (ISE)** - an open-source platform that treats every belief, argument, and piece of evidence as a trackable object with its own truth score.

---

## Quick Navigation

### Getting Started
- [Installation Guide](Installation-Guide) - Set up your development environment
- [Project Architecture](Architecture-Overview) - Understand the system design
- [Core Concepts](Core-Concepts) - Learn about beliefs, arguments, and evidence

### Data Models
- [Belief Model](Data-Models#belief) - Claims about reality with conclusion scores
- [Argument Model](Data-Models#argument) - Supporting and opposing reasoning
- [Evidence Model](Data-Models#evidence) - Sources that back up arguments
- [User Model](Data-Models#user) - Participants with reputation tracking

### Scoring System
- [Conclusion Score](Scoring-System#conclusion-score) - How belief strength is calculated
- [Score Components](Scoring-System#score-components) - The 6 dimensions of argument quality
- [ReasonRank Algorithm](Algorithms#reasonrank) - PageRank-inspired argument ranking

### Algorithms
- [ArgumentRank](Algorithms#argumentrank) - Evaluate argument credibility through linkages
- [Fallacy Detection](Algorithms#fallacy-detection) - Automatically detect 10 types of logical fallacies
- [Redundancy Detection](Algorithms#redundancy-detection) - Identify duplicate arguments using 4 similarity metrics
- [Evidence Verification](Algorithms#evidence-verification) - Crowdsourced credibility scoring

### API Reference
- [Authentication](API-Reference#authentication) - Register, login, JWT tokens
- [Beliefs API](API-Reference#beliefs) - CRUD operations for beliefs
- [Arguments API](API-Reference#arguments) - Create arguments and vote
- [Evidence API](API-Reference#evidence) - Submit and verify evidence
- [Analysis API](API-Reference#analysis) - Fallacy and redundancy analysis

### Frontend
- [React Components](Frontend-Components) - UI component library
- [Page Structure](Frontend-Components#pages) - Main application views
- [State Management](Frontend-Components#state-management) - Authentication context

---

## Implementation Status

### Fully Implemented

| Feature | Description | Backend | Frontend |
|---------|-------------|---------|----------|
| User Authentication | Register, login, JWT tokens | `backend/routes/auth.js` | `LoginForm.js`, `RegisterForm.js` |
| Belief CRUD | Create, read, update, delete beliefs | `backend/controllers/beliefController.js` | `BeliefsList.jsx`, `BeliefForm.js` |
| Argument System | Supporting/opposing arguments with scores | `backend/controllers/argumentController.js` | `ArgumentCard.jsx`, `AddArgument.jsx` |
| Voting System | Upvote/downvote with tracking | `voteArgument()` in controller | Optimistic UI updates |
| Score Breakdown | 6-component scoring visualization | Model methods | `ScoreBreakdown.jsx` |
| Fallacy Detection | 10 types of logical fallacies | `backend/utils/fallacyDetector.js` | API integration pending |
| Redundancy Detection | 4 similarity algorithms | `backend/utils/redundancyDetector.js` | API integration pending |
| Evidence Submission | 8 types with metadata | `backend/models/Evidence.js` | `EvidenceForm.jsx` |
| Related Beliefs | Linkage with relationship types | `Belief.relatedBeliefs` | Sidebar display |

### Coming Soon

- Sub-argument UI creation
- Full evidence display in arguments
- Advanced analysis dashboards
- Belief editing interface
- CBO (Chief Belief Officer) system
- Media integration

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + Vite + Tailwind CSS + React Router v6          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ BeliefsList│ │BeliefDetails│ │AddArgument│ │ AuthForms │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                           ↓                                  │
│                    API Service Layer                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────┴───────────────────────────────────┐
│                        BACKEND                               │
│              Node.js + Express.js + JWT                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Beliefs │  │ Arguments│  │ Analysis │   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                           ↓                                  │
│                    Controllers & Utils                       │
│              (Scoring, Fallacy Detection, etc.)             │
└─────────────────────────┬───────────────────────────────────┘
                          │ Mongoose ODM
┌─────────────────────────┴───────────────────────────────────┐
│                       DATABASE                               │
│                      MongoDB 5+                              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   User   │  │  Belief  │  │ Argument │  │ Evidence │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Philosophy

The Idea Stock Exchange is built on these principles:

1. **Transparency** - Every score calculation is visible and auditable
2. **Evidence-Based** - Arguments are weighted by quality of supporting evidence
3. **Logic-First** - Automatic detection of logical fallacies penalizes poor reasoning
4. **Anti-Redundancy** - Similar arguments are grouped to maintain debate clarity
5. **Crowdsourced Verification** - Multiple users can verify or dispute evidence

---

## Key Formulas

### Conclusion Score (CS)
```
CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)
```

Where:
- **RtA** - Reasons to Agree (strength of supporting arguments)
- **RtD** - Reasons to Disagree (strength of opposing arguments)
- **ES** - Evidence Strength (0-1)
- **LC** - Logical Coherence (0-1, reduced by fallacies)
- **VC** - Verification Credibility (0-1)
- **LR** - Linkage Relevance (0-1)
- **UD** - Uniqueness/Distinctiveness (0-1)
- **AI** - Argument Importance (0-1)

### Evidence Credibility
```
Credibility = 50 + (verifiedCount × 10) - (disputedCount × 10)
```

Bounded between 0 and 100.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, Vite, Tailwind CSS | Modern, responsive UI |
| Routing | React Router v6 | Client-side navigation |
| Icons | Lucide React | Consistent iconography |
| Backend | Node.js, Express.js | REST API server |
| Database | MongoDB, Mongoose | Document storage |
| Auth | JWT, bcrypt | Secure authentication |
| Algorithms | Custom JavaScript | Scoring and analysis |

---

## Contributing

We welcome contributions! See our [Contributing Guide](Contributing) for:
- Code style guidelines
- Pull request process
- Issue reporting
- Feature requests

---

## Contact

- **GitHub**: [@myklob](https://github.com/myklob)
- **Repository**: [ideastockexchange](https://github.com/myklob/ideastockexchange)
- **Twitter**: [@myclob](https://twitter.com/myclob)

---

**Built with passion for evidence-based reasoning and transparent discourse.**
