# Data Models

This page documents the complete MongoDB schemas used in the Idea Stock Exchange, including all fields, validation rules, and methods.

---

## Entity Relationship Diagram

```
┌─────────────┐     creates      ┌─────────────┐
│    USER     │─────────────────▶│   BELIEF    │
│             │                  │             │
│ • username  │     creates      │ • statement │
│ • email     │─────────┐        │ • category  │
│ • password  │         │        │ • score     │
│ • role      │         │        └──────┬──────┘
│ • reputation│         │               │
└─────┬───────┘         │        has many
      │                 │               │
      │ votes           ▼               ▼
      │          ┌─────────────┐  ┌─────────────┐
      └─────────▶│  ARGUMENT   │◀─│  ARGUMENT   │
                 │             │  │ (supporting)│
      verifies   │ • content   │  └─────────────┘
      ┌─────────▶│ • type      │
      │          │ • scores    │  ┌─────────────┐
      │          │ • votes     │◀─│  ARGUMENT   │
      │          └──────┬──────┘  │ (opposing)  │
      │                 │         └─────────────┘
      │          supports
      │                 │
      │                 ▼
┌─────┴───────┐  ┌─────────────┐
│  EVIDENCE   │◀─│  EVIDENCE   │
│             │  │             │
│ • title     │  └─────────────┘
│ • type      │
│ • source    │
│ • credScore │
└─────────────┘
```

---

## User Model

**Location:** `backend/models/User.js`

### Schema Definition

```javascript
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Don't return by default in queries
  },

  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },

  reputation: {
    type: Number,
    default: 0
  },

  createdBeliefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief'
  }],

  createdArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],

  votedArguments: [{
    argumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument'
    },
    vote: {
      type: String,
      enum: ['up', 'down']
    }
  }]
}, { timestamps: true });
```

### Instance Methods

```javascript
// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get safe public profile (no password)
UserSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    reputation: this.reputation,
    role: this.role,
    createdAt: this.createdAt
  };
};
```

### Validation Rules

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| username | String | Yes | 3-50 chars, unique, trimmed |
| email | String | Yes | Valid email format, unique, lowercase |
| password | String | Yes | Min 6 chars, hashed with bcrypt |
| role | String | No | One of: user, moderator, admin |
| reputation | Number | No | Default: 0 |

---

## Belief Model

**Location:** `backend/models/Belief.js`

### Schema Definition

```javascript
const BeliefSchema = new mongoose.Schema({
  statement: {
    type: String,
    required: [true, 'Please provide a belief statement'],
    trim: true,
    minlength: [10, 'Statement must be at least 10 characters'],
    maxlength: [500, 'Statement cannot exceed 500 characters'],
    unique: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  category: {
    type: String,
    enum: ['politics', 'science', 'technology', 'philosophy',
           'economics', 'social', 'other'],
    default: 'other'
  },

  tags: [{
    type: String,
    trim: true
  }],

  conclusionScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },

  supportingArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],

  opposingArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],

  relatedBeliefs: [{
    beliefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Belief'
    },
    relationship: {
      type: String,
      enum: ['supports', 'opposes', 'related']
    },
    linkageStrength: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    }
  }],

  statistics: {
    views: { type: Number, default: 0 },
    supportingCount: { type: Number, default: 0 },
    opposingCount: { type: Number, default: 0 },
    totalArguments: { type: Number, default: 0 }
  },

  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'flagged'],
    default: 'active'
  },

  trending: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });
```

### Instance Methods

```javascript
// Calculate conclusion score from arguments
BeliefSchema.methods.calculateConclusionScore = async function() {
  await this.populate(['supportingArguments', 'opposingArguments']);

  const supportingScore = this.supportingArguments.reduce((sum, arg) => {
    return sum + (arg.scores.overall || 50);
  }, 0);

  const opposingScore = this.opposingArguments.reduce((sum, arg) => {
    return sum + (arg.scores.overall || 50);
  }, 0);

  const supportingAvg = this.supportingArguments.length > 0
    ? supportingScore / this.supportingArguments.length
    : 50;

  const opposingAvg = this.opposingArguments.length > 0
    ? opposingScore / this.opposingArguments.length
    : 50;

  const totalArgs = this.supportingArguments.length + this.opposingArguments.length;

  if (totalArgs === 0) {
    this.conclusionScore = 50;
  } else {
    const supportWeight = this.supportingArguments.length / totalArgs;
    const opposeWeight = this.opposingArguments.length / totalArgs;

    this.conclusionScore = Math.round(
      (supportingAvg * supportWeight + (100 - opposingAvg) * opposeWeight)
    );
  }

  return this.conclusionScore;
};

// Update statistics counters
BeliefSchema.methods.updateStatistics = function() {
  this.statistics.supportingCount = this.supportingArguments.length;
  this.statistics.opposingCount = this.opposingArguments.length;
  this.statistics.totalArguments =
    this.supportingArguments.length + this.opposingArguments.length;
  return this.save();
};

// Increment view count
BeliefSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};
```

### Indexes

```javascript
// Full-text search on statement and description
BeliefSchema.index({ statement: 'text', description: 'text' });

// Query optimization
BeliefSchema.index({ category: 1, status: 1 });
BeliefSchema.index({ trending: 1, 'statistics.views': -1 });
```

---

## Argument Model

**Location:** `backend/models/Argument.js`

### Schema Definition

```javascript
const ArgumentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide argument content'],
    trim: true,
    minlength: [10, 'Argument must be at least 10 characters'],
    maxlength: [2000, 'Argument cannot exceed 2000 characters']
  },

  type: {
    type: String,
    enum: ['supporting', 'opposing'],
    required: [true, 'Please specify argument type']
  },

  beliefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  scores: {
    // Overall score (average of logical, linkage, importance)
    overall: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    logical: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    linkage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    importance: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },

    // Multiplicative factors (0-1 scale)
    evidenceStrength: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    logicalCoherence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    verificationCredibility: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    linkageRelevance: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    uniqueness: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    argumentImportance: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    }
  },

  evidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence'
  }],

  subArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],

  parentArgument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  },

  votes: {
    up: { type: Number, default: 0 },
    down: { type: Number, default: 0 }
  },

  reasonRankScore: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['active', 'flagged', 'removed'],
    default: 'active'
  }
}, { timestamps: true });
```

### Instance Methods

```javascript
// Calculate overall score from sub-scores
ArgumentSchema.methods.calculateOverallScore = function() {
  const { logical, linkage, importance } = this.scores;
  this.scores.overall = Math.round((logical + linkage + importance) / 3);
  return this.scores.overall;
};

// Update ReasonRank score
ArgumentSchema.methods.updateReasonRankScore = function(score) {
  this.reasonRankScore = score;
  return this.save();
};
```

### Score Components Explained

| Score | Range | Meaning |
|-------|-------|---------|
| **overall** | 0-100 | Average quality score |
| **logical** | 0-100 | Soundness of reasoning |
| **linkage** | 0-100 | Relevance to belief |
| **importance** | 0-100 | Real-world significance |
| **evidenceStrength** | 0-1 | Quality of supporting evidence |
| **logicalCoherence** | 0-1 | Absence of fallacies (reduced by detector) |
| **verificationCredibility** | 0-1 | Verification status of evidence |
| **linkageRelevance** | 0-1 | Direct connection to conclusion |
| **uniqueness** | 0-1 | Distinctiveness (reduced by redundancy) |
| **argumentImportance** | 0-1 | Weighted impact factor |

---

## Evidence Model

**Location:** `backend/models/Evidence.js`

### Schema Definition

```javascript
const EvidenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide evidence title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  type: {
    type: String,
    enum: ['study', 'article', 'book', 'video', 'image',
           'data', 'expert-opinion', 'other'],
    required: true
  },

  source: {
    url: { type: String, trim: true },
    author: { type: String, trim: true },
    publication: { type: String, trim: true },
    date: { type: Date }
  },

  credibilityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },

  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'disputed', 'debunked'],
    default: 'unverified'
  },

  verifiedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['verified', 'disputed']
    },
    notes: String,
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  }],

  arguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],

  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  tags: [{
    type: String,
    trim: true
  }],

  metadata: {
    doi: String,      // Digital Object Identifier
    isbn: String,     // Book identifier
    pmid: String,     // PubMed ID
    citations: Number // Citation count
  }
}, { timestamps: true });
```

### Instance Methods

```javascript
// Calculate credibility based on verifications
EvidenceSchema.methods.calculateCredibilityScore = function() {
  if (this.verifiedBy.length === 0) {
    this.credibilityScore = 50;
    return this.credibilityScore;
  }

  const verifiedCount = this.verifiedBy.filter(v => v.status === 'verified').length;
  const disputedCount = this.verifiedBy.filter(v => v.status === 'disputed').length;

  const score = 50 + (verifiedCount * 10) - (disputedCount * 10);
  this.credibilityScore = Math.max(0, Math.min(100, score));

  // Auto-update verification status
  if (verifiedCount >= 3) {
    this.verificationStatus = 'verified';
  } else if (disputedCount >= 3) {
    this.verificationStatus = 'disputed';
  }

  return this.credibilityScore;
};

// Add a user verification
EvidenceSchema.methods.addVerification = function(userId, status, notes) {
  this.verifiedBy.push({
    user: userId,
    status,
    notes,
    verifiedAt: new Date()
  });

  this.calculateCredibilityScore();
  return this.save();
};
```

### Indexes

```javascript
// Full-text search
EvidenceSchema.index({ title: 'text', description: 'text' });

// Query optimization
EvidenceSchema.index({ type: 1, verificationStatus: 1 });
```

---

## Querying Examples

### Get Belief with Arguments
```javascript
const belief = await Belief.findById(id)
  .populate('author', 'username reputation')
  .populate({
    path: 'supportingArguments',
    populate: { path: 'author', select: 'username' }
  })
  .populate({
    path: 'opposingArguments',
    populate: { path: 'author', select: 'username' }
  });
```

### Search Beliefs
```javascript
const results = await Belief.find({
  $text: { $search: 'climate change' },
  category: 'science',
  status: 'active'
}).sort({ 'statistics.views': -1 });
```

### Get User Vote History
```javascript
const user = await User.findById(userId)
  .populate('votedArguments.argumentId');
```

---

## Next Steps

- Learn about [Scoring System](Scoring-System) calculations
- Explore the [Algorithms](Algorithms) that update scores
- See the [API Reference](API-Reference) for CRUD operations

---

**Note:** All timestamps are automatically managed by Mongoose's `timestamps: true` option, providing `createdAt` and `updatedAt` fields.
