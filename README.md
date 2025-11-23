# 🧠 Idea Stock Exchange: The Truth Marketplace

> **A crowdsourced reasoning engine where ideas are scored like stocks, truth is transparent, and evidence determines value.**

The **Idea Stock Exchange (ISE)** is an open-source platform that treats every belief, argument, and piece of evidence as a trackable object with its own truth score—creating a transparent marketplace of ideas ranked by evidence, logic, and importance.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 **Core Concept**

The ISE is more than a debate platform—it's a **dynamic knowledge evaluation system** where:

- Every **belief**, **argument**, **piece of evidence**, and **media item** is a *trackable object* with its own truth score
- Users **contribute**, **challenge**, and **link** these objects through structured reasoning
- The system dynamically updates each item's **score** based on pro/con performance and evidence quality
- The entire ecosystem becomes a transparent **marketplace of ideas** ranked by truth, evidence, and importance

Think of it as:
- **Wikipedia's structure** for organizing knowledge
- **StackOverflow's reputation system** for quality control
- **Prediction market dynamics** for truth discovery
- **GitHub's transparency** for open collaboration
- **Academic peer review** for verification
- **Social network scale** for broad participation

---

## 💰 **Revenue-Generating Features** ✨ NEW

The Idea Stock Exchange implements **five complementary revenue models** that align profit incentives with quality discourse:

1. **💳 Subscription Tiers** - Free/Premium/Enterprise plans with progressive features
2. **📈 Virtual Currency Investing** - Bet on beliefs like stocks (idea investing)
3. **🎮 Gamification** - Character stats derived from contribution quality
4. **❤️ Matching Services** - Dating/networking based on belief compatibility
5. **🔌 API Access** - Tiered rate limits for institutions and developers

**Key Innovation**: Users profit by finding undervalued beliefs and adding quality evidence—**aligning financial incentives with truth-seeking**.

**📖 Full Documentation**: See [MONETIZATION.md](./MONETIZATION.md) for complete API documentation and integration guide.

**Quick Start**:
```bash
npm run init-monetization  # Initialize achievements and subscriptions
```

---

## 📊 **The Conclusion Score (CS)**

At the heart of ISE is the **Conclusion Score**—a quantitative metric that evaluates the strength and validity of beliefs by analyzing arguments and evidence across **six dimensions**:

### **Component Summary**

| Component                      | Abbreviation | Description                                                               | Status |
| ------------------------------ | ------------ | ------------------------------------------------------------------------- | ------ |
| **Reasons to Agree/Disagree**  | RtA/RtD      | Strength and number of arguments supporting or opposing a conclusion      | ✅ Implemented |
| **Evidence Strength**          | ES           | Evaluates the reliability and relevance of supporting/disputing evidence  | ✅ Implemented |
| **Logical Coherence**          | LC           | Assesses logical structuring and the absence of fallacies in arguments    | ✅ Implemented |
| **Verification and Credibility** | VC         | Measures evidence credibility based on unbiased, independent sources      | ✅ Implemented |
| **Linkage and Relevance**      | LR           | Evaluates the argument's direct influence on the conclusion               | ✅ Implemented |
| **Uniqueness and Distinctiveness** | UD       | Recognizes originality, reducing redundancy in argumentation              | ✅ Implemented |
| **Argument Importance**        | AI           | Weighs the significance of an argument's impact on the conclusion         | ✅ Implemented |

### **Formula**

```
CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)
```

This **algorithmic approach** ensures that well-supported, logically coherent, and unique arguments receive higher scores, promoting **informed decision-making**.

### **Example Calculation**

Assessing a policy's **CS** with:
- **RtA**: Scores of 4 and 3
- **RtD**: Score of 2
- **ES, LC, VC, LR, UD, AI**: Average weighted values of **0.8, 0.9, 1.0, 0.85, 0.9, and 0.95** respectively

```
CS = ((4 + 3 - 2) × 0.8 × 0.9 × 1.0 × 0.85 × 0.9 × 0.95) = 3.26
```

---

## 🔍 **Core Data Models**

| **Entity**                     | **Description**                                                                         | **Status** |
| ------------------------------ | --------------------------------------------------------------------------------------- | ---------- |
| **Belief**                     | A claim about reality, policy, or ethics (e.g., "Raising minimum wage reduces poverty") | ✅ Implemented |
| **Argument (Pro/Con)**         | Logical reasoning supporting or opposing a Belief                                       | ✅ Implemented |
| **Evidence**                   | Data, study, quote, or reference used to support an Argument                            | ✅ Implemented |
| **User**                       | Participant contributing arguments, evidence, or ratings                                | ✅ Implemented |
| **Media**                      | Film, book, podcast, article, meme that influences beliefs                              | 🔄 Planned (Phase 4) |
| **CBO (Chief Belief Officer)** | User with greatest score-changing contributions for a Belief (receives ad revenue share) | 🔄 Planned (Phase 3) |
| **Community/Topic Page**       | Group of related beliefs (e.g., "Climate Change", "Free Speech")                        | 🔄 Planned (Phase 2) |

---

## 🧮 **Advanced Algorithms**

### **1. ReasonRank / ArgumentRank** ✅ Implemented

**ReasonRank** is an adaptation of Google's **PageRank** algorithm to evaluate reasons based on the number and relative strength of pro/con reasons, factoring in sub-arguments.

```javascript
// ArgumentRank Implementation (JavaScript)
function argumentrank(M, num_iterations = 100, d = 0.85) {
  const N = M.length;
  let v = new Array(N).fill(1 / N);

  for (let i = 0; i < num_iterations; i++) {
    const newV = new Array(N).fill(0);

    for (let j = 0; j < N; j++) {
      let sum = 0;
      for (let k = 0; k < N; k++) {
        sum += M[k][j] * v[k];
      }
      newV[j] = d * sum + (1 - d) / N;
    }

    // Prevent negative scores and normalize
    v = newV.map(val => Math.max(0, val));
    const total = v.reduce((a, b) => a + b, 0);
    v = v.map(val => val / total);
  }

  return v;
}
```

### **2. Logical Fallacy Detection** ✅ Implemented

Automatically detects **10 types of logical fallacies**:
- Ad Hominem
- Straw Man
- False Dichotomy
- Appeal to Authority
- Slippery Slope
- Circular Reasoning
- Hasty Generalization
- Red Herring
- Appeal to Emotion
- Tu Quoque

Each fallacy is detected using pattern matching and reduces the **Logical Coherence (LC)** score.

### **3. Redundancy Detection** ✅ Implemented

Uses **4 similarity algorithms** to identify duplicate arguments:
1. Levenshtein distance
2. Jaccard similarity
3. TF-IDF + Cosine similarity
4. N-gram analysis

Redundant arguments have reduced **Uniqueness (UD)** scores.

### **4. Evidence Verification** ✅ Implemented

Crowdsourced credibility scoring where:
- Multiple users can verify or dispute evidence
- Credibility score = `50 + (verifiedCount × 10) - (disputedCount × 10)`
- Supports scholarly metadata: DOI, ISBN, PMID, citation count

### **5. Epistemic Impact** 🔄 Planned (Phase 2)

```
Epistemic Impact = Truth Score × Reach (Audience Size) × Linkage Strength
```

Used for ranking **media** and **arguments** by their total influence on collective reasoning.

### **6. Truth Score** 🔄 Planned (Phase 2)

```
Truth Score = (Logical Validity × Evidence Quality × Verification Level) ± Counterargument Weight
```

Bounded between -1 (false) and +1 (true).

### **7. Importance Score** 🔄 Planned (Phase 2)

Separate from truth—measures the **real-world consequence** of a belief based on cost-benefit, ethical significance, and policy impact.

---

## 🎨 **User Interaction Features**

### ✅ **Currently Implemented**

#### **Belief Pages**
- Single, permanent page for each belief
- Dynamic Conclusion Score display
- Tabbed view for Supporting/Opposing/All arguments
- Hierarchical argument trees
- Related beliefs sidebar
- View tracking

#### **Argument Builder**
- Visual type selector (Supporting/Opposing)
- Rich textarea with character counter (10-2000 chars)
- Real-time validation
- Quality guidelines
- Sub-argument support

#### **Evidence Submission**
- 8 evidence types: study, article, book, video, image, data, expert-opinion, other
- Source fields: URL, author, publication, date
- Scholarly metadata: DOI, ISBN, PMID, citations
- Tag system

#### **Voting Panel**
- Upvote/downvote on arguments
- Optimistic UI updates
- Vote tracking per user (prevents double voting)

#### **Score Breakdown**
- Comprehensive dashboard showing all 6 score components
- Progress bars with tooltips
- Formula display
- Real-time updates

### 🔄 **Planned Features**

#### **Phase 2: Advanced Scoring**
- Linkage network visualization
- Importance vs Truth scatter plots
- Belief evolution timeline
- Epistemic impact calculations

#### **Phase 3: Incentives & Governance**
- **CBO Dashboard**: Track influence, payout, and contribution history
- Ad revenue sharing (5% to top contributor per belief)
- Reputation-based voting weights
- Peer review layer for challenges

#### **Phase 4: Media Integration**
- Database of films, books, articles, podcasts
- Media Truth Score calculation
- Cultural impact tracking
- Automated indexing from media APIs (IMDb, Goodreads, etc.)

#### **Phase 5: AI Tools**
- Automated claim extraction from texts
- Argument suggestion engine
- Evidence summarizer
- Debate companion / coach
- Misinformation detector

#### **Phase 6: Community Features**
- Policy Simulator (rank proposals by truth + importance + cost-benefit)
- Educational Mode (classroom integration)
- Global Alignment Map (cultural differences in truth perception)
- Notifications and real-time updates

---

## 🛠️ **Technology Stack**

### **Backend**
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose ORM
- **Authentication**: JWT + bcrypt
- **Algorithms**: Custom JavaScript implementations for ArgumentRank, Fallacy Detection, Redundancy Detection

### **Frontend**
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Context API

### **Planned Additions**
- **Graph Database**: Neo4j for linkage mapping
- **Real-time**: WebSocket (Socket.io)
- **Caching**: Redis
- **Analytics**: Custom dashboard
- **Testing**: Jest + React Testing Library
- **API**: GraphQL endpoints

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 16+ and npm
- MongoDB 5+ (running locally or via MongoDB Atlas)
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/myklob/ideastockexchange.git
   cd ideastockexchange
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ideastockexchange
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Run the application**

   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

7. **Open your browser**

   Navigate to `http://localhost:5173`

---

## 📂 **Project Structure**

```
ideastockexchange/
├── backend/
│   ├── models/              # MongoDB schemas (User, Belief, Argument, Evidence)
│   ├── routes/              # API endpoints
│   ├── controllers/         # Business logic
│   ├── middleware/          # Authentication middleware
│   ├── utils/               # Algorithms (fallacy/redundancy detection)
│   ├── config/              # Database connection
│   └── server.js            # Main server + ArgumentRank algorithm
├── frontend/
│   └── src/
│       ├── pages/           # Main views (BeliefsList, BeliefDetails, AddArgument)
│       ├── components/      # Reusable UI components
│       ├── context/         # Auth state management
│       └── services/        # API layer
└── docs/                    # Documentation (coming soon)
```

---

## 🗺️ **Development Roadmap**

| **Phase**   | **Focus**                    | **Deliverables**                                                            | **Status** |
| ----------- | ---------------------------- | --------------------------------------------------------------------------- | ---------- |
| **Phase 1** | MVP Core                     | Belief pages, arguments, evidence submission, basic scoring                 | ✅ **90% Complete** |
| **Phase 2** | Advanced Scoring             | Linkage, importance, epistemic impact, visualization                        | 🔄 In Planning |
| **Phase 3** | Incentives                   | CBO system, ad revenue share, reputation weighting                          | 🔄 In Planning |
| **Phase 4** | Media Integration            | Media truth scores, cultural impact tracking                                | 🔄 In Planning |
| **Phase 5** | AI Tools                     | Argument suggestion, claim extraction, auto-verification                    | 🔄 In Planning |
| **Phase 6** | Governance                   | Peer review, moderation, version transparency                               | 🔄 In Planning |
| **Phase 7** | Global Expansion             | Multilingual support, institutional partnerships                            | 🔄 In Planning |

---

## 📈 **Current Features (Phase 1 - 90% Complete)**

### ✅ **Fully Functional**
- User authentication (register, login, JWT)
- Create/edit/delete beliefs
- Create/edit/delete arguments (supporting/opposing)
- Submit evidence with scholarly metadata
- Vote on arguments (up/down)
- View tracking and statistics
- Search and filter beliefs by category, status, score
- Hierarchical argument trees
- Comprehensive score breakdowns (6 components)
- **Fallacy Detection**: Automated logical fallacy identification
- **Redundancy Detection**: Duplicate argument identification
- **ReasonRank Algorithm**: PageRank-inspired scoring
- **Conclusion Score**: Multi-factor belief scoring
- **Evidence Verification**: Crowdsourced credibility scoring
- **Related Beliefs**: Linkage with relationship types

### ⚠️ **Partially Implemented**
- Evidence display in arguments (API exists, UI integration pending)
- Sub-argument creation (model supports, UI missing)
- Belief editing (route exists, full integration pending)
- Full analysis endpoints (powerful APIs exist, frontend doesn't use yet)

### 🔄 **Coming Soon (Phase 1 Completion)**
- Automated tests (unit + integration)
- API documentation (Swagger/OpenAPI)
- Rate limiting
- Email verification
- Password reset flow

---

## 🤝 **Contributing**

We welcome contributions! The ISE is a community-driven project.

### **How to Contribute**

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to branch** (`git push origin feature/AmazingFeature`)
5. **Open a pull request**

### **Contribution Areas**

- **Core Features**: Implement Phase 2-7 features
- **Algorithms**: Improve scoring, fallacy detection, redundancy detection
- **UI/UX**: Enhance components, add visualizations
- **Testing**: Write unit and integration tests
- **Documentation**: Improve guides, add tutorials
- **Bug Fixes**: Report and fix issues

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📜 **License**

This project is licensed under the **MIT License** – promoting openness and collaborative development.

See [LICENSE](LICENSE) for details.

---

## 📞 **Contact & Community**

- **GitHub**: [@myklob](https://github.com/myklob)
- **Twitter**: [@myclob](https://twitter.com/myclob)
- **Blog**: [myclob.blogspot.com](https://myclob.blogspot.com/)
- **Official Website**: [ideastockexchange.org](https://ideastockexchange.org/) *(coming soon)*

---

## 🙏 **Acknowledgements**

A huge thank you to all contributors and supporters of the **Idea Stock Exchange**. Your dedication to fostering **evidence-based discourse** is invaluable.

Special thanks to:
- The open-source community for foundational tools
- Academic researchers advancing computational argumentation
- Early testers and feedback providers

---

## 🌟 **Vision Statement**

> **The Idea Stock Exchange is more than just a platform—it's a movement toward transparent, logical, and evidence-based discussions. We're building the world's first living, open-source system for evaluating truth and importance—where ideas are scored, evidence is tracked, and influence is transparent.**

### **Join Us in Building a More Rational World**

Every argument you add, every fallacy you catch, every piece of evidence you verify—contributes to humanity's collective understanding of truth. Together, we can create a marketplace where good ideas rise and weak arguments fall, based on logic and evidence rather than rhetoric and popularity.

**Start contributing today!** 🚀

---

## 📚 **Additional Resources**

- [Architecture Documentation](docs/ARCHITECTURE.md) - Deep dive into system design
- [API Reference](docs/API.md) - Complete API documentation *(coming soon)*
- [Algorithm Explanations](docs/ALGORITHMS.md) - How scoring works *(coming soon)*
- [User Guide](docs/USER_GUIDE.md) - How to use the platform *(coming soon)*
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Setup and development workflow *(coming soon)*

---

**Built with ❤️ by the ISE community** | **Star ⭐ this repo to support the project!**
