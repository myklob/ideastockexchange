# Idea Stock Exchange - Book Analysis System

**Combat Reports for Ideas**: A comprehensive book analysis platform that generates systematic scrutiny across six logical battlegrounds, transforming subjective literary influence into quantifiable, transparent metrics.

## 🎯 Overview

The Idea Stock Exchange doesn't provide traditional book reviews—it generates **combat reports for ideas**. Every book submitted faces systematic scrutiny across six logical battlegrounds, with granular scoring for each claim, weighted by centrality to the book's thesis.

## 📊 Four-Dimensional Scoring Framework

Every book receives four independent scores:

1. **Book Logical Validity Score** (0-100): How well arguments survive logical scrutiny
2. **Book Quality Score** (0-100): Whether the book achieves its stated goals
3. **Topic Overlap Score** (0-100% per belief): How central a belief is to the book's thesis
4. **Belief Impact Weight**: Influence multiplier based on reach (log of sales + citations + shares)

### Final Impact Formula

```
Total Impact on Belief X = Logical Validity × Quality × Topic Overlap × log(Reach)
```

## ⚔️ The 6 Logic Battlegrounds

1. **Fallacy Autopsy Theater**: Tests logical structure—strawmen, ad hominem, post hoc reasoning
2. **Contradiction Trials**: Checks internal consistency
3. **Evidence War Rooms**: Verifies data and sources
4. **Metaphor MRI Scans**: Evaluates analogy accuracy
5. **Prediction Mortuaries**: Tracks forecasting accuracy
6. **Belief Transmission Labs**: Measures societal spread velocity ("Belief R₀")

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ideastockexchange.git
cd ideastockexchange
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your database connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/ideastockexchange?schema=public"
```

4. Set up the database:

```bash
npm run db:push
```

5. Seed the database with example books:

```bash
npm run db:seed
```

This will populate the database with four example books:

- **Hamlet** by William Shakespeare
- **Thinking, Fast and Slow** by Daniel Kahneman
- **Outliers** by Malcolm Gladwell
- **The Communist Manifesto** by Karl Marx & Friedrich Engels

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Example Analyses

The seed data includes complete analyses demonstrating the ISE methodology:

### Thinking, Fast and Slow (88/100 validity)

- **Strong Claims**: Cognitive bias framework (92%), Statistical reasoning (88%)
- **Weak Claims**: Priming effects (60% - replication crisis)
- **Key Insight**: Statistical sections outperform narrative examples

### Outliers (72/100 validity)

- **Strong Claims**: 10,000-hour rule (80%)
- **Weak Claims**: Birth month effects (55% - correlation ≠ causation)
- **Fallacies**: Post hoc reasoning flagged throughout

### The Communist Manifesto (65/100 validity, 9.2/10 impact)

- **Belief Impact**: One of history's most influential texts (500M+ copies)
- **Key Insight**: Perfect example of validity/influence gap

## 🏗️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📁 Project Structure

```
ideastockexchange/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── books/           # Book CRUD operations
│   ├── books/               # Book pages
│   │   ├── page.tsx         # Books listing
│   │   └── [id]/page.tsx    # Individual book analysis
│   ├── topics/              # Topics/beliefs pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── lib/                     # Shared libraries
│   ├── db.ts               # Prisma client
│   ├── types.ts            # TypeScript types
│   ├── scoring.ts          # Scoring calculations
│   └── services/           # Business logic
│       ├── bookService.ts
│       └── logicBattlegrounds.ts
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
└── package.json
```

## 🔬 Key Features

### Weighted Argument Validity

Not all claims carry equal weight. Centrality weighting:

- Core thesis claims: Weight = 1.0
- Major supporting arguments: Weight = 0.7
- Examples and illustrations: Weight = 0.4
- Tangential points: Weight = 0.2
- Footnotes: Weight = 0.1

### Human + AI Synergy

Final validity scoring combines:

- AI Pattern Detection (30%): Scale analysis across thousands of books
- Crowd Contextual Nuance (50%): Domain-specific context evaluation
- Expert Deep Analysis (20%): Domain expertise in specific fields

### Time Decay for Evidence

Older claims lose validity if not re-verified, with special tracking for:

- Replication status (crucial for scientific claims)
- Last verification date
- Original publication date

## 📈 API Endpoints

### Books

- `GET /api/books` - List all books with scores
- `POST /api/books` - Create a new book
- `GET /api/books/:id` - Get book details
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/:id/analysis` - Get comprehensive analysis report

## 🎨 UI Components

The application features:

- **Homepage**: Introduction to the ISE framework
- **Books Listing**: Grid of analyzed books with scores
- **Book Analysis Page**: Comprehensive breakdown with:
  - Four-dimensional scores
  - Claim-by-claim analysis
  - Logic battlegrounds results
  - Topic overlap visualization
  - Author credibility metrics

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with examples
```

## 📊 Database Schema

The system uses a comprehensive relational schema:

- **Book**: Core book metadata and scores
- **Claim**: Individual testable claims within books
- **TopicOverlap**: Belief centrality to each book
- **Fallacy**: Logical fallacies identified (Battleground 1)
- **Contradiction**: Internal inconsistencies (Battleground 2)
- **Evidence**: Source verification (Battleground 3)
- **Metaphor**: Analogy accuracy (Battleground 4)
- **Prediction**: Forecasting accuracy (Battleground 5)
- **Author**: Author profiles with truth equity
- **User**: Contributor profiles with credibility scores

## 🌟 Core Principles

1. **Granular Analysis**: Individual claims scored, not just entire books
2. **Centrality Weighting**: Core arguments matter more than footnotes
3. **Transparent Metrics**: Every score is calculable and verifiable
4. **Validity ≠ Influence**: Track both independently
5. **Time-Aware**: Evidence quality changes as studies replicate or fail
6. **Crowd + AI + Expert**: Hybrid scoring prevents bias

## 🚦 Roadmap

- [ ] User authentication and contribution system
- [ ] Real-time collaborative claim evaluation
- [ ] Automated AI fallacy detection
- [ ] Citation graph visualization
- [ ] Belief transmission velocity tracking
- [ ] Author response system
- [ ] ISE Verified badge for 90%+ validity

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! The ISE transforms reading from passive consumption to active critical analysis.

---

**"Books don't own the truth—you and the crowd define it."**
