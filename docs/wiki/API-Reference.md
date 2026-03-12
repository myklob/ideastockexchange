# API Reference

Complete documentation for the Idea Stock Exchange REST API.

**Base URL:** `http://localhost:5000/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Beliefs](#beliefs)
- [Arguments](#arguments)
- [Evidence](#evidence)
- [Analysis](#analysis)
- [Algorithms](#algorithms)

---

## Authentication

JWT-based authentication system.

### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "reputation": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation:**
- Username: 3-50 characters, unique
- Email: Valid format, unique
- Password: Minimum 6 characters

---

### Login User

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "reputation": 150,
      "role": "user"
    }
  }
}
```

---

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "reputation": 150,
    "createdBeliefs": ["..."],
    "createdArguments": ["..."],
    "votedArguments": [
      {
        "argumentId": "507f1f77bcf86cd799439012",
        "vote": "up"
      }
    ]
  }
}
```

---

## Beliefs

CRUD operations for belief statements.

### Get All Beliefs

```http
GET /api/beliefs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (politics, science, etc.) |
| `trending` | boolean | Filter trending beliefs |
| `search` | string | Full-text search in statement/description |
| `limit` | number | Results per page (default: 20) |
| `page` | number | Page number (default: 1) |

**Example:**
```http
GET /api/beliefs?category=science&trending=true&limit=10&page=1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "statement": "Climate change is primarily caused by human activity",
      "description": "The scientific consensus on anthropogenic climate change",
      "category": "science",
      "tags": ["climate", "environment", "science"],
      "conclusionScore": 78,
      "statistics": {
        "views": 1250,
        "supportingCount": 12,
        "opposingCount": 5,
        "totalArguments": 17
      },
      "trending": true,
      "author": {
        "username": "climatescientist",
        "reputation": 450
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### Get Single Belief

```http
GET /api/beliefs/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "statement": "Climate change is primarily caused by human activity",
    "description": "...",
    "category": "science",
    "tags": ["climate", "environment"],
    "conclusionScore": 78,
    "author": {
      "username": "climatescientist",
      "reputation": 450
    },
    "supportingArguments": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "content": "97% of climate scientists agree on anthropogenic climate change",
        "type": "supporting",
        "scores": {
          "overall": 85,
          "logical": 88,
          "linkage": 90,
          "importance": 78
        },
        "votes": { "up": 45, "down": 3 },
        "author": { "username": "researcher1" }
      }
    ],
    "opposingArguments": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "content": "Climate has always changed naturally throughout Earth's history",
        "type": "opposing",
        "scores": {
          "overall": 62,
          "logical": 65,
          "linkage": 58,
          "importance": 63
        },
        "votes": { "up": 12, "down": 28 },
        "author": { "username": "skeptic1" }
      }
    ],
    "relatedBeliefs": [
      {
        "beliefId": {
          "_id": "507f1f77bcf86cd799439016",
          "statement": "We should reduce carbon emissions immediately"
        },
        "relationship": "supports",
        "linkageStrength": 0.85
      }
    ],
    "statistics": {
      "views": 1251,
      "supportingCount": 12,
      "opposingCount": 5,
      "totalArguments": 17
    },
    "status": "active",
    "trending": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

---

### Create Belief

```http
POST /api/beliefs
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "statement": "Universal basic income reduces poverty",
  "description": "A policy proposal where government provides unconditional cash transfers to all citizens",
  "category": "economics",
  "tags": ["ubi", "poverty", "welfare", "policy"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "statement": "Universal basic income reduces poverty",
    "description": "...",
    "category": "economics",
    "tags": ["ubi", "poverty", "welfare", "policy"],
    "conclusionScore": 50,
    "statistics": {
      "views": 0,
      "supportingCount": 0,
      "opposingCount": 0,
      "totalArguments": 0
    },
    "status": "active",
    "author": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-21T09:00:00.000Z"
  }
}
```

**Validation:**
- Statement: 10-500 characters, unique
- Description: Max 2000 characters
- Category: Must be valid enum value
- Tags: Array of strings

---

### Update Belief

```http
PUT /api/beliefs/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "statement": "Universal basic income significantly reduces poverty",
  "description": "Updated description...",
  "category": "economics",
  "tags": ["ubi", "poverty", "welfare", "policy", "economics"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "statement": "Universal basic income significantly reduces poverty",
    ...
  }
}
```

**Authorization:** Only author or admin can update.

---

### Delete Belief

```http
DELETE /api/beliefs/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Belief deleted successfully"
}
```

**Authorization:** Only author or admin can delete.

---

### Get Belief Arguments

```http
GET /api/beliefs/:id/arguments
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "supporting": [
      {
        "_id": "...",
        "content": "...",
        "author": { "username": "...", "reputation": 100 },
        "evidence": [ ... ]
      }
    ],
    "opposing": [ ... ]
  }
}
```

---

### Calculate Belief Score

```http
POST /api/beliefs/:id/calculate-score
Authorization: Bearer <token>
```

**Note:** Requires `admin` or `moderator` role.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conclusionScore": 72
  }
}
```

---

## Arguments

Operations for creating and managing arguments.

### Create Argument

```http
POST /api/arguments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Multiple studies show that UBI pilots have reduced poverty rates by 15-20% in test regions",
  "type": "supporting",
  "beliefId": "507f1f77bcf86cd799439017",
  "scores": {
    "logical": 75,
    "linkage": 85,
    "importance": 70
  },
  "evidence": ["507f1f77bcf86cd799439020"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439018",
    "content": "Multiple studies show that UBI pilots have reduced poverty rates by 15-20% in test regions",
    "type": "supporting",
    "beliefId": "507f1f77bcf86cd799439017",
    "author": "507f1f77bcf86cd799439011",
    "scores": {
      "overall": 77,
      "logical": 75,
      "linkage": 85,
      "importance": 70,
      "evidenceStrength": 1.0,
      "logicalCoherence": 1.0,
      "verificationCredibility": 1.0,
      "linkageRelevance": 1.0,
      "uniqueness": 1.0,
      "argumentImportance": 1.0
    },
    "votes": { "up": 0, "down": 0 },
    "evidence": ["507f1f77bcf86cd799439020"],
    "reasonRankScore": 0,
    "status": "active",
    "createdAt": "2024-01-21T10:00:00.000Z"
  }
}
```

**Validation:**
- Content: 10-2000 characters
- Type: "supporting" or "opposing"
- BeliefId: Must reference existing belief

---

### Update Argument

```http
PUT /api/arguments/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Updated argument content...",
  "scores": {
    "logical": 80
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Delete Argument

```http
DELETE /api/arguments/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Argument deleted successfully"
}
```

---

### Vote on Argument

```http
POST /api/arguments/:id/vote
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "vote": "up"
}
```

Or:
```json
{
  "vote": "down"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "votes": {
      "up": 46,
      "down": 3
    }
  }
}
```

**Behavior:**
- First vote: Adds vote
- Same vote again: Removes vote (toggle)
- Different vote: Changes vote direction

---

## Evidence

Operations for managing evidence.

### Get All Evidence

```http
GET /api/evidence
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "title": "Finland UBI Pilot Study Results (2020)",
      "description": "Two-year randomized controlled trial",
      "type": "study",
      "source": {
        "url": "https://kela.fi/ubi-study",
        "author": "Finnish Social Security Institution",
        "publication": "Kela Research",
        "date": "2020-05-06T00:00:00.000Z"
      },
      "metadata": {
        "doi": "10.1234/ubi.finland.2020",
        "citations": 245
      },
      "credibilityScore": 85,
      "verificationStatus": "verified",
      "verifiedBy": [
        { "user": "...", "status": "verified", "notes": "Peer-reviewed study" }
      ],
      "tags": ["ubi", "finland", "rct", "poverty"],
      "submittedBy": { "username": "researcher2" }
    }
  ]
}
```

---

### Create Evidence

```http
POST /api/evidence
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Stanford Basic Income Lab Report 2023",
  "description": "Comprehensive analysis of UBI programs worldwide",
  "type": "study",
  "source": {
    "url": "https://stanford.edu/ubi-lab/report-2023",
    "author": "Stanford Basic Income Lab",
    "publication": "Stanford University",
    "date": "2023-03-15"
  },
  "metadata": {
    "doi": "10.5678/stanford.ubi.2023",
    "citations": 89
  },
  "tags": ["ubi", "stanford", "comprehensive", "analysis"],
  "arguments": ["507f1f77bcf86cd799439018"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Stanford Basic Income Lab Report 2023",
    "credibilityScore": 50,
    "verificationStatus": "unverified",
    ...
  }
}
```

---

### Verify Evidence

```http
POST /api/evidence/:id/verify
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "verified",
  "notes": "Confirmed peer-reviewed publication from reputable institution"
}
```

Or for disputing:
```json
{
  "status": "disputed",
  "notes": "Data collection methodology has known flaws"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "credibilityScore": 60,
    "verificationStatus": "unverified",
    "verifiedBy": [
      {
        "user": "507f1f77bcf86cd799439011",
        "status": "verified",
        "notes": "Confirmed peer-reviewed publication",
        "verifiedAt": "2024-01-21T12:00:00.000Z"
      }
    ]
  }
}
```

---

## Analysis

Advanced analysis endpoints.

### Detect Fallacies

```http
POST /api/analysis/fallacies
```

**Request Body:**
```json
{
  "text": "Only an idiot would believe that climate change isn't real. You're biased because you work for oil companies."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hasFallacies": true,
    "fallacies": [
      {
        "type": "AD_HOMINEM",
        "name": "Ad Hominem",
        "description": "Attacking the person rather than addressing their argument",
        "severity": "high",
        "confidence": 60,
        "matches": [
          { "type": "pattern", "text": "Only an idiot", "index": 0 },
          { "type": "pattern", "text": "You're biased", "index": 50 }
        ]
      }
    ],
    "logicalCoherenceScore": 0.91,
    "warnings": ["High confidence Ad Hominem detected - consider revising argument"],
    "summary": {
      "total": 1,
      "high": 1,
      "medium": 0,
      "low": 0
    }
  }
}
```

---

### Batch Fallacy Analysis

```http
POST /api/analysis/fallacies/batch
```

**Request Body:**
```json
{
  "arguments": [
    { "id": "1", "content": "This is a logical argument..." },
    { "id": "2", "content": "You're an idiot for thinking that..." }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "argumentId": "1",
      "content": "This is a logical argument...",
      "analysis": {
        "hasFallacies": false,
        "fallacies": [],
        "logicalCoherenceScore": 1.0
      }
    },
    {
      "argumentId": "2",
      "content": "You're an idiot...",
      "analysis": {
        "hasFallacies": true,
        "fallacies": [ ... ]
      }
    }
  ]
}
```

---

### Get Fallacy Information

```http
GET /api/analysis/fallacies/:type
```

**Example:**
```http
GET /api/analysis/fallacies/AD_HOMINEM
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "AD_HOMINEM",
    "name": "Ad Hominem",
    "description": "Attacking the person rather than addressing their argument",
    "severity": "high",
    "examples": [
      "You're just saying that because you're biased.",
      "Only an idiot would believe that."
    ],
    "howToAvoid": "Focus on the argument itself, not the person making it. Address their claims with evidence and logic."
  }
}
```

---

### Detect Redundant Arguments

```http
POST /api/analysis/redundancy
```

**Request Body:**
```json
{
  "beliefId": "507f1f77bcf86cd799439017",
  "threshold": 0.85
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "redundantGroups": [
      {
        "representative": {
          "id": "...",
          "content": "UBI provides financial security...",
          "score": 78
        },
        "similar": [
          {
            "id": "...",
            "content": "Universal basic income gives financial stability...",
            "score": 65
          }
        ],
        "count": 2,
        "avgSimilarity": 0.89
      }
    ],
    "mergeSuggestions": [
      {
        "action": "merge",
        "representative": { ... },
        "toMerge": [ ... ],
        "reason": "2 similar arguments detected with 89% similarity",
        "benefits": [
          "Reduces clutter and redundancy",
          "Consolidates votes and evidence",
          "Improves debate clarity"
        ]
      }
    ],
    "totalArguments": 15,
    "redundantCount": 2,
    "uniqueCount": 13
  }
}
```

---

### Calculate Uniqueness

```http
POST /api/analysis/uniqueness
```

**Request Body:**
```json
{
  "argumentId": "507f1f77bcf86cd799439018"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uniqueness": 0.85,
    "argumentId": "507f1f77bcf86cd799439018",
    "totalArguments": 15
  }
}
```

---

### Full Belief Analysis

```http
POST /api/analysis/belief/:id/full-analysis
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "beliefId": "507f1f77bcf86cd799439017",
    "beliefStatement": "Universal basic income reduces poverty",
    "totalArguments": 15,
    "fallacyAnalysis": {
      "argumentsAnalyzed": 15,
      "argumentsWithFallacies": 3,
      "avgLogicalCoherence": 0.87,
      "details": [ ... ]
    },
    "redundancyAnalysis": {
      "redundantGroups": 2,
      "mergeSuggestions": 2,
      "avgUniqueness": 0.78,
      "details": [ ... ]
    },
    "recommendations": [
      {
        "type": "quality",
        "priority": "medium",
        "message": "3 arguments contain logical fallacies",
        "action": "Review and revise arguments to improve logical coherence"
      },
      {
        "type": "redundancy",
        "priority": "low",
        "message": "13% of arguments are redundant",
        "action": "Consider merging similar arguments to improve clarity"
      }
    ]
  }
}
```

---

## Algorithm Endpoints

Direct access to scoring algorithms.

### ArgumentRank Calculation

```http
POST /api/argumentrank
```

**Request Body:**
```json
{
  "matrix": [
    [0, -0.5, 0, 0, 1],
    [0.5, 0, -0.5, 0, 0],
    [0.5, -0.5, 0, 0, 0],
    [0, 1, 0.5, 0, -1],
    [0, 0, 0.5, 1, 0]
  ],
  "iterations": 100,
  "dampingFactor": 0.85
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scores": [0.25, 0.18, 0.22, 0.15, 0.20],
    "iterations": 100,
    "dampingFactor": 0.85
  }
}
```

---

### Conclusion Score Calculation

```http
POST /api/conclusion-score
```

**Request Body:**
```json
{
  "arguments": [
    {
      "reasonToAgree": 4,
      "reasonToDisagree": 0,
      "evidenceStrength": 0.85,
      "logicalCoherence": 0.92,
      "verificationCredibility": 0.80,
      "linkageRelevance": 0.88,
      "uniqueness": 0.75,
      "argumentImportance": 0.70
    },
    {
      "reasonToAgree": 0,
      "reasonToDisagree": 3,
      "evidenceStrength": 0.60,
      "logicalCoherence": 0.78,
      "verificationCredibility": 0.65,
      "linkageRelevance": 0.72,
      "uniqueness": 0.82,
      "argumentImportance": 0.68
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conclusionScore": 1.42,
    "argumentCount": 2
  }
}
```

---

### Example ArgumentRank

```http
GET /api/examples/argumentrank
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "matrix": [
      [0, -0.5, 0, 0, 1],
      [0.5, 0, -0.5, 0, 0],
      [0.5, -0.5, 0, 0, 0],
      [0, 1, 0.5, 0, -1],
      [0, 0, 0.5, 1, 0]
    ],
    "scores": [0.25, 0.18, 0.22, 0.15, 0.20],
    "description": "Example ArgumentRank calculation with sample adjacency matrix"
  }
}
```

---

## Error Responses

All endpoints follow consistent error format:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed: statement is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Not authorized to update this belief"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Belief not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

---

## Health Check

```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Idea Stock Exchange API is running",
  "timestamp": "2024-01-21T14:30:00.000Z",
  "database": "connected"
}
```

---

## Next Steps

- See [Frontend Components](Frontend-Components) for UI implementation
- Learn about [Algorithms](Algorithms) in depth
- Review [Data Models](Data-Models) for schema details

---

**Rate Limiting:** Coming soon in future release.
**API Versioning:** Currently v1 (unversioned paths).
