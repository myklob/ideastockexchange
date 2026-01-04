# Idea Stock Exchange

> **Building Infrastructure for Human Reasoning**

A platform for structured debate, algorithmic ranking, and collaborative intelligence to transform how we evaluate ideas and make decisions.

## 🌟 Overview

The Idea Stock Exchange (ISE) is a revolutionary platform that applies the time-tested pro/con methodology to internet-scale collaborative reasoning. Instead of scattering arguments across millions of web pages, ISE creates **one canonical location for each argument**, allowing humanity to systematically evaluate ideas and build cumulative knowledge.

### The Core Innovation

> "Allow everyone to 'talk' at once if we allow users to organize their contributions. Give one page per issue, then let users post comments within a column of reasons to agree OR within the reasons to disagree column."

This simple innovation of categorizing arguments into structured columns revolutionizes how we:
- **Debate** complex issues
- **Reach** informed conclusions
- **Think** systematically about problems
- **Build** on previous reasoning instead of starting from scratch

## 🎯 Key Features

### 1. **Structured Argumentation**
- **Pro/Con Columns**: Every conclusion has clear "Reasons to Agree" and "Reasons to Disagree"
- **Recursive Structure**: Arguments can themselves have supporting/opposing arguments
- **Argument Trees**: Visual representation of how evidence supports or opposes ideas

### 2. **Algorithmic Scoring**
- **ReasonRank**: PageRank-inspired algorithm for idea quality
- **Weighted Evidence**: Academic sources ranked higher than opinions
- **Linkage Scores**: Measures how well evidence actually supports claims
- **Recursive Scoring**: Sub-arguments contribute to parent argument scores

### 3. **Evidence-Based Reasoning**
- **Evidence Tiers**:
  - Peer-reviewed meta-analysis (weight: 1.0)
  - Peer-reviewed studies (weight: 0.9)
  - Expert consensus (weight: 0.85)
  - Verified data (weight: 0.8)
  - News reporting (weight: 0.6)
  - Expert opinion (weight: 0.7)
  - Anecdotal (weight: 0.3)
  - Personal opinion (weight: 0.2)

### 4. **Conflict Resolution Framework**
- Based on "Getting to Yes" principles
- **Interests** not positions: Understand underlying motivations
- **Objective criteria**: Debatable standards for resolution
- **Brainstorming**: Generate multiple solution options
- **Separation**: Judge ideas on merit, not who proposed them

### 5. **Collaborative Intelligence**
- **Community Voting**: Democratic evaluation of argument quality
- **Expert Weighting**: Specialists have more influence in their fields
- **Version Control**: Track how arguments evolve over time
- **Statistical Analysis**: Confidence intervals based on agreement/disagreement variance

## 🏗️ Architecture

### Database Structure

Like a family tree for arguments:

```
beliefs (conclusions & arguments)
   ↓
relationships (support/oppose connections)
   ↓
scores (calculated from recursive algorithm)
   ↓
evidence (supporting documentation)
   ↓
votes (community evaluation)
```

**Key Tables:**
- `beliefs` - All conclusions and arguments
- `relationships` - Which arguments support/oppose which conclusions
- `scores` - Calculated scores (-100 to +100)
- `evidence` - Books, studies, data sources
- `votes` - Community evaluations
- `users` - Platform participants
- `interests` - What people care about (for conflict resolution)

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express
- **Database**: SQLite (easily upgradable to PostgreSQL/MySQL)
- **Algorithms**: Custom scoring and ReasonRank implementations

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite3

### Installation

```bash
# Clone the repository
git clone https://github.com/myklob/ideastockexchange.git
cd ideastockexchange

# Install dependencies
npm install

# Initialize the database
# Database will be created automatically on first run

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### Access the Platform

Open your browser to:
```
http://localhost:3000
```

## 📊 How It Works

### The Basic Formula

**Simple Version:**
```
Score = (Reasons to Agree) - (Reasons to Disagree)
```

**Advanced Recursive Formula:**
```
Score = Σ[(A(n,i)/n) × L] − Σ[(D(n,j)/n) × L] / (Total Reasons)

Where:
- n = depth level (1, 2, 3...)
- A(n,i) = agreement reasons at depth n
- D(n,j) = disagreement reasons at depth n
- L = linkage score (how well argument supports conclusion)
```

### Example: WWII Decision

**Main Conclusion:** "The United States should have joined WWII"

**Reasons to Agree:**
1. Nazis were committing systematic genocide (+98 linkage)
2. Need to defend allied nations (+85 linkage)
3. Prevent Nazi territorial expansion (+88 linkage)

**Reasons to Disagree:**
1. Cost in American lives was too high (+75 linkage)
2. Economic burden on US economy (+60 linkage)

**Sub-arguments:**
- "Nazis were committing genocide" is itself supported by:
  - Historical evidence of Holocaust (+99)
  - Concentration camps documented (+99)

The algorithm recursively calculates scores, with each level contributing proportionally less.

## 🎓 Use Cases

### Political Decisions
"Should we raise the minimum wage?"
- Structured evaluation of economic impacts
- See strongest arguments on both sides
- Evidence-weighted conclusions

### Scientific Theories
"Is string theory correct?"
- Academic evidence systematically organized
- Quality of sources automatically weighted
- Cumulative knowledge building

### Personal Decisions
"Should I buy an electric car?"
- Community-contributed pros/cons
- Personalize weights based on your values
- See latest data without re-researching

### Conflict Resolution
"Israeli-Palestinian Conflict"
- Map shared vs. conflicting interests
- Objective criteria for resolution
- Opposing sides forced to acknowledge each other's points

## 📈 What Makes ISE Different

### vs. Chat Rooms
❌ Chat: Everything resets to ground zero each time
✅ ISE: Cumulative progress, builds on previous discussions

### vs. Thread Forums
❌ Forums: Chaos, anyone can change subject anytime
✅ ISE: Structured, arguments categorized into columns

### vs. News Media
❌ Media: Profit-driven narratives, "winners and losers"
✅ ISE: Direct communication, evidence-based evaluation

### vs. Social Media
❌ Social: Echo chambers, confirmation bias
✅ ISE: Must see both sides, opposing arguments visible

## 🧮 Algorithms

### ReasonRank
Inspired by Google's PageRank, but for ideas:
- Arguments that are supported by many strong arguments rank higher
- Recursive importance calculation
- Dampening factor prevents circular reasoning

### Linkage Scoring
Prevents irrelevant arguments:
- "Grass is green" has low linkage to "Legalize drugs"
- Community votes on relevance
- Weak linkages contribute less to final score

### Confidence Intervals
Based on:
- Number of reasons posted
- Variance in evaluations
- Quality distribution of evidence
- Expert vs. general population agreement

## 🤝 Contributing

We're building infrastructure for how humanity thinks. Contributions welcome!

### Areas for Contribution

1. **Content**: Add arguments to important issues
2. **Code**: Improve algorithms, UI/UX, features
3. **Research**: Academic validation of scoring methods
4. **Design**: Better visualizations of argument trees
5. **Documentation**: Tutorials, guides, examples

### Contribution Guidelines

```bash
# Fork the repository
# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Commit with clear messages
git commit -m "Add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a Pull Request
```

## 📚 Documentation

- [How the Idea Stock Exchange Works](index.html) - Comprehensive explanation
- [ISE Framework](docs/ISE-Framework.md) - Theoretical foundation
- [API Documentation](docs/API.md) - Backend API reference
- [Database Schema](schema.sql) - Complete data structure
- [Algorithm Details](docs/Algorithms.md) - Scoring and ranking math

## 🗺️ Roadmap

### Phase 1: Core Platform (Current)
- [x] Basic argument structure
- [x] Pro/Con columns
- [x] Scoring algorithm
- [x] Database schema
- [x] REST API
- [ ] User authentication
- [ ] Basic visualization

### Phase 2: Enhanced Features
- [ ] Advanced argument tree visualization
- [ ] Real-time collaboration
- [ ] Mobile responsive design
- [ ] Evidence verification system
- [ ] Expert credentialing

### Phase 3: Scale & Intelligence
- [ ] Machine learning for argument classification
- [ ] Natural language processing for duplicate detection
- [ ] Automated fact-checking integration
- [ ] Recommendation engine
- [ ] Cross-language support

### Phase 4: Integration & Impact
- [ ] Browser extensions
- [ ] Social media integration
- [ ] Educational partnerships
- [ ] Policy decision support tools
- [ ] Academic research collaboration

## 🌍 Vision for the Future

### The Ultimate Goal

> "If we aren't organized we can't disprove stupid argument once and for all. We have to disprove it every time that argument will ever be made. However if we create comprehensive list of all reasons to agree or disagree with conclusions, and we let people classify specific arguments, it creates situation where there is only ONE place for specific argument to live. When there's no duplication, we can finally organize information and kill bad information once and for all."

### What Success Looks Like

- **Usage**: Millions of people using platform for decision-making
- **Content**: Comprehensive mapping of humanity's arguments
- **Quality**: Evidence-based conclusions becoming the norm
- **Impact**: Better societal decisions through systematic evaluation

### Why This Matters

**We're Building Infrastructure for Human Reasoning**

- Google organized web pages
- Wikipedia organized facts
- **ISE organizes arguments** - the fundamental building blocks of decision-making

**Arguments Deserve Same Treatment as Scientific Knowledge**

- Science progresses because each generation builds on previous work
- Arguments should work the same way
- Stop starting from scratch
- Build cumulative reasoning

## 📖 Philosophical Foundation

### Core Principles

1. **One Page Per Topic**: No duplication, canonical location for each argument
2. **Evidence Over Opinion**: Quality matters as much as quantity
3. **Transparency**: See both sides, no hidden arguments
4. **Recursion**: Arguments all the way down to verifiable facts
5. **Collaboration**: Collective intelligence > individual reasoning

### Inspirations

**Ayn Rand:**
> "No concept man forms is valid unless he integrates it without contradiction into the total sum of his knowledge."

**Extended by Mike Laub:**
> "No concept you form is valid unless you integrate it without contradiction into the sum of **human** knowledge."

## 🐛 Known Issues

- Database initialization requires manual trigger on first run
- Scoring algorithm needs optimization for large argument trees (>1000 nodes)
- Mobile UI needs responsive improvements
- Search functionality is basic (no fuzzy matching yet)

## 📜 License

MIT License - see [LICENSE](LICENSE) file

## 👥 Team

**Created by:** Mike Laub
**Contributors:** [See Contributors](https://github.com/myklob/ideastockexchange/contributors)

## 📞 Contact

- **GitHub**: [https://github.com/myklob/ideastockexchange](https://github.com/myklob/ideastockexchange)
- **Issues**: [Report a bug or request a feature](https://github.com/myklob/ideastockexchange/issues)
- **Discussions**:
  - [Good Idea Promoting Algorithm](http://groups.google.com/group/Good-Idea-Promoting-Algorithm)
  - [Idea Stock Exchange](http://groups.google.com/group/Idea-Stock-Exchange)

## 🙏 Acknowledgments

- Benjamin Franklin & Thomas Jefferson for pro/con methodology
- "Getting to Yes" by Fisher & Ury for conflict resolution framework
- Google's PageRank for algorithmic inspiration
- Wikipedia for demonstrating collaborative knowledge building
- All contributors and supporters of this vision

---

<p align="center">
  <strong>This is not just another website.</strong><br>
  <strong>This is an attempt to organize how humanity thinks.</strong>
</p>

<p align="center">
  <em>The template provides the structure. Your contributions provide the content.<br>
  Together, we build humanity's knowledge infrastructure for better decisions.</em>
</p>
