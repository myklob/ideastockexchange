# Architecture Overview

The Idea Stock Exchange is a full-stack TypeScript application combining Next.js, React, Express.js, and PostgreSQL to create a sophisticated platform for evidence-based debate.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│         Next.js 16 + React 19 Frontend              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │   Pages    │  │ Components │  │   Hooks    │   │
│  │ App Router │  │  UI Library│  │  Services  │   │
│  └────────────┘  └────────────┘  └────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │ REST API (JSON)
┌───────────────────────▼─────────────────────────────┐
│         Express.js Backend (TypeScript)             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │   Routes   │  │  Services  │  │ Middleware │   │
│  │  (13 API)  │  │  Business  │  │ Auth/Valid │   │
│  │  Modules   │  │   Logic    │  │            │   │
│  └────────────┘  └────────────┘  └────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │ Prisma ORM
┌───────────────────────▼─────────────────────────────┐
│            PostgreSQL Database                      │
│  ┌────────────┬────────────┬────────────────────┐  │
│  │   Users    │  Debates   │    Arguments       │  │
│  │   Media    │  Comments  │    Votes          │  │
│  │40+ Tables with complex relationships         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

**Framework:**
- **Next.js 16.1.1** - React framework with App Router (file-based routing)
- **React 19.2.3** - UI library with latest features (Server Components, Actions)
- **TypeScript 5.9.3** - Type-safe development

**Styling:**
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **PostCSS** - CSS preprocessing
- **CLSX 2.1.1** - Conditional class names

**Data & Validation:**
- **Zod 3.23.8** - Schema validation for forms and API responses
- **Date-fns 4.1.0** - Date manipulation

**UI Components:**
- **Lucide React 0.451.0** - Icon library
- **Recharts 2.13.0** - Data visualization charts
- Custom component library in `/components`

### Backend

**Server:**
- **Express.js 4.18.2** - HTTP server framework
- **TypeScript 5.3.3** - Type safety
- **Node.js 20+** - Runtime environment

**Database:**
- **Prisma 5.22.0** - Modern ORM with type generation
- **PostgreSQL 14+** - Relational database
- **@prisma/client** - Auto-generated database client

**Authentication:**
- **jsonwebtoken 9.0.2** - JWT token generation/verification
- **bcryptjs 2.4.3** - Password hashing
- **Express middleware** - Custom auth middleware

**Validation & Security:**
- **Zod 3.22.4** - Request validation
- **CORS 2.8.5** - Cross-origin resource sharing
- **Helmet** - Security headers (recommended)

### Development Tools

**Build & Development:**
- **ts-node 10.9.2** - TypeScript execution
- **nodemon 3.0.2** - Auto-reload on changes
- **concurrently 8.2.2** - Run multiple processes

**Code Quality:**
- **ESLint 8.56.0** - Code linting
- **TypeScript** - Compile-time type checking
- **Prettier** (recommended) - Code formatting

**Testing:**
- **Jest** - Testing framework (configured)
- **React Testing Library** - Component testing

---

## Directory Structure

```
ideastockexchange/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # Root layout
│   ├── globals.css            # Global styles
│   ├── law/
│   │   └── [id]/
│   │       └── page.tsx       # Law detail page
│   ├── topics/
│   │   ├── page.tsx           # Topics list
│   │   └── [id]/page.tsx      # Topic detail
│   ├── books/
│   │   ├── page.tsx           # Books library
│   │   └── [id]/page.tsx      # Book analysis
│   └── api/                   # API route handlers (optional)
│
├── components/                 # React components
│   ├── wikilaw/
│   │   ├── DiagnosticSection.tsx
│   │   ├── EvidenceCard.tsx
│   │   └── AssumptionCard.tsx
│   ├── ui/                    # Generic UI components
│   └── ...
│
├── lib/                        # Shared utilities
│   ├── types/                 # TypeScript types
│   │   ├── ise-types.ts       # Core ISE types
│   │   └── wikilaw-types.ts   # wikiLaw-specific
│   ├── services/              # Business logic
│   │   ├── reasonrank.ts
│   │   └── duplicate-detection.ts
│   └── utils/                 # Helper functions
│
├── src/
│   └── server/                # Express.js backend
│       ├── index.ts           # Server entry point
│       ├── routes/            # API endpoints
│       │   ├── auth.ts        # Auth routes
│       │   ├── debates.ts     # Debate CRUD
│       │   ├── arguments.ts   # Argument operations
│       │   ├── media.ts       # Media library
│       │   ├── comments.ts    # Comment system
│       │   ├── merges.ts      # Argument merging
│       │   ├── moderation.ts  # Moderation
│       │   ├── social.ts      # Social features
│       │   ├── notifications.ts
│       │   ├── templates.ts
│       │   ├── drafts.ts
│       │   ├── users.ts
│       │   └── index.ts       # Route aggregation
│       ├── services/          # Business logic
│       │   ├── reasonrank.service.ts
│       │   ├── notification.service.ts
│       │   └── duplicate-detection.service.ts
│       ├── middleware/        # Express middleware
│       │   ├── auth.middleware.ts
│       │   ├── validation.middleware.ts
│       │   └── error.middleware.ts
│       └── utils/             # Helper functions
│
├── prisma/                    # Database
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Migration history
│   └── seed.ts               # Seed data
│
├── public/                    # Static assets
│   ├── images/
│   └── ...
│
├── docs/                      # Documentation
│   ├── algorithms.md
│   ├── architecture.md
│   └── ...
│
├── .env                       # Environment variables (not in git)
├── .env.example              # Example environment config
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── next.config.js            # Next.js config
├── tailwind.config.ts        # Tailwind config
└── README.md                 # Project overview
```

---

## Core Components

### 1. Frontend Layer (Next.js + React)

**Responsibilities:**
- User interface rendering
- Client-side routing
- Form handling and validation
- State management
- API communication

**Key Patterns:**

**Server Components (Default in Next.js 16):**
```tsx
// app/debates/page.tsx
export default async function DebatesPage() {
  // Fetch data directly on server
  const debates = await fetchDebates();

  return (
    <div>
      {debates.map(debate => (
        <DebateCard key={debate.id} debate={debate} />
      ))}
    </div>
  );
}
```

**Client Components (Interactive UI):**
```tsx
'use client'

import { useState } from 'react';

export function VoteButton({ argumentId }: Props) {
  const [votes, setVotes] = useState(0);

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    await fetch(`/api/arguments/${argumentId}/votes`, {
      method: 'POST',
      body: JSON.stringify({ voteType: type })
    });
    // Update UI
  };

  return <button onClick={() => handleVote('UPVOTE')}>⬆️</button>;
}
```

**Data Fetching:**
- Server Components: Direct database queries via API
- Client Components: `fetch()` calls to Express backend
- SWR/React Query (recommended for caching)

### 2. Backend Layer (Express.js)

**Responsibilities:**
- REST API endpoints
- Business logic execution
- Authentication & authorization
- Request validation
- Database operations via Prisma

**Route Structure:**
```typescript
// src/server/routes/arguments.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateSchema } from '../middleware/validation';
import { ArgumentSchema } from '../schemas';

const router = Router();

// Public endpoint
router.get('/', async (req, res) => {
  const arguments = await prisma.argument.findMany({
    where: { debateId: req.query.debateId },
    include: { createdBy: true, media: true }
  });
  res.json(arguments);
});

// Protected endpoint
router.post('/',
  authenticate,
  validateSchema(ArgumentSchema),
  async (req, res) => {
    const argument = await createArgument(req.body, req.user.id);
    res.status(201).json(argument);
  }
);

export default router;
```

**Service Layer Pattern:**
```typescript
// src/server/services/reasonrank.service.ts
export class ReasonRankService {
  async calculateReasonRank(argumentId: string): Promise<number> {
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      include: { votes: true, media: true }
    });

    const truthScore = argument.truthScore * 0.30;
    const importanceScore = argument.importanceScore * 0.25;
    const relevanceScore = argument.relevanceScore * 0.20;
    const voteScore = this.calculateVoteScore(argument.votes) * 0.15;
    const mediaScore = this.calculateMediaScore(argument.media) * 0.08;
    const recencyBoost = this.calculateRecencyBoost(argument.createdAt) * 0.02;

    return truthScore + importanceScore + relevanceScore +
           voteScore + mediaScore + recencyBoost;
  }

  private calculateVoteScore(votes: Vote[]): number {
    const netVotes = votes.filter(v => v.voteType === 'UPVOTE').length -
                     votes.filter(v => v.voteType === 'DOWNVOTE').length;
    // Sigmoid normalization to 0-10 scale
    return 10 / (1 + Math.exp(-netVotes / 10));
  }

  // ... other methods
}
```

### 3. Database Layer (PostgreSQL + Prisma)

**Responsibilities:**
- Data persistence
- Relationship management
- Query optimization
- Transaction handling

**Prisma Schema Example:**
```prisma
model Argument {
  id              String   @id @default(uuid())
  debateId        String
  parentId        String?
  content         String   @db.Text
  position        Position

  // Scores
  truthScore      Float    @default(5.0)
  importanceScore Float    @default(5.0)
  relevanceScore  Float    @default(5.0)
  reasonRank      Float    @default(5.0)

  // Relationships
  debate          Debate   @relation(fields: [debateId], references: [id])
  parent          Argument?  @relation("ArgumentTree", fields: [parentId], references: [id])
  children        Argument[] @relation("ArgumentTree")
  createdBy       User     @relation(fields: [createdById], references: [id])
  votes           Vote[]
  comments        Comment[]
  media           ArgumentMedia[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([debateId, reasonRank(sort: Desc)])
  @@index([parentId])
}
```

**Query Examples:**
```typescript
// Get argument tree
const argumentTree = await prisma.argument.findUnique({
  where: { id: argumentId },
  include: {
    children: {
      include: {
        children: true, // Nested children
        votes: true,
        media: true
      }
    },
    media: {
      include: { media: true } // Join through ArgumentMedia
    }
  }
});

// Efficient pagination
const debates = await prisma.debate.findMany({
  where: { status: 'OPEN' },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
  include: {
    _count: {
      select: { arguments: true, subscribers: true }
    }
  }
});
```

---

## Design Patterns

### 1. Repository Pattern

Abstracts database access:

```typescript
// lib/repositories/debate.repository.ts
export class DebateRepository {
  async findById(id: string): Promise<Debate | null> {
    return prisma.debate.findUnique({ where: { id } });
  }

  async findAll(filter: DebateFilter): Promise<Debate[]> {
    return prisma.debate.findMany({
      where: this.buildWhereClause(filter),
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: CreateDebateDto): Promise<Debate> {
    return prisma.debate.create({ data });
  }

  // ... other methods
}
```

### 2. Service Layer Pattern

Business logic separation:

```typescript
// src/server/services/debate.service.ts
export class DebateService {
  constructor(
    private debateRepo: DebateRepository,
    private notificationService: NotificationService
  ) {}

  async createDebate(data: CreateDebateDto, userId: string): Promise<Debate> {
    const debate = await this.debateRepo.create({
      ...data,
      createdById: userId
    });

    // Business logic: notify followers
    await this.notificationService.notifyFollowers(userId, {
      type: 'NEW_DEBATE',
      debateId: debate.id
    });

    return debate;
  }
}
```

### 3. Middleware Pattern

Cross-cutting concerns:

```typescript
// src/server/middleware/auth.middleware.ts
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 4. Factory Pattern

Complex object creation:

```typescript
// lib/factories/notification.factory.ts
export class NotificationFactory {
  static createArgumentNotification(argument: Argument): Notification {
    return {
      type: 'NEW_ARGUMENT',
      title: 'New argument in your debate',
      message: `${argument.createdBy.username} posted a ${argument.position} argument`,
      link: `/debates/${argument.debateId}/arguments/${argument.id}`
    };
  }

  static createVoteNotification(vote: Vote): Notification {
    return {
      type: 'VOTE_RECEIVED',
      title: 'Someone voted on your argument',
      message: `You received a ${vote.voteType}`,
      link: `/arguments/${vote.argumentId}`
    };
  }
}
```

---

## Data Flow

### Typical Request Flow

**User creates an argument:**

```
1. User submits form → Client-side validation (Zod)
                    ↓
2. POST /api/arguments → Express route handler
                    ↓
3. Auth middleware → Verify JWT token
                    ↓
4. Validation middleware → Validate request body (Zod)
                    ↓
5. Route handler → Call ArgumentService.createArgument()
                    ↓
6. Service layer → Business logic
   - Duplicate detection
   - ReasonRank calculation
   - Notification dispatch
                    ↓
7. Prisma → INSERT INTO arguments
                    ↓
8. Response → 201 Created with argument data
                    ↓
9. Frontend → Update UI, show success message
```

### Real-time Features

**Current:** Polling for updates

**Future:** WebSocket integration for:
- Live vote updates
- Real-time notifications
- Collaborative editing

---

## Type System

### Core ISE Types

```typescript
// lib/types/ise-types.ts

export interface Evidence {
  content: string;
  quality: EvidenceQuality;
  source: string;
  year?: number;
  credibility: number; // 0-10
  url?: string;
}

export interface Assumption {
  content: string;
  testable: boolean;
  centrality: number; // 0-1, how critical
  evidenceQuality: EvidenceQuality;
  supportingEvidence: Evidence[];
  contradictingEvidence: Evidence[];
}

export interface Interest {
  stakeholder: string;
  impact: 'BENEFIT' | 'HARM' | 'MIXED';
  magnitude: number; // -10 to 10
  evidence: Evidence[];
}

export interface LinkageScore {
  relevance: number; // 0-10
  strength: number; // 0-10
  confidence: number; // 0-1
}

export enum EvidenceQuality {
  PEER_REVIEWED = 'PEER_REVIEWED',
  STUDY = 'STUDY',
  EXPERT_OPINION = 'EXPERT_OPINION',
  ANECDOTE = 'ANECDOTE',
  SPECULATION = 'SPECULATION'
}

export enum Position {
  PRO = 'PRO',
  CON = 'CON',
  NEUTRAL = 'NEUTRAL'
}
```

### Database-Generated Types

Prisma automatically generates types from schema:

```typescript
// node_modules/.prisma/client/index.d.ts
export type Argument = {
  id: string;
  debateId: string;
  parentId: string | null;
  content: string;
  position: Position;
  truthScore: number;
  importanceScore: number;
  relevanceScore: number;
  reasonRank: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Security

### Authentication

**JWT-based authentication:**
1. User logs in with email/password
2. Server verifies credentials, generates JWT
3. Client stores token (localStorage or httpOnly cookie)
4. Client sends token in Authorization header
5. Server validates token on protected routes

### Authorization

**Role-based access control:**
- `USER` - Basic permissions
- `MODERATOR` - Content moderation
- `ADMIN` - Full system access

**Resource ownership:**
```typescript
// Check if user owns resource
if (argument.createdById !== req.user.id && req.user.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Input Validation

**Zod schemas:**
```typescript
const CreateArgumentSchema = z.object({
  debateId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().min(10).max(5000),
  position: z.enum(['PRO', 'CON', 'NEUTRAL']),
  truthScore: z.number().min(0).max(10),
  importanceScore: z.number().min(0).max(10),
  relevanceScore: z.number().min(0).max(10)
});
```

### SQL Injection Prevention

Prisma ORM parameterizes all queries automatically:
```typescript
// Safe - Prisma handles parameterization
await prisma.argument.findMany({
  where: { content: { contains: userInput } }
});
```

### XSS Prevention

React automatically escapes content:
```tsx
// Safe - React escapes HTML
<div>{userContent}</div>

// Dangerous - only use for trusted content
<div dangerouslySetInnerHTML={{ __html: trustedHTML }} />
```

---

## Performance Optimization

### Database Optimization

**Indexes:**
```prisma
@@index([debateId, reasonRank(sort: Desc)])
@@index([createdAt(sort: Desc)])
```

**Query optimization:**
- Use `select` to fetch only needed fields
- Use `include` strategically (avoid over-fetching)
- Implement pagination
- Use database views for complex queries

### Caching Strategy

**Recommended:**
1. **Redis** for session storage and frequently accessed data
2. **CDN** for static assets
3. **React Query/SWR** for client-side caching
4. **Materialized views** for complex aggregations

### Frontend Optimization

- **Code splitting:** Dynamic imports for large components
- **Image optimization:** Next.js Image component
- **Lazy loading:** Load content as user scrolls
- **Memoization:** React.memo, useMemo, useCallback

---

## Error Handling

### Centralized Error Handling

```typescript
// src/server/middleware/error.middleware.ts
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof PrismaClientKnownRequestError) {
    // Handle Prisma errors
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Duplicate entry' });
    }
  }

  if (err instanceof ZodError) {
    // Handle validation errors
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors
    });
  }

  res.status(500).json({ error: 'Internal server error' });
};
```

---

## Testing Strategy

### Unit Tests

Test individual functions and components:

```typescript
// __tests__/services/reasonrank.test.ts
describe('ReasonRankService', () => {
  it('calculates correct score', () => {
    const service = new ReasonRankService();
    const score = service.calculateReasonRank(mockArgument);
    expect(score).toBeCloseTo(7.5, 1);
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
// __tests__/api/arguments.test.ts
describe('POST /api/arguments', () => {
  it('creates argument with valid data', async () => {
    const response = await request(app)
      .post('/api/arguments')
      .set('Authorization', `Bearer ${token}`)
      .send(validArgumentData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### E2E Tests

Test user workflows (recommended: Playwright or Cypress).

---

## Deployment Architecture

**Production recommendation:**

```
Internet
   │
   ▼
Load Balancer (NGINX/CloudFlare)
   │
   ├─► Next.js Frontend (Vercel/CloudFront)
   │
   ├─► Express Backend (Docker/K8s)
   │       │
   │       ▼
   │   PostgreSQL (AWS RDS/Supabase)
   │
   └─► Redis Cache (ElastiCache)
```

See [Deployment Guide](Deployment-Guide) for details.

---

## Scalability Considerations

### Current Limitations

- Single server deployment
- Synchronous request handling
- No caching layer
- Full argument trees loaded at once

### Future Improvements

1. **Horizontal scaling:** Load balancer + multiple backend instances
2. **Database replication:** Read replicas for queries
3. **Message queue:** Background jobs (RabbitMQ/Bull)
4. **GraphQL:** Flexible data fetching
5. **Microservices:** Split into domain-specific services

---

## Monitoring & Observability

**Recommended tools:**
- **Application monitoring:** New Relic, Datadog
- **Error tracking:** Sentry
- **Logging:** Winston, Pino
- **Analytics:** Plausible, PostHog

---

For more details:
- [Database Schema](Database-Schema) - Data models
- [API Documentation](API-Documentation) - Endpoints
- [Frontend Architecture](Frontend-Architecture) - React components
- [Getting Started](Getting-Started) - Local setup
