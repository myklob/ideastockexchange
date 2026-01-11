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
