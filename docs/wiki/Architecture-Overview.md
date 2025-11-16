# Architecture Overview

A comprehensive guide to the Idea Stock Exchange system architecture, design patterns, and technical decisions.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐    │
│    │              React 18 Application                     │    │
│    │                                                       │    │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│    │  │  Pages  │ │Components│ │ Context │ │Services │   │    │
│    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │    │
│    └──────────────────────────────────────────────────────┘    │
│                               │                                  │
│                          HTTP/REST                               │
└───────────────────────────────┼─────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────┐
│                          API LAYER                               │
│                               │                                  │
│    ┌──────────────────────────▼──────────────────────────┐     │
│    │              Express.js Server                       │     │
│    │                                                       │     │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │     │
│    │  │  Routes │ │Middleware│ │Controllers│ │  Utils  │   │     │
│    │  │         │ │  (Auth) │ │          │ │(Algos)  │   │     │
│    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │     │
│    └──────────────────────────────────────────────────────┘     │
│                               │                                  │
│                         Mongoose ODM                             │
└───────────────────────────────┼─────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────┐
│                       DATABASE LAYER                             │
│                               │                                  │
│    ┌──────────────────────────▼──────────────────────────┐     │
│    │                    MongoDB                           │     │
│    │                                                       │     │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │     │
│    │  │  Users  │ │ Beliefs │ │Arguments │ │Evidence │   │     │
│    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │     │
│    └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Separation of Concerns

```
Frontend (React)     →  UI/UX, user interactions, state management
API Layer (Express)  →  Business logic, validation, authentication
Database (MongoDB)   →  Data persistence, querying, indexing
Algorithms (Utils)   →  Scoring calculations, pattern detection
```

### 2. RESTful API Design

```
Resource-oriented URLs:
GET    /api/beliefs          →  List beliefs
GET    /api/beliefs/:id      →  Get single belief
POST   /api/beliefs          →  Create belief
PUT    /api/beliefs/:id      →  Update belief
DELETE /api/beliefs/:id      →  Delete belief

Nested resources:
GET    /api/beliefs/:id/arguments  →  Get belief's arguments
POST   /api/arguments/:id/vote     →  Vote on argument
```

### 3. Document-Oriented Data

MongoDB's flexible schema allows:
- Embedded documents (scores, statistics)
- Dynamic fields (tags, metadata)
- Easy schema evolution
- Natural JSON mapping

---

## Data Flow

### Creating a Belief

```
1. User Interface
   └─ BeliefForm.js captures input
      └─ Validates locally (10-500 chars)

2. API Service
   └─ beliefAPI.create(data) via Axios
      └─ Adds JWT token to headers

3. Express Router
   └─ POST /api/beliefs hits router
      └─ protect middleware checks auth

4. Controller
   └─ createBelief() validates and processes
      └─ Belief.create() saves to MongoDB

5. Database
   └─ Mongoose validates schema
      └─ MongoDB persists document
      └─ Indexes updated

6. Response
   └─ Controller returns success + data
      └─ Frontend updates state
      └─ UI reflects new belief
```

### Voting on an Argument

```
User clicks 👍
    │
    ▼
ArgumentCard.handleVote('up')
    │
    ├─► Optimistic UI Update (instant feedback)
    │   localVotes.up += 1
    │
    ▼
argumentAPI.vote(id, 'up')
    │
    ▼
POST /api/arguments/:id/vote
    │
    ▼
protect middleware (verify JWT)
    │
    ▼
voteArgument controller:
    ├─ Check if user already voted
    ├─ Toggle/change/add vote
    ├─ Update argument.votes
    ├─ Update user.votedArguments
    └─ Save both documents
    │
    ▼
Return new vote counts
    │
    ▼
Frontend confirms or rollback
```

### Calculating Scores

```
New Argument Created
    │
    ▼
argument.calculateOverallScore()
    │
    ├─ overall = (logical + linkage + importance) / 3
    │
    ▼
belief.calculateConclusionScore()
    │
    ├─ Populate supporting arguments
    ├─ Populate opposing arguments
    ├─ Calculate weighted averages
    └─ Update conclusionScore
    │
    ▼
belief.updateStatistics()
    │
    ├─ Count supporting arguments
    ├─ Count opposing arguments
    └─ Total arguments
```

---

## Authentication Flow

```
┌─────────────┐     Register     ┌─────────────┐
│   Client    │─────────────────▶│   Server    │
│             │                  │             │
│             │   Create User    │             │
│             │◀─────────────────│   + Hash    │
│             │   + JWT Token    │   Password  │
│             │                  │             │
└──────┬──────┘                  └─────────────┘
       │
       │ Store token in
       │ localStorage
       │
       ▼
┌─────────────┐   Protected      ┌─────────────┐
│   Client    │   Request        │   Server    │
│  (logged in)│─────────────────▶│             │
│             │                  │   Verify    │
│  Bearer     │   200 OK +       │   JWT       │
│  Token      │◀─────────────────│   Token     │
│  Header     │   Data           │             │
└─────────────┘                  └─────────────┘
```

### JWT Token Structure

```javascript
// Payload contains:
{
  id: "user_id",
  username: "johndoe",
  role: "user",
  iat: 1234567890,  // Issued at
  exp: 1234654290   // Expires at
}

// Signed with JWT_SECRET from .env
```

### Authorization Levels

```javascript
// middleware/auth.js

export const protect = async (req, res, next) => {
  // 1. Get token from header
  // 2. Verify token signature
  // 3. Attach user to request
  // 4. Call next()
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  };
};

// Usage:
router.post('/admin-action', protect, authorize('admin'), controller);
```

---

## Algorithm Integration

### Fallacy Detection Pipeline

```
User Input
    │
    ▼
┌─────────────────────┐
│  Text Normalization │
│  - lowercase        │
│  - trim whitespace  │
└──────────┬──────────┘
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌─────────┐  ┌─────────┐
│ Pattern │  │ Keyword │
│ Matching│  │ Scanning│
│         │  │         │
│ Regex   │  │ Contains│
│ Check   │  │ Check   │
└────┬────┘  └────┬────┘
     │            │
     └──────┬─────┘
            │
            ▼
    ┌───────────────┐
    │   Confidence  │
    │   Calculation │
    │               │
    │ patterns×0.3  │
    │ + keywords×0.1│
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │    LC Score   │
    │   Deduction   │
    │               │
    │ high:   -0.15 │
    │ medium: -0.10 │
    │ low:    -0.05 │
    └───────────────┘
```

### Redundancy Detection Pipeline

```
All Arguments
    │
    ▼
┌─────────────────────┐
│  Pairwise Comparison│
│  O(n²) comparisons  │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐ ┌─────────┐
│Levenshtein│ │ Jaccard │
│  Distance │ │Similarity│
│   20%     │ │   30%   │
└─────────┘ └─────────┘
    │             │
    └──────┬──────┘
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐ ┌─────────┐
│  TF-IDF │ │  N-gram │
│  Cosine │ │ Analysis│
│   30%   │ │   20%   │
└─────────┘ └─────────┘
    │             │
    └──────┬──────┘
           │
           ▼
    ┌───────────────┐
    │  Clustering   │
    │  (Union-Find) │
    │               │
    │ Group similar │
    │  arguments    │
    └───────────────┘
```

---

## Database Schema Design

### Why MongoDB?

1. **Flexible Schema** - Arguments can have varying scores
2. **Embedded Documents** - Scores, statistics naturally nested
3. **References** - Link beliefs ↔ arguments ↔ evidence
4. **Text Search** - Built-in full-text indexing
5. **Aggregation** - Complex scoring calculations
6. **Horizontal Scaling** - Sharding for growth

### Index Strategy

```javascript
// High-frequency queries
BeliefSchema.index({ category: 1, status: 1 });
BeliefSchema.index({ trending: 1, 'statistics.views': -1 });

// Full-text search
BeliefSchema.index({ statement: 'text', description: 'text' });
EvidenceSchema.index({ title: 'text', description: 'text' });

// These improve:
// - Category filtering
// - Trending belief lookup
// - Search queries
// - Evidence discovery
```

### Document Relationships

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1:N (creates)
     │
     ▼
┌─────────┐       ┌─────────┐
│  Belief │◄─────▶│  Belief │
└────┬────┘  N:N  └─────────┘
     │     (relates)
     │ 1:N
     │ (has)
     ▼
┌─────────┐
│Argument │
└────┬────┘
     │
     │ 1:N (supports)
     │
     ▼
┌─────────┐
│Evidence │
└─────────┘
```

---

## Scalability Considerations

### Current Limitations

1. **Single Server** - No load balancing
2. **In-Memory Sessions** - Not distributed
3. **Synchronous Scoring** - Blocks on calculation
4. **No Caching** - Every request hits database

### Future Improvements

```
┌─────────────────────────────────────────────────────┐
│                    LOAD BALANCER                     │
│                    (Nginx/HAProxy)                   │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Server 1│   │ Server 2│   │ Server 3│
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                ┌─────┴─────┐
                │           │
                ▼           ▼
           ┌─────────┐ ┌─────────┐
           │  Redis  │ │ MongoDB │
           │ (Cache) │ │(Primary)│
           └─────────┘ └────┬────┘
                            │
                      ┌─────┴─────┐
                      │           │
                      ▼           ▼
                 ┌─────────┐ ┌─────────┐
                 │ MongoDB │ │ MongoDB │
                 │(Secondary)│ │(Secondary)│
                 └─────────┘ └─────────┘
```

### Planned Optimizations

1. **Redis Caching** - Cache belief scores, hot data
2. **Message Queues** - Async score recalculation
3. **CDN** - Static asset delivery
4. **Database Sharding** - Horizontal partitioning
5. **Microservices** - Separate analysis service
6. **WebSockets** - Real-time score updates

---

## Security Architecture

### Current Implementation

```
┌───────────────────────────────────────┐
│           SECURITY LAYERS             │
├───────────────────────────────────────┤
│                                       │
│  1. Input Validation (Mongoose)       │
│     - Schema constraints              │
│     - Type checking                   │
│     - Length limits                   │
│                                       │
│  2. Authentication (JWT)              │
│     - Token-based auth                │
│     - Expiration handling             │
│     - Role-based access               │
│                                       │
│  3. Password Security (bcrypt)        │
│     - Salt rounds: 10                 │
│     - Hashed storage                  │
│     - Constant-time compare           │
│                                       │
│  4. Authorization Checks              │
│     - Ownership verification          │
│     - Role-based permissions          │
│     - Resource-level access           │
│                                       │
│  5. Data Protection                   │
│     - Password field excluded         │
│     - Selective population            │
│     - Sanitized responses             │
│                                       │
└───────────────────────────────────────┘
```

### Security Best Practices

```javascript
// Password never returned
UserSchema.password.select = false;

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

// Ownership checks before mutations
if (belief.author.toString() !== req.user.id) {
  return res.status(403).json({ error: 'Not authorized' });
}

// Input validation
statement: {
  minlength: [10, 'Too short'],
  maxlength: [500, 'Too long'],
  required: true
}
```

### Future Security Enhancements

- [ ] Rate limiting (express-rate-limit)
- [ ] CSRF protection
- [ ] Content Security Policy
- [ ] SQL injection prevention (MongoDB parameterization)
- [ ] XSS prevention (sanitize-html)
- [ ] HTTPS enforcement
- [ ] Security headers (helmet.js)

---

## Error Handling

### Consistent Error Format

```javascript
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response
{
  "success": false,
  "error": "Human-readable error message",
  "message": "Technical details (optional)"
}
```

### Error Middleware

```javascript
// backend/server.js
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [ ... ]
  });
});
```

---

## Testing Strategy (Planned)

### Unit Tests

```javascript
// Test fallacy detection
describe('FallacyDetector', () => {
  it('should detect ad hominem', () => {
    const text = "You're an idiot";
    const result = detectFallacies(text);
    expect(result.hasFallacies).toBe(true);
    expect(result.fallacies[0].type).toBe('AD_HOMINEM');
  });
});

// Test score calculation
describe('BeliefModel', () => {
  it('should calculate conclusion score', () => {
    const belief = new Belief({ ... });
    belief.supportingArguments = [arg1, arg2];
    belief.opposingArguments = [arg3];
    const score = belief.calculateConclusionScore();
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

### Integration Tests

```javascript
// Test API endpoints
describe('Beliefs API', () => {
  it('should create a belief', async () => {
    const res = await request(app)
      .post('/api/beliefs')
      .set('Authorization', `Bearer ${token}`)
      .send({ statement: 'Test belief', category: 'other' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statement).toBe('Test belief');
  });
});
```

### E2E Tests

```javascript
// Test user flows
describe('User Journey', () => {
  it('should register, create belief, add argument, vote', () => {
    // Cypress or Playwright tests
    cy.visit('/register');
    cy.get('input[name=username]').type('testuser');
    // ... complete flow
  });
});
```

---

## Deployment Architecture (Planned)

### Development Environment

```
Local Machine
├─ Frontend (npm run dev) → localhost:5173
├─ Backend (npm run dev) → localhost:5000
└─ MongoDB (mongod) → localhost:27017
```

### Production Environment

```
┌─────────────────────────────────────────┐
│              Cloud Provider              │
│         (AWS/GCP/DigitalOcean)          │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         CDN (CloudFront)        │   │
│  │         Static Assets           │   │
│  └─────────────────────────────────┘   │
│                    │                    │
│  ┌─────────────────────────────────┐   │
│  │    Load Balancer (Nginx)        │   │
│  └─────────────────────────────────┘   │
│           │              │              │
│  ┌──────────────┐ ┌──────────────┐    │
│  │ App Server 1 │ │ App Server 2 │    │
│  │  (PM2/Docker)│ │  (PM2/Docker)│    │
│  └──────────────┘ └──────────────┘    │
│           │              │              │
│  ┌─────────────────────────────────┐   │
│  │    MongoDB Atlas (Managed)      │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Monitoring & Logging

### Current Logging

```javascript
// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error logging
console.error('Error:', err);
```

### Future Monitoring Stack

- **Application Performance** - New Relic / Datadog
- **Error Tracking** - Sentry
- **Log Aggregation** - ELK Stack / CloudWatch
- **Metrics** - Prometheus + Grafana
- **Uptime Monitoring** - UptimeRobot / Pingdom

---

## Summary

The Idea Stock Exchange architecture follows modern best practices:

- **Clean Separation** - Frontend, API, Database layers
- **RESTful Design** - Resource-oriented, stateless API
- **Document Database** - Flexible schema for evolving models
- **Modular Code** - Reusable components and utilities
- **Security First** - Authentication, authorization, validation
- **Scalable Foundation** - Ready for growth with planned improvements

The architecture is designed to evolve from a single-server prototype to a distributed, production-ready system while maintaining code clarity and developer productivity.

---

## Next Steps

- See [Installation Guide](Installation-Guide) to set up environment
- Review [API Reference](API-Reference) for all endpoints
- Explore [Algorithms](Algorithms) for scoring logic
- Read [Data Models](Data-Models) for schema details

---

**The architecture serves the mission: transparent, evidence-based reasoning at scale.**
