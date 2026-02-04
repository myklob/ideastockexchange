# wikiLaw Architecture

## Design Philosophy

wikiLaw is built on a simple premise: **legislation should be debuggable**. Just as software engineers inspect code, test assumptions, and propose patches, citizens should be able to audit laws, challenge their operating logic, and suggest evidence-based improvements.

This document explains the technical and conceptual architecture that makes that possible.

## Core Architectural Principles

### 1. Separation of Claims from Evidence

Laws make implicit claims about reality. wikiLaw makes them explicit and trackable:

- **Assumption Layer**: "Severity of punishment deters crime"
- **Evidence Layer**: Studies, data, and logical arguments that support/refute
- **Linkage Layer**: Which laws depend on which assumptions

This separation allows us to:
- Reuse assumptions across laws (many laws assume deterrence works)
- Update evidence once and propagate to all dependent laws
- Identify clusters of laws built on shaky foundations

### 2. Structured Skepticism Over Free-Form Commentary

Traditional legal commentary is unstructured prose. wikiLaw enforces **diagnostic templates**:

- Evidence must declare its type, quality metrics, and limitations
- Proposals must specify mechanism, tradeoffs, and falsifiability criteria
- Arguments must link to underlying assumptions

This structure makes **low-quality argumentation expensive**. You can't handwave; you must show your work.

### 3. Versioned Truth with Quality Scores

Not all evidence is created equal. We track:

- **Methodological rigor**: Was this a randomized trial or an anecdote?
- **Replicability**: Can others independently verify this?
- **Transparency**: Are limitations and conflicts disclosed?

Quality scores aren't censorship—they're **truth-in-advertising**. Users can still cite weak evidence, but they can't pretend it's strong.

### 4. Proposal as Pull Request

Changing a law should work like changing code:

1. **Fork** the current version
2. **Propose** specific text changes with justification
3. **Review** mechanism, evidence, and tradeoffs
4. **Merge** if it survives scrutiny (politically)

This makes proposals **directly comparable**. Instead of dueling position papers, you get structured alternatives with explicit differences.

## Type System Design

### ISE Core Types (`lib/types/ise-core.ts`)

These foundational types power the entire framework:

```typescript
Evidence → QualityScore + Source + Limitations
Assumption → Statement + Testability + Evidence[]
Interest → Stakeholder + Goal + Metrics
LinkageScore → From + To + Strength
```

**Why this matters**: These are cross-cutting concepts. An assumption used in criminal justice might also appear in education policy. By making them first-class types, we enable pattern recognition across domains.

### wikiLaw Types (`lib/types/wikilaw.ts`)

Domain-specific types for legal analysis:

```typescript
Law → {
  plainEnglish: string
  statedPurpose: string
  operativePurpose: string
  operatingAssumptions: Assumption[]
  evidenceAudit: EvidenceAudit
  justificationTest: JustificationTest
  stakeholderLedger: StakeholderLedger
  implementationTracker: ImplementationTracker
}
```

Each section answers a specific question:
- **Evidence Audit**: Does it work?
- **Justification Test**: Is it justified?
- **Stakeholder Ledger**: Who pays the price?
- **Implementation Tracker**: What actually happens?

### LawProposal Type

Proposals mirror the law structure but add:

```typescript
LawProposal → {
  goal: ProposalGoal          // What are you fixing?
  mechanism: ProposalMechanism // How will it work?
  evidenceBase: Evidence[]     // Why should we believe you?
  tradeoffAudit: Tradeoffs     // What are the costs?
  aiAnalysis: AIAnalysis       // Gap detection
}
```

**Key innovation**: `acknowledgesDownsides` boolean and `honestyScore`. Proposals that admit tradeoffs earn credibility. Those that don't get flagged.

## Component Architecture

### Atomic Design for Diagnostics

Components are organized by diagnostic function, not by UI pattern:

```
DiagnosticSection     → Container with severity signaling
EvidenceCard          → Quality-scored evidence display
AssumptionCard        → Testable belief with evidence
StakeholderCard       → Impact on specific group
```

Each component is **information-dense but scannable**. No fluff, no marketing copy—just data and analysis.

### Progressive Disclosure

The homepage gives you:
- High-level purpose gap detection
- Category and assumption tags
- Link to full diagnostic

The law page gives you:
- Complete diagnostic dashboard
- All evidence with quality scores
- Implementation gap analysis

This layering lets casual users spot problems quickly while allowing deep divers to audit everything.

## Data Flow

### Static Generation (Current)

```
example-laws.ts → Static data → Pre-rendered pages
```

All example laws are pre-rendered at build time. Fast, simple, demonstrates the concept.

### Future: Dynamic Data Layer

```
Database → API Routes → React Server Components → Client
```

When scaling to real legislative data:

1. **Scraping layer**: Pull statutes from state legal databases
2. **NLP layer**: Extract claims and identify assumptions
3. **Evidence layer**: Link to academic research, case outcomes
4. **Community layer**: User-submitted proposals and reviews
5. **AI layer**: Gap detection and quality scoring

### Why TypeScript is Critical

With hundreds of laws, thousands of assumptions, and complex dependency graphs, **type safety prevents catastrophic errors**:

- Can't link a law to an interest without proper structure
- Can't create evidence without quality scores
- Can't submit proposal without required fields

TypeScript turns conceptual rigor into compiler-enforced rigor.

## UI/UX Design Decisions

### No Gamification

Deliberately **no upvote counts, no badges, no karma**. Those systems reward engagement over accuracy. We want:

- Quality scores based on methodology, not popularity
- Proposals judged on evidence, not charisma
- Assumption challenges that cite data, not tribal affiliation

### Color-Coded Severity

Visual hierarchy based on **information criticality**, not aesthetics:

- 🟢 Green: Meets standard (constitutional, evidence-backed)
- 🟡 Yellow: Warning (purpose gap, weak evidence)
- 🔴 Red: Critical issue (rights violation, proven harm)

This lets you **triage** a law at a glance.

### No Ideological Tagging

We deliberately **don't label laws** "liberal" or "conservative." We tag them by:

- Category (housing, criminal justice)
- Operating assumptions (deterrence, market mechanisms)
- Affected stakeholders

This forces engagement with **mechanism** instead of tribe.

## Scalability Considerations

### One Page Per Topic

Each law gets exactly one canonical page. No fragmentation across:
- Reddit threads
- Blog posts
- Forum discussions
- Social media

This concentrates effort and prevents **context collapse**.

### Linkage Scores for Dependency Mapping

When you improve evidence for one assumption, it propagates to **all laws using that assumption**. When you identify a constitutional flaw in one law, you can flag similar laws with the same structure.

This turns debugging from linear (one law at a time) to **graph-based** (fix root causes).

### AI as Bullshit Detector, Not Oracle

AI doesn't decide what's true. It **flags gaps**:

- "You cited a think tank report, but it has no empirical study backing it"
- "You claimed X causes Y but didn't specify a mechanism"
- "You ignored enforcement costs in your tradeoff audit"

This makes **motivated reasoning expensive** without giving AI veto power.

## Integration with Broader ISE Platform

wikiLaw is a **vertical slice** of the Idea Stock Exchange:

- **Same type system**: Evidence, Assumptions, Interests
- **Same rigor**: Quality scores, falsifiability, tradeoff honesty
- **Same ethos**: No ideological ownership; ideas win by surviving reality

Other ISE verticals might include:
- **Policy proposals** (not yet law)
- **Scientific claims** (research papers)
- **Business strategies** (startup hypotheses)

Each uses the same debugging framework, applied to different domains.

## Why This Architecture Matters

Most legal tech focuses on **access** (making laws readable) or **automation** (contract review, research). wikiLaw focuses on **verification**:

- Does the law work as claimed?
- Are its assumptions justified?
- Could we do better with less harm?

This requires a fundamentally different architecture:

- Not a search engine (information retrieval)
- Not a forum (discussion platform)
- Not a petition site (advocacy tool)

It's a **testing ground for hypotheses about how society should work**, rendered in structured data with evidence trails.

When you build it this way, you can't hide behind rhetoric. Every claim is traceable. Every assumption is challengeable. Every proposal is comparable.

**The legal code stops being sacred when it becomes auditable.**

This architecture makes it auditable.
# IdeaStockExchange Architecture

## System Overview

IdeaStockExchange is a full-stack TypeScript application following a traditional client-server architecture with a React frontend, Express backend, and PostgreSQL database.

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│  (Debate UI, Argument Trees, Media Library, Auth)       │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST API
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   Express Backend                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Routes Layer                                    │   │
│  │  - /api/auth    - /api/debates                   │   │
│  │  - /api/arguments  - /api/media                  │   │
│  └────────────────┬─────────────────────────────────┘   │
│                   │                                      │
│  ┌────────────────▼─────────────────────────────────┐   │
│  │  Services Layer                                  │   │
│  │  - ReasonRank Algorithm                          │   │
│  │  - Scoring Services                              │   │
│  └────────────────┬─────────────────────────────────┘   │
│                   │                                      │
│  ┌────────────────▼─────────────────────────────────┐   │
│  │  Middleware                                      │   │
│  │  - JWT Authentication                            │   │
│  │  - Error Handling                                │   │
│  │  - Request Validation (Zod)                      │   │
│  └────────────────┬─────────────────────────────────┘   │
└───────────────────┼──────────────────────────────────────┘
                    │ Prisma ORM
                    │
┌───────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database                         │
│  - Users         - Debates        - Arguments            │
│  - Media         - ArgumentMedia  - Votes                │
└──────────────────────────────────────────────────────────┘
```

## Data Model

### Entity Relationship Diagram

```
User
├── debates (1:N)
├── arguments (1:N)
├── media (1:N)
└── votes (1:N)

Debate
├── author (N:1 User)
└── arguments (1:N)

Argument
├── debate (N:1 Debate)
├── parent (N:1 Argument, optional)
├── children (1:N Argument)
├── author (N:1 User)
├── media (1:N ArgumentMedia)
└── votes (1:N Vote)

Media
├── creator (N:1 User)
└── arguments (1:N ArgumentMedia)

ArgumentMedia (Junction)
├── argument (N:1 Argument)
└── media (N:1 Media)

Vote
├── user (N:1 User)
└── argument (N:1 Argument)
```

## Frontend Architecture

### Component Hierarchy

```
App
├── Header
│   └── Navigation + Auth Status
├── Router
│   ├── Home
│   │   └── DebateList
│   ├── DebateView
│   │   ├── ArgumentTree
│   │   │   └── ArgumentNode (recursive)
│   │   │       ├── MediaList
│   │   │       └── AddArgument
│   │   └── AddArgument
│   ├── CreateDebate
│   ├── MediaLibrary
│   │   ├── MediaGrid
│   │   └── AddMedia
│   ├── Login
│   └── Register
└── AuthContext (Global State)
```

### State Management

- **AuthContext**: Global authentication state using React Context API
- **Component State**: Local state with useState for forms and UI
- **Server State**: Fetched via axios, no client-side caching layer

### Key Frontend Patterns

1. **Context for Auth**: Centralized authentication state
2. **Controlled Components**: Form inputs managed by React state
3. **Conditional Rendering**: Auth-gated features
4. **Recursive Components**: ArgumentNode renders nested arguments
5. **Modal Patterns**: Overlay modals for forms

## Backend Architecture

### Layered Architecture

```
Routes (API Endpoints)
    ↓
Middleware (Auth, Validation)
    ↓
Business Logic (Services)
    ↓
Data Access (Prisma)
    ↓
Database (PostgreSQL)
```

### Request Flow Example

```
POST /api/arguments
    ↓
1. Express Route Handler (arguments.ts)
    ↓
2. JWT Middleware (authenticate)
    ↓
3. Zod Schema Validation
    ↓
4. Business Logic
   - Create argument via Prisma
   - Calculate initial ReasonRank
    ↓
5. Return Response (201 + argument data)
```

## ReasonRank Algorithm

### Formula

```
ReasonRank = (Truth × 0.30) + (Importance × 0.25) + (Relevance × 0.20)
           + (VoteScore × 0.15) + (MediaScore × 0.08) + (Recency × 0.02)
```

### Component Calculations

#### Vote Score (Sigmoid Normalization)
```
netVotes = upvotes - downvotes
voteScore = 1 / (1 + e^(-netVotes/10))
```

#### Media Score
```
For each media item:
  score = credibility × relevance × positionFactor

positionFactor:
  - SUPPORTS: 1.0
  - NEUTRAL: 0.6
  - REFUTES: 0.3

avgScore = sum(scores) / count
diversityBonus = min(count/5, 0.2)
contradictionPenalty = refuteCount > supportCount ? 0.1 : 0

mediaScore = min(avgScore + diversityBonus - contradictionPenalty, 1.0)
```

#### Recency Boost (Exponential Decay)
```
daysSinceCreation = (now - createdAt) / (24 hours)
recencyBoost = e^(-daysSinceCreation/30)  // 30-day half-life
```

### When ReasonRank Updates

- When argument is created
- When votes are added/removed/changed
- When scores are manually updated
- When media is linked

## Security Architecture

### Authentication Flow

```
1. User Registration
   - Hash password with bcrypt (10 rounds)
   - Store user in database
   - Generate JWT token
   - Return token to client

2. User Login
   - Verify email exists
   - Compare password hash
   - Generate JWT token
   - Return token to client

3. Authenticated Request
   - Extract Bearer token from Authorization header
   - Verify JWT signature
   - Decode user info
   - Attach to req.user
   - Continue to route handler
```

### JWT Token Structure

```json
{
  "userId": "cuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Security Measures

1. **Password Hashing**: bcrypt with 10 rounds
2. **JWT Secrets**: Environment-based secret keys
3. **Token Expiration**: 7-day expiration
4. **Input Validation**: Zod schemas on all inputs
5. **SQL Injection Prevention**: Prisma parameterized queries
6. **XSS Prevention**: React auto-escaping
7. **CORS**: Configured origin restrictions
8. **Authorization**: Owner-only edit/delete checks

## Database Design

### Indexing Strategy

```sql
-- Primary Keys (automatic indexes)
users.id, debates.id, arguments.id, media.id

-- Foreign Keys (should be indexed)
arguments.debateId
arguments.parentId
arguments.authorId
media.authorId

-- Unique Constraints
users.email
users.username
votes(userId, argumentId)
argumentMedia(argumentId, mediaId)

-- Query Optimization Indexes (recommended)
arguments(reasonRank DESC)
debates(createdAt DESC)
media(mediaType)
```

### Data Integrity

- **Cascading Deletes**: Deleting debates removes arguments; deleting arguments removes votes
- **Required Fields**: Enforced at database and application level
- **Enums**: Strict type checking for position, mediaType, voteType
- **Timestamps**: Automatic createdAt/updatedAt tracking

## Scalability Considerations

### Current Limitations

- Single server deployment
- No caching layer
- Synchronous request handling
- Full argument trees loaded at once

### Future Optimizations

1. **Caching**
   - Redis for debate/argument caching
   - Media library caching
   - User session caching

2. **Database**
   - Read replicas for scaling reads
   - Connection pooling (Prisma supports this)
   - Materialized views for complex queries

3. **API**
   - Pagination for large result sets
   - GraphQL for flexible querying
   - Rate limiting to prevent abuse

4. **Frontend**
   - Code splitting for faster loads
   - Virtual scrolling for long argument trees
   - Service worker for offline support

5. **Infrastructure**
   - Horizontal scaling with load balancer
   - CDN for static assets
   - Microservices for media processing

## Error Handling

### Error Flow

```
Error Occurs
    ↓
Caught by try/catch
    ↓
Passed to next(error)
    ↓
Error Handler Middleware
    ↓
- If AppError: Return status + message
- If Unexpected: Log + return 500
    ↓
JSON Response to Client
```

### Error Types

```typescript
class AppError {
  statusCode: 401 | 403 | 404 | 400 | 500
  message: string
  isOperational: true
}
```

## Testing Strategy (Future)

### Unit Tests
- ReasonRank algorithm calculations
- Scoring functions
- Validation schemas
- Utility functions

### Integration Tests
- API endpoint testing
- Database operations
- Authentication flow
- Authorization checks

### E2E Tests
- User registration and login
- Debate creation workflow
- Argument posting and voting
- Media library operations

## Deployment

### Production Checklist

1. Set environment variables:
   - DATABASE_URL
   - JWT_SECRET
   - NODE_ENV=production
   - PORT

2. Build application:
   ```bash
   npm run build
   ```

3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Start server:
   ```bash
   npm start
   ```

### Recommended Infrastructure

- **Database**: Managed PostgreSQL (AWS RDS, Heroku Postgres, Supabase)
- **Backend**: Container-based deployment (Docker, Kubernetes)
- **Frontend**: Static hosting (Vercel, Netlify, CloudFront)
- **Environment**: Separate dev/staging/prod environments

## Monitoring & Observability

### Recommended Additions

1. **Logging**: Winston or Pino for structured logs
2. **Monitoring**: DataDog, New Relic, or Prometheus
3. **Error Tracking**: Sentry for error aggregation
4. **Analytics**: Track debate engagement, user activity
5. **Performance**: APM for slow query detection

---

This architecture is designed to be maintainable, scalable, and extensible while providing a solid foundation for the IdeaStockExchange platform.
