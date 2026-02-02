# ISE Documentation

> **Complete documentation for the Idea Stock Exchange belief organization system**

## Quick Links

| Document | Purpose | Audience |
|----------|---------|----------|
| [📖 How It Works](./HOW_IT_WORKS.md) | User-friendly explanation of the system | General public, new users |
| [🏗️ Architecture](./ARCHITECTURE.md) | System design and technical overview | Developers, architects |
| [🧬 Belief Organization System](./BELIEF_ORGANIZATION_SYSTEM.md) | Complete specification of 7 core principles | Product managers, developers |
| [🔗 Integration Guide](./INTEGRATION_GUIDE.md) | Code examples and integration patterns | Developers implementing features |
| [📄 One Page Per Belief](./ONE_PAGE_PER_BELIEF.md) | Deduplication and semantic clustering | Developers, researchers |
| [📊 Export Quickstart](./EXPORT_QUICKSTART.md) | Excel and MS Access export system | Data analysts, users |
| [🤖 Automated Belief Generation](./AUTOMATED_BELIEF_GENERATION.md) | Wikipedia-based belief creation | Content creators, developers |
| [⚡ Developer Quick Start](./DEVELOPER_QUICK_START.md) | Get up and running quickly | New developers |

## Documentation Map

```
┌─────────────────────────────────────────────────────────────┐
│                    For General Public                        │
├─────────────────────────────────────────────────────────────┤
│  📖 HOW_IT_WORKS.md                                         │
│     - What is the ISE?                                      │
│     - Seven core principles explained                        │
│     - Why it matters                                         │
│     - Get involved                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    For Product/Planning                      │
├─────────────────────────────────────────────────────────────┤
│  🧬 BELIEF_ORGANIZATION_SYSTEM.md                           │
│     - Complete technical specification                       │
│     - Data models and API endpoints                          │
│     - Implementation roadmap                                 │
│     - Status tracking                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    For Developers                            │
├─────────────────────────────────────────────────────────────┤
│  🏗️ ARCHITECTURE.md                                         │
│     - Full feature architecture                              │
│     - Database schemas                                       │
│     - Algorithm details                                      │
│     - Roadmap and phases                                     │
│                                                              │
│  🔗 INTEGRATION_GUIDE.md                                     │
│     - Step-by-step integration                               │
│     - Code examples (backend + frontend)                     │
│     - Common patterns                                        │
│     - Performance tips                                       │
│                                                              │
│  📄 ONE_PAGE_PER_BELIEF.md                                   │
│     - Semantic clustering details                            │
│     - Duplicate detection algorithms                         │
│     - Similar belief matching                                │
│     - 3D belief space                                        │
│                                                              │
│  ⚡ DEVELOPER_QUICK_START.md                                 │
│     - Installation                                           │
│     - Running locally                                        │
│     - First contributions                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    For Specific Features                     │
├─────────────────────────────────────────────────────────────┤
│  📊 EXPORT_QUICKSTART.md                                     │
│     - Excel export system                                    │
│     - MS Access export system                                │
│     - API usage                                              │
│                                                              │
│  🤖 AUTOMATED_BELIEF_GENERATION.md                           │
│     - Wikipedia integration                                  │
│     - Topic classification                                   │
│     - Batch processing                                       │
└─────────────────────────────────────────────────────────────┘
```

## The Seven Core Principles

The ISE belief organization system is built on seven interconnected principles:

### 1. 📚 Multi-Taxonomy Topic Classification
Every belief is classified across multiple taxonomy systems (Dewey, LoC, Wikipedia, etc.) creating a "Topic Signature" (Belief DNA).

**Read more:** [BELIEF_ORGANIZATION_SYSTEM.md](./BELIEF_ORGANIZATION_SYSTEM.md#1-sorting-beliefs-and-arguments-by-topic)

### 2. 🎯 Topic Pages as Control Panels
Each topic has a dedicated page showing all beliefs organized by sentiment (positive → neutral → negative) and sorted by strength.

**Read more:** [HOW_IT_WORKS.md](./HOW_IT_WORKS.md#2--topic-pages-as-control-panels)

### 3. 📄 One Page Per Belief
Synonymous statements are merged into a single belief page using semantic clustering (similarity scores).

**Read more:** [ONE_PAGE_PER_BELIEF.md](./ONE_PAGE_PER_BELIEF.md)

### 4. 💪 Strength Scoring
Measures claim intensity (0-100) based on linguistic patterns (intensifiers, hedges, superlatives, absolutes).

**Read more:** [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md#3-strength-scoring-integration)

### 5. 😊😐😠 Positivity/Negativity Scoring
Measures sentiment toward the subject (-100 to +100) enabling organization by valence.

**Read more:** [BELIEF_ORGANIZATION_SYSTEM.md](./BELIEF_ORGANIZATION_SYSTEM.md#5-positivity--negativity-score)

### 6. 🔗 Comprehensive Linkage
Connects beliefs to arguments, evidence, laws, people, media, values, interests, solutions, and biases.

**Read more:** [BELIEF_ORGANIZATION_SYSTEM.md](./BELIEF_ORGANIZATION_SYSTEM.md#6-linking-evidence-data-books-people-and-arguments)

### 7. 🔄 Automatic Updates
Conclusion scores update automatically as new evidence and arguments are added using ReasonRank algorithm.

**Read more:** [ARCHITECTURE.md](./ARCHITECTURE.md#31-truth-score)

## System Components

### Backend Models

| Model | Purpose | File | Docs |
|-------|---------|------|------|
| Belief | Core belief storage with dimensions | `backend/models/Belief.js` | [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md#1-belief-creation-flow) |
| Topic | Topic pages with statistics | `backend/models/Topic.js` | [ARCHITECTURE.md](./ARCHITECTURE.md#community-model) |
| Argument | Pro/con arguments with scores | `backend/models/Argument.js` | [ARCHITECTURE.md](./ARCHITECTURE.md#argument-model) |
| Evidence | Citations and sources | `backend/models/Evidence.js` | [ARCHITECTURE.md](./ARCHITECTURE.md#evidence-model) |

### Backend Services

| Service | Purpose | File | Docs |
|---------|---------|------|------|
| TaxonomyService | Multi-taxonomy classification | `backend/services/taxonomyService.js` | [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md#step-3-topic-classification-taxonomy-service) |
| StrengthScoringService | Claim intensity measurement | `backend/services/strengthScoringService.js` | [BELIEF_ORGANIZATION_SYSTEM.md](./BELIEF_ORGANIZATION_SYSTEM.md#4-strength-score-how-bold-is-the-claim) |
| BeliefGenerator | Automated Wikipedia-based creation | `backend/services/beliefGenerator.js` | [AUTOMATED_BELIEF_GENERATION.md](./AUTOMATED_BELIEF_GENERATION.md) |

### Algorithms

| Algorithm | Purpose | Location | Docs |
|-----------|---------|----------|------|
| ReasonRank | PageRank for arguments | `backend/server.js` | [ARCHITECTURE.md](./ARCHITECTURE.md#1-reasonrank--argumentrank) |
| Semantic Clustering | Duplicate detection | `backend/utils/semanticClustering.js` | [ONE_PAGE_PER_BELIEF.md](./ONE_PAGE_PER_BELIEF.md#3-semantic-clustering) |
| Fallacy Detection | Logical fallacy identification | `backend/utils/fallacyDetection.js` | [ARCHITECTURE.md](./ARCHITECTURE.md#2-logical-fallacy-detection) |
| Redundancy Detection | Duplicate argument identification | `backend/utils/redundancyDetection.js` | [ARCHITECTURE.md](./ARCHITECTURE.md#3-redundancy-detection) |

## Getting Started

### For Users
1. Read [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) to understand the system
2. Visit the platform (coming soon)
3. Create your first belief
4. Add arguments and evidence
5. Explore topic pages

### For Developers
1. Read [DEVELOPER_QUICK_START.md](./DEVELOPER_QUICK_START.md)
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Follow [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for implementation
4. Check [ISSUES.md](./ISSUES.md) for known issues
5. Start contributing!

### For Researchers
1. Understand the system via [BELIEF_ORGANIZATION_SYSTEM.md](./BELIEF_ORGANIZATION_SYSTEM.md)
2. Review algorithms in [ARCHITECTURE.md](./ARCHITECTURE.md#3-scoring-algorithms)
3. Use the API for data analysis
4. Contribute to algorithm improvements

## Implementation Status

### ✅ Fully Implemented (Phase 1)
- Belief and Topic models with enhanced fields
- Semantic clustering for duplicate detection
- Dimensional scoring (specificity, sentiment, strength)
- ReasonRank / ArgumentRank algorithm
- Fallacy and redundancy detection
- Evidence verification system
- TaxonomyService and StrengthScoringService
- Topic page organization methods

### 🔄 In Progress (Phase 2)
- Enhanced frontend visualizations
- API endpoints for organized topic pages
- Batch classification tools
- Performance optimizations

### 📋 Planned (Phases 3-7)
- Real-time WebSocket updates
- 3D belief space visualization
- Media integration (Phase 4)
- CBO (Chief Belief Officer) system (Phase 3)
- AI-powered enhancements (Phase 5)
- Global expansion (Phase 7)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Development workflow
- Testing requirements

## License

This project is licensed under the MIT License - see [LICENSE](../LICENSE) for details.

## Contact

- **GitHub**: [@myklob](https://github.com/myklob)
- **Twitter**: [@myclob](https://twitter.com/myclob)
- **Blog**: [myclob.blogspot.com](https://myclob.blogspot.com/)
- **Issues**: [GitHub Issues](https://github.com/myklob/ideastockexchange/issues)

---

**Built with ❤️ by the ISE community**

*Last updated: 2025-01-28*
