# Frontend Architecture

The Idea Stock Exchange frontend is built with Next.js 16 and React 19, using the App Router for file-based routing and modern React patterns.

---

## Technology Stack

- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library (Server Components, Suspense, Transitions)
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.1.18** - Utility-first styling
- **Zod 3.23.8** - Schema validation
- **Lucide React 0.451.0** - Icon library
- **Recharts 2.13.0** - Data visualization
- **Date-fns 4.1.0** - Date utilities
- **CLSX 2.1.1** - Conditional classnames

---

## Directory Structure

```
app/
├── layout.tsx              # Root layout (shared across pages)
├── page.tsx                # Home page (/)
├── globals.css             # Global styles
├── not-found.tsx           # 404 page
│
├── law/                    # wikiLaw pages
│   └── [id]/
│       └── page.tsx        # Law detail (/law/123)
│
├── topics/                 # Topic pages
│   ├── page.tsx            # Topics list (/topics)
│   └── [id]/
│       └── page.tsx        # Topic detail (/topics/123)
│
├── books/                  # Book analysis
│   ├── page.tsx            # Books library (/books)
│   └── [id]/
│       └── page.tsx        # Book detail (/books/123)
│
└── api/                    # API route handlers (optional)
    └── ...

components/
├── wikilaw/                # wikiLaw-specific components
│   ├── DiagnosticSection.tsx
│   ├── EvidenceCard.tsx
│   ├── AssumptionCard.tsx
│   └── MasterView.tsx
│
├── ui/                     # Generic UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Modal.tsx
│
├── debate/                 # Debate-specific components
│   ├── DebateCard.tsx
│   ├── ArgumentTree.tsx
│   └── VoteButtons.tsx
│
└── visualization/          # Charts and visualizations
    ├── AbstractionLadder.tsx
    ├── ValenceSpectrum.tsx
    └── ConfidenceScale.tsx

lib/
├── types/                  # TypeScript types
│   ├── ise-types.ts
│   └── wikilaw-types.ts
│
├── services/               # Client-side services
│   ├── api.ts              # API client
│   └── auth.ts             # Auth helpers
│
└── utils/                  # Utility functions
    ├── formatting.ts
    └── validation.ts
```

---

## Next.js App Router

### File-Based Routing

The App Router uses the filesystem for routing:

```
app/debates/page.tsx          → /debates
app/debates/[id]/page.tsx     → /debates/123
app/debates/[id]/edit/page.tsx → /debates/123/edit
```

### Layouts

Layouts wrap page content and persist across navigation:

```tsx
// app/layout.tsx
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**Nested Layouts:**
```tsx
// app/debates/layout.tsx
export default function DebatesLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="debates-container">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  );
}
```

### Page Components

```tsx
// app/debates/page.tsx
export default async function DebatesPage() {
  // Fetch data directly (Server Component)
  const debates = await fetchDebates();

  return (
    <div>
      <h1>All Debates</h1>
      {debates.map(debate => (
        <DebateCard key={debate.id} debate={debate} />
      ))}
    </div>
  );
}
```

### Dynamic Routes

```tsx
// app/debates/[id]/page.tsx
export default async function DebatePage({
  params
}: {
  params: { id: string }
}) {
  const debate = await fetchDebate(params.id);

  return (
    <div>
      <h1>{debate.thesis}</h1>
      <ArgumentTree debateId={debate.id} />
    </div>
  );
}
```

### Loading States

```tsx
// app/debates/loading.tsx
export default function Loading() {
  return <div>Loading debates...</div>;
}
```

### Error Handling

```tsx
// app/debates/error.tsx
'use client'

export default function Error({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

## React Patterns

### Server Components (Default)

Render on the server, great for data fetching:

```tsx
// Server Component (default in App Router)
async function DebatesList() {
  // Fetch directly from database or API
  const debates = await prisma.debate.findMany();

  return (
    <div>
      {debates.map(debate => (
        <DebateCard key={debate.id} debate={debate} />
      ))}
    </div>
  );
}
```

**Benefits:**
- Zero client JavaScript
- Direct database access
- SEO-friendly
- Fast initial load

### Client Components

For interactivity, use `'use client'`:

```tsx
'use client'

import { useState } from 'react';

export function VoteButtons({ argumentId }: { argumentId: string }) {
  const [votes, setVotes] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    setLoading(true);

    try {
      const response = await fetch(`/api/arguments/${argumentId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      });

      const data = await response.json();
      setVotes(data.newVoteCount.net);
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleVote('UPVOTE')}
        disabled={loading}
        className="btn btn-primary"
      >
        ⬆️ {votes > 0 ? `+${votes}` : votes}
      </button>
      <button
        onClick={() => handleVote('DOWNVOTE')}
        disabled={loading}
        className="btn btn-secondary"
      >
        ⬇️
      </button>
    </div>
  );
}
```

**Use client components for:**
- Event handlers (onClick, onChange, etc.)
- State management (useState, useReducer)
- Effects (useEffect)
- Browser APIs (localStorage, window, etc.)

### Component Composition

```tsx
// app/debates/[id]/page.tsx (Server Component)
export default async function DebatePage({ params }: { params: { id: string } }) {
  const debate = await fetchDebate(params.id);

  return (
    <div>
      <DebateHeader debate={debate} />
      {/* Client component for interactivity */}
      <VoteButtons argumentId={debate.id} />
      {/* Server component for data */}
      <ArgumentTree debateId={debate.id} />
    </div>
  );
}
```

### Suspense for Streaming

```tsx
import { Suspense } from 'react';

export default function DebatePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Debate</h1>

      {/* Show immediately */}
      <DebateHeader debateId={params.id} />

      {/* Stream in when ready */}
      <Suspense fallback={<div>Loading arguments...</div>}>
        <ArgumentTree debateId={params.id} />
      </Suspense>

      <Suspense fallback={<div>Loading comments...</div>}>
        <CommentSection debateId={params.id} />
      </Suspense>
    </div>
  );
}
```

---

## Component Library

### wikiLaw Components

#### DiagnosticSection

Displays organized lists of law issues by severity.

```tsx
// components/wikilaw/DiagnosticSection.tsx
interface DiagnosticSectionProps {
  title: string;
  severity: 'critical' | 'moderate' | 'minor';
  issues: Diagnostic[];
  expanded?: boolean;
}

export function DiagnosticSection({
  title,
  severity,
  issues,
  expanded = false
}: DiagnosticSectionProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const severityColors = {
    critical: 'bg-red-50 border-red-500',
    moderate: 'bg-yellow-50 border-yellow-500',
    minor: 'bg-green-50 border-green-500'
  };

  return (
    <div className={`border-l-4 p-4 ${severityColors[severity]}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <h3>{title} ({issues.length})</h3>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <ul className="mt-4 space-y-2">
          {issues.map(issue => (
            <li key={issue.id}>
              <strong>{issue.description}</strong>
              {issue.suggestedFix && (
                <p className="text-sm text-gray-600">
                  Fix: {issue.suggestedFix}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

#### EvidenceCard

Displays evidence with quality scoring.

```tsx
// components/wikilaw/EvidenceCard.tsx
interface EvidenceCardProps {
  evidence: Evidence;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const qualityStars = {
    PEER_REVIEWED: 5,
    STUDY: 4,
    EXPERT_OPINION: 3,
    ANECDOTE: 2,
    SPECULATION: 1
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <h4 className="font-semibold">{evidence.source}</h4>
        <div className="text-yellow-500">
          {'⭐'.repeat(qualityStars[evidence.quality])}
        </div>
      </div>

      <p className="text-sm text-gray-700 mt-2">{evidence.content}</p>

      {evidence.year && (
        <span className="text-xs text-gray-500">({evidence.year})</span>
      )}

      <div className="mt-2">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Credibility: {evidence.credibility}/10
        </span>
      </div>
    </div>
  );
}
```

#### AssumptionCard

Shows assumptions with supporting/contradicting evidence.

```tsx
// components/wikilaw/AssumptionCard.tsx
interface AssumptionCardProps {
  assumption: Assumption;
}

export function AssumptionCard({ assumption }: AssumptionCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold">{assumption.content}</h4>

      <div className="flex gap-4 mt-2 text-sm">
        <span>
          Testable: {assumption.testable ? '✅' : '❌'}
        </span>
        <span>
          Centrality: {(assumption.centrality * 100).toFixed(0)}%
        </span>
        <span>
          Quality: {assumption.evidenceQuality}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium text-green-700">Supporting Evidence</h5>
          {assumption.supportingEvidence.map((evidence, i) => (
            <EvidenceCard key={i} evidence={evidence} />
          ))}
        </div>

        <div>
          <h5 className="font-medium text-red-700">Contradicting Evidence</h5>
          {assumption.contradictingEvidence.map((evidence, i) => (
            <EvidenceCard key={i} evidence={evidence} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Debate Components

#### ArgumentTree

Hierarchical display of arguments.

```tsx
'use client'

interface ArgumentTreeProps {
  debateId: string;
}

export function ArgumentTree({ debateId }: ArgumentTreeProps) {
  const [arguments, setArguments] = useState<Argument[]>([]);

  useEffect(() => {
    fetch(`/api/debates/${debateId}`)
      .then(res => res.json())
      .then(data => setArguments(data.arguments));
  }, [debateId]);

  return (
    <div className="argument-tree">
      {arguments.map(arg => (
        <ArgumentNode key={arg.id} argument={arg} />
      ))}
    </div>
  );
}

function ArgumentNode({ argument }: { argument: Argument }) {
  return (
    <div className="ml-4 border-l-2 border-gray-300 pl-4">
      <div className="argument-content">
        <p>{argument.content}</p>
        <VoteButtons argumentId={argument.id} />
      </div>

      {argument.children && argument.children.length > 0 && (
        <div className="mt-4">
          {argument.children.map(child => (
            <ArgumentNode key={child.id} argument={child} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Styling

### Tailwind CSS

Utility-first approach for rapid development:

```tsx
<div className="max-w-4xl mx-auto p-6">
  <h1 className="text-3xl font-bold text-gray-900 mb-4">
    Debate Title
  </h1>

  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
    Create Argument
  </button>
</div>
```

### Custom Classes

Global styles in `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn {
    @apply px-4 py-2 rounded font-medium transition;
  }

  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600;
  }

  .card {
    @apply border rounded-lg p-4 shadow-sm;
  }
}
```

### Conditional Styling

Using `clsx`:

```tsx
import clsx from 'clsx';

function DebateCard({ debate, featured }: Props) {
  return (
    <div className={clsx(
      'card',
      featured && 'border-yellow-500 bg-yellow-50',
      debate.status === 'CLOSED' && 'opacity-50'
    )}>
      {/* content */}
    </div>
  );
}
```

---

## State Management

### Local State (useState)

For component-specific state:

```tsx
const [isOpen, setIsOpen] = useState(false);
```

### URL State (useSearchParams)

For shareable state:

```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation';

function DebateFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentFilter = searchParams.get('status') || 'all';

  const setFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', status);
    router.push(`?${params.toString()}`);
  };

  return (
    <select value={currentFilter} onChange={(e) => setFilter(e.target.value)}>
      <option value="all">All</option>
      <option value="open">Open</option>
      <option value="closed">Closed</option>
    </select>
  );
}
```

### Global State (Context)

For app-wide state:

```tsx
// lib/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.NodeNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Usage:**
```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// In any component
function UserProfile() {
  const { user } = useAuth();
  return <div>{user?.username}</div>;
}
```

---

## Data Fetching

### Server Components (Preferred)

```tsx
async function DebatesList() {
  const debates = await fetch('http://localhost:3001/api/debates')
    .then(res => res.json());

  return <div>{/* render debates */}</div>;
}
```

### Client Components

```tsx
'use client'

function DebatesList() {
  const [debates, setDebates] = useState([]);

  useEffect(() => {
    fetch('/api/debates')
      .then(res => res.json())
      .then(setDebates);
  }, []);

  return <div>{/* render debates */}</div>;
}
```

### With React Query (Recommended)

```tsx
'use client'

import { useQuery } from '@tanstack/react-query';

function DebatesList() {
  const { data: debates, isLoading } = useQuery({
    queryKey: ['debates'],
    queryFn: () => fetch('/api/debates').then(res => res.json())
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>{/* render debates */}</div>;
}
```

---

## Form Handling

### Basic Form

```tsx
'use client'

function CreateDebateForm() {
  const [thesis, setThesis] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('/api/debates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thesis })
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={thesis}
        onChange={(e) => setThesis(e.target.value)}
        placeholder="Enter debate thesis"
      />
      <button type="submit">Create</button>
    </form>
  );
}
```

### With Zod Validation

```tsx
import { z } from 'zod';

const DebateSchema = z.object({
  thesis: z.string().min(10).max(200),
  description: z.string().min(50),
  tags: z.array(z.string()).min(1)
});

function CreateDebateForm() {
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      thesis: e.target.thesis.value,
      description: e.target.description.value,
      tags: e.target.tags.value.split(',')
    };

    try {
      const validated = DebateSchema.parse(formData);
      await createDebate(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error.flatten().fieldErrors);
      }
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

---

## Performance Optimization

### Code Splitting

```tsx
import dynamic from 'next/dynamic';

// Lazy load component
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div>Loading chart...</div>
});
```

### Memoization

```tsx
import { useMemo, memo } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const processed = useMemo(() => {
    return data.map(/* expensive operation */);
  }, [data]);

  return <div>{processed}</div>;
});
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/debate-image.jpg"
  alt="Debate thumbnail"
  width={300}
  height={200}
  priority={false} // Lazy load
/>
```

---

## Testing

### Component Tests

```tsx
import { render, screen } from '@testing-library/react';
import { VoteButtons } from './VoteButtons';

test('renders vote buttons', () => {
  render(<VoteButtons argumentId="123" />);

  expect(screen.getByText('⬆️')).toBeInTheDocument();
  expect(screen.getByText('⬇️')).toBeInTheDocument();
});
```

---

## Resources

- [Architecture Overview](Architecture-Overview) - Overall system design
- [API Documentation](API-Documentation) - Backend endpoints
- [Getting Started](Getting-Started) - Setup instructions
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
