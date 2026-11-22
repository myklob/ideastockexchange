# Frontend Components

Documentation for the React frontend architecture, components, and user interface implementation.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library with hooks |
| Vite | 4.x | Build tool and dev server |
| React Router | 6.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first styling |
| Lucide React | Latest | Icon library |
| Axios | 1.x | HTTP client |

---

## Project Structure

```
frontend/src/
├── index.js              # Entry point
├── app.js                # Root component with routing
├── context/
│   └── AuthContext.js    # Authentication state management
├── services/
│   └── api.js            # API communication layer
├── pages/
│   ├── BeliefsList.jsx   # Main beliefs listing page
│   ├── BeliefDetails.jsx # Single belief view with arguments
│   └── AddArgument.jsx   # Argument creation form
└── components/
    ├── Auth/
    │   ├── LoginForm.js       # User login
    │   └── RegisterForm.js    # User registration
    ├── Beliefs/
    │   ├── BeliefCard.jsx     # Belief preview card
    │   ├── BeliefForm.js      # Create/edit belief
    │   ├── BeliefFilters.jsx  # Category and search filters
    │   ├── SearchBar.jsx      # Text search input
    │   └── ScoreBreakdown.jsx # Score visualization
    ├── Arguments/
    │   └── ArgumentCard.jsx   # Argument display with voting
    ├── Evidence/
    │   └── EvidenceForm.jsx   # Evidence submission
    └── ReasonRankTemplate.js  # Algorithm visualization
```

---

## State Management

### Authentication Context

**Location:** `frontend/src/context/AuthContext.js`

```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Fetch user data from API
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const register = async (username, email, password) => {
    const response = await authAPI.register({ username, email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      register,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**Usage in components:**
```javascript
const { user, login, logout, isAuthenticated } = useAuth();

if (!isAuthenticated) {
  return <LoginForm />;
}
```

---

## API Service Layer

**Location:** `frontend/src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Beliefs API
export const beliefAPI = {
  getAll: (params) => api.get('/beliefs', { params }),
  getById: (id) => api.get(`/beliefs/${id}`),
  create: (data) => api.post('/beliefs', data),
  update: (id, data) => api.put(`/beliefs/${id}`, data),
  delete: (id) => api.delete(`/beliefs/${id}`),
  getArguments: (id) => api.get(`/beliefs/${id}/arguments`),
  incrementViews: (id) => api.post(`/beliefs/${id}/increment-views`),
};

// Arguments API
export const argumentAPI = {
  create: (data) => api.post('/arguments', data),
  update: (id, data) => api.put(`/arguments/${id}`, data),
  delete: (id) => api.delete(`/arguments/${id}`),
  vote: (id, vote) => api.post(`/arguments/${id}/vote`, { vote }),
};

// Evidence API
export const evidenceAPI = {
  getAll: () => api.get('/evidence'),
  create: (data) => api.post('/evidence', data),
  verify: (id, data) => api.post(`/evidence/${id}/verify`, data),
};

// Analysis API
export const analysisAPI = {
  detectFallacies: (text) => api.post('/analysis/fallacies', { text }),
  getRedundancy: (beliefId) => api.post('/analysis/redundancy', { beliefId }),
  getUniqueness: (argumentId) => api.post('/analysis/uniqueness', { argumentId }),
  fullAnalysis: (beliefId) => api.post(`/analysis/belief/${beliefId}/full-analysis`),
};

export default api;
```

---

## Pages

### BeliefsList Page

**Location:** `frontend/src/pages/BeliefsList.jsx`

Main landing page showing all beliefs with filtering and search.

```jsx
const BeliefsList = () => {
  const [beliefs, setBeliefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    trending: false
  });

  useEffect(() => {
    fetchBeliefs();
  }, [filters]);

  const fetchBeliefs = async () => {
    const response = await beliefAPI.getAll(filters);
    setBeliefs(response.data.data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Beliefs</h1>

        <SearchBar onSearch={(query) => setFilters({...filters, search: query})} />

        <BeliefFilters
          filters={filters}
          onChange={setFilters}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beliefs.map(belief => (
            <BeliefCard key={belief._id} belief={belief} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Features:**
- Grid layout for belief cards
- Category filtering
- Full-text search
- Pagination
- Trending filter
- Responsive design

---

### BeliefDetails Page

**Location:** `frontend/src/pages/BeliefDetails.jsx`

Detailed view of a single belief with all arguments.

**UI Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Beliefs                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │      MAIN CONTENT       │  │     SIDEBAR         │  │
│  │                         │  │                     │  │
│  │  ┌───────────────────┐  │  │  Score Breakdown    │  │
│  │  │   Belief Header   │  │  │  ┌───────────────┐  │  │
│  │  │   Statement       │  │  │  │  CS: 67       │  │  │
│  │  │   Category/Tags   │  │  │  │  ES: 85       │  │  │
│  │  │   Author/Date     │  │  │  │  LC: 92       │  │  │
│  │  └───────────────────┘  │  │  │  VC: 75       │  │  │
│  │                         │  │  │  ...          │  │  │
│  │  ┌───────────────────┐  │  │  └───────────────┘  │  │
│  │  │    Arguments      │  │  │                     │  │
│  │  │   [All] [Pro] [Con]│  │  │  Related Beliefs  │  │
│  │  │   + Add Argument  │  │  │  ┌───────────────┐  │  │
│  │  │                   │  │  │  │ Belief 2      │  │  │
│  │  │  ┌─────────────┐  │  │  │  │ [supports]    │  │  │
│  │  │  │  Arg Card 1 │  │  │  │  └───────────────┘  │  │
│  │  │  │  ✓ Support  │  │  │  │                     │  │
│  │  │  │  Score: 85  │  │  │  └─────────────────────┘  │
│  │  │  │  👍 45 👎 3 │  │  │                         │
│  │  │  └─────────────┘  │  │                         │
│  │  │                   │  │                         │
│  │  │  ┌─────────────┐  │  │                         │
│  │  │  │  Arg Card 2 │  │  │                         │
│  │  │  │  ✗ Oppose   │  │  │                         │
│  │  │  │  Score: 62  │  │  │                         │
│  │  │  └─────────────┘  │  │                         │
│  │  └───────────────────┘  │                         │
│  └─────────────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**
```jsx
// Tab navigation for arguments
const [activeTab, setActiveTab] = useState('all'); // all, supporting, opposing

const filteredArguments = () => {
  if (activeTab === 'supporting') return arguments.supporting;
  if (activeTab === 'opposing') return arguments.opposing;
  return [...arguments.supporting, ...arguments.opposing];
};

// Tab buttons
<button
  onClick={() => setActiveTab('all')}
  className={activeTab === 'all' ? 'border-blue-600' : 'border-transparent'}
>
  All ({totalArgs})
</button>
<button
  onClick={() => setActiveTab('supporting')}
  className={activeTab === 'supporting' ? 'border-green-600' : 'border-transparent'}
>
  Supporting ({supportingCount})
</button>
<button
  onClick={() => setActiveTab('opposing')}
  className={activeTab === 'opposing' ? 'border-red-600' : 'border-transparent'}
>
  Opposing ({opposingCount})
</button>
```

---

### AddArgument Page

**Location:** `frontend/src/pages/AddArgument.jsx`

Form for creating new arguments with validation.

**Features:**
- Type selector (Supporting/Opposing)
- Rich textarea with character counter
- Real-time validation (10-2000 chars)
- Quality guidelines
- Evidence attachment (optional)

```jsx
const AddArgument = () => {
  const { id: beliefId } = useParams();
  const [formData, setFormData] = useState({
    content: '',
    type: 'supporting',
    evidence: []
  });
  const [charCount, setCharCount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await argumentAPI.create({
      ...formData,
      beliefId
    });
    navigate(`/beliefs/${beliefId}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Type Selector */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setFormData({...formData, type: 'supporting'})}
          className={formData.type === 'supporting' ? 'bg-green-500' : 'bg-gray-200'}
        >
          ✓ Supporting
        </button>
        <button
          type="button"
          onClick={() => setFormData({...formData, type: 'opposing'})}
          className={formData.type === 'opposing' ? 'bg-red-500' : 'bg-gray-200'}
        >
          ✗ Opposing
        </button>
      </div>

      {/* Content Textarea */}
      <textarea
        value={formData.content}
        onChange={(e) => {
          setFormData({...formData, content: e.target.value});
          setCharCount(e.target.value.length);
        }}
        minLength={10}
        maxLength={2000}
        className="w-full h-40 border rounded p-3"
        placeholder="Enter your argument..."
      />

      {/* Character Counter */}
      <div className={charCount < 10 ? 'text-red-500' : 'text-gray-500'}>
        {charCount}/2000 characters (min: 10)
      </div>

      <button type="submit" disabled={charCount < 10}>
        Submit Argument
      </button>
    </form>
  );
};
```

---

## Components

### BeliefCard

**Location:** `frontend/src/components/Beliefs/BeliefCard.jsx`

Preview card for belief list view.

```jsx
const BeliefCard = ({ belief }) => {
  const getCategoryColor = (category) => {
    const colors = {
      politics: 'bg-blue-100 text-blue-800',
      science: 'bg-purple-100 text-purple-800',
      technology: 'bg-indigo-100 text-indigo-800',
      philosophy: 'bg-pink-100 text-pink-800',
      economics: 'bg-green-100 text-green-800',
      social: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  return (
    <Link to={`/beliefs/${belief._id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        {/* Category Badge */}
        <span className={`px-3 py-1 text-sm rounded-full ${getCategoryColor(belief.category)}`}>
          {belief.category}
        </span>

        {/* Statement */}
        <h3 className="text-xl font-bold mt-3">{belief.statement}</h3>

        {/* Score Display */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-3xl font-bold text-blue-600">
            {belief.conclusionScore}
          </div>
          <div className="text-sm text-gray-500">
            {belief.statistics.totalArguments} arguments
          </div>
        </div>

        {/* Trending Badge */}
        {belief.trending && (
          <span className="text-orange-600">
            🔥 Trending
          </span>
        )}
      </div>
    </Link>
  );
};
```

---

### ArgumentCard

**Location:** `frontend/src/components/Arguments/ArgumentCard.jsx`

Displays individual argument with voting and scores.

**Visual Structure:**
```
┌────────────────────────────────────────────────────┐
│ ✓ Supporting                              Score: 85│
├────────────────────────────────────────────────────┤
│                                                    │
│ "Multiple studies show that UBI pilots have       │
│ reduced poverty rates by 15-20% in test regions"  │
│                                                    │
│ by researcher1 · 📎 3 evidence                    │
├────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Logical:75│ │Linkage:85│ │Import:70 │          │
│  └──────────┘ └──────────┘ └──────────┘          │
├────────────────────────────────────────────────────┤
│  👍 45   👎 3          ReasonRank: 0.125          │
└────────────────────────────────────────────────────┘
```

**Key Features:**

```jsx
const ArgumentCard = ({ argument, onVote, depth = 0 }) => {
  const [voting, setVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState(argument.votes);

  const handleVote = async (voteType) => {
    setVoting(true);
    await argumentAPI.vote(argument._id, voteType);

    // Optimistic UI update
    setLocalVotes(prev => ({
      up: voteType === 'up' ? prev.up + 1 : prev.up,
      down: voteType === 'down' ? prev.down + 1 : prev.down
    }));

    if (onVote) onVote(argument._id, voteType);
    setVoting(false);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`border-2 ${
      argument.type === 'supporting' ? 'border-green-200' : 'border-red-200'
    } rounded-lg p-4`}>

      {/* Type Badge */}
      <span className={argument.type === 'supporting'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
      }>
        {argument.type === 'supporting' ? '✓ Supporting' : '✗ Opposing'}
      </span>

      {/* Content */}
      <p className="text-gray-800 mt-2">{argument.content}</p>

      {/* Sub-scores Grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-semibold">{argument.scores.logical}</div>
          <div className="text-xs text-gray-500">Logical</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-semibold">{argument.scores.linkage}</div>
          <div className="text-xs text-gray-500">Linkage</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-semibold">{argument.scores.importance}</div>
          <div className="text-xs text-gray-500">Importance</div>
        </div>
      </div>

      {/* Voting Buttons */}
      <div className="flex items-center mt-4">
        <button
          onClick={() => handleVote('up')}
          disabled={voting}
          className="text-green-600 hover:bg-green-50 px-3 py-1 rounded"
        >
          👍 {localVotes.up}
        </button>
        <button
          onClick={() => handleVote('down')}
          disabled={voting}
          className="text-red-600 hover:bg-red-50 px-3 py-1 rounded ml-2"
        >
          👎 {localVotes.down}
        </button>
      </div>
    </div>
  );
};
```

---

### ScoreBreakdown

**Location:** `frontend/src/components/Beliefs/ScoreBreakdown.jsx`

Visualizes the 6-component scoring system with progress bars.

```jsx
const ScoreBreakdown = ({ belief, arguments: args = [] }) => {
  const calculateComponentScores = () => {
    if (!args || args.length === 0) {
      return { ES: 50, LC: 50, VC: 50, LR: 50, UD: 50, AI: 50 };
    }

    const avgScore = (field) => {
      const scores = args.map(arg => arg.scores?.[field] || 0.5);
      return (scores.reduce((a, b) => a + b, 0) / scores.length) * 100;
    };

    return {
      ES: avgScore('evidenceStrength'),
      LC: avgScore('logicalCoherence'),
      VC: avgScore('verificationCredibility'),
      LR: avgScore('linkageRelevance'),
      UD: avgScore('uniqueness'),
      AI: avgScore('argumentImportance')
    };
  };

  const scores = calculateComponentScores();

  const components = [
    { key: 'ES', label: 'Evidence Strength', value: scores.ES,
      description: 'Quality and credibility of supporting evidence' },
    { key: 'LC', label: 'Logical Coherence', value: scores.LC,
      description: 'Absence of logical fallacies and sound reasoning' },
    // ... other components
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Score Breakdown</h2>

      {/* Main Score */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold">Conclusion Score</h3>
        <div className="text-6xl font-bold text-blue-600">
          {Math.round(belief.conclusionScore)}
        </div>
        <div className="mt-4 font-mono text-sm bg-white p-3 rounded">
          CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)
        </div>
      </div>

      {/* Component Progress Bars */}
      <div className="space-y-4 mt-6">
        {components.map(component => (
          <div key={component.key}>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">{component.label}</span>
              <span className="font-bold">{Math.round(component.value)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-full rounded-full ${
                  component.value >= 70 ? 'bg-green-500'
                  : component.value >= 40 ? 'bg-yellow-500'
                  : 'bg-red-500'
                }`}
                style={{ width: `${component.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {belief.statistics.supportingCount}
          </div>
          <div className="text-sm">Supporting</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {belief.statistics.opposingCount}
          </div>
          <div className="text-sm">Opposing</div>
        </div>
      </div>
    </div>
  );
};
```

---

### EvidenceForm

**Location:** `frontend/src/components/Evidence/EvidenceForm.jsx`

Form for submitting evidence with metadata.

**Fields:**
- Title (required)
- Description
- Type selector (8 types)
- Source information (URL, author, publication, date)
- Scholarly metadata (DOI, ISBN, PMID, citations)
- Tags

```jsx
const EvidenceForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article',
    source: { url: '', author: '', publication: '', date: '' },
    metadata: { doi: '', isbn: '', pmid: '', citations: 0 },
    tags: []
  });

  const evidenceTypes = [
    { value: 'study', label: '📊 Study' },
    { value: 'article', label: '📰 Article' },
    { value: 'book', label: '📚 Book' },
    { value: 'video', label: '🎥 Video' },
    { value: 'image', label: '🖼️ Image' },
    { value: 'data', label: '📈 Data' },
    { value: 'expert-opinion', label: '👤 Expert Opinion' },
    { value: 'other', label: '📎 Other' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Evidence Title"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
        maxLength={200}
      />

      <select
        value={formData.type}
        onChange={(e) => setFormData({...formData, type: e.target.value})}
      >
        {evidenceTypes.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {/* Source Information */}
      <fieldset>
        <legend>Source Details</legend>
        <input type="url" placeholder="URL" />
        <input type="text" placeholder="Author" />
        <input type="text" placeholder="Publication" />
        <input type="date" placeholder="Date" />
      </fieldset>

      {/* Scholarly Metadata */}
      <fieldset>
        <legend>Academic Metadata (Optional)</legend>
        <input type="text" placeholder="DOI" />
        <input type="text" placeholder="ISBN" />
        <input type="text" placeholder="PubMed ID" />
        <input type="number" placeholder="Citation Count" />
      </fieldset>

      <button type="submit">Submit Evidence</button>
    </form>
  );
};
```

---

## Styling with Tailwind

The project uses Tailwind CSS utility classes for consistent styling:

### Color Palette

```css
/* Score Colors */
Green (≥70): bg-green-500, text-green-600
Yellow (40-69): bg-yellow-500, text-yellow-600
Red (<40): bg-red-500, text-red-600

/* Category Colors */
Politics: bg-blue-100 text-blue-800
Science: bg-purple-100 text-purple-800
Technology: bg-indigo-100 text-indigo-800
Philosophy: bg-pink-100 text-pink-800
Economics: bg-green-100 text-green-800
Social: bg-orange-100 text-orange-800
```

### Common Patterns

```jsx
// Card
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">

// Button - Primary
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">

// Button - Danger
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">

// Input Field
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">

// Badge
<span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">

// Grid Layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## Routing

**Location:** `frontend/src/app.js`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BeliefsList />} />
        <Route path="/beliefs" element={<BeliefsList />} />
        <Route path="/beliefs/:id" element={<BeliefDetails />} />
        <Route path="/beliefs/:id/add-argument" element={<AddArgument />} />
        <Route path="/beliefs/new" element={<BeliefForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
```

---

## Performance Optimizations

1. **Optimistic UI Updates** - Vote counts update immediately before API confirmation
2. **Lazy Loading** - Components load on-demand
3. **Memoization** - Heavy calculations cached with useMemo
4. **Debounced Search** - Search queries delayed to reduce API calls
5. **Pagination** - Large lists loaded in chunks

---

## Future Enhancements

- [ ] Dark mode support
- [ ] Real-time updates with WebSockets
- [ ] Advanced visualizations (D3.js graphs)
- [ ] Offline support with service workers
- [ ] Internationalization (i18n)
- [ ] Accessibility improvements (ARIA)
- [ ] Mobile app (React Native)

---

## Next Steps

- Review [API Reference](API-Reference) for backend integration
- Learn about [Algorithms](Algorithms) that power the scores
- See [Core Concepts](Core-Concepts) for domain understanding

---

**Note:** The frontend is continuously evolving. Check the source code for the latest component implementations.
