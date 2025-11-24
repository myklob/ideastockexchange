# IdeaStockExchange Backend API

RESTful API backend for the IdeaStockExchange fact-checking system.

## 🚀 Quick Start

### Installation

```bash
cd backend
npm install
```

### Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and configure your settings.

### Database Setup

Initialize and seed the database:

```bash
npm run seed
```

### Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Claims Endpoints

#### Get All Claims
```http
GET /api/claims
```

Optional query parameters:
- `search` - Search claims by title or description
- `category` - Filter by category

Response:
```json
{
  "success": true,
  "count": 36,
  "claims": [...]
}
```

#### Get Single Claim
```http
GET /api/claims/:id
```

Response:
```json
{
  "success": true,
  "claim": {
    "id": "vaccines-autism",
    "title": "Vaccines cause autism",
    "description": "...",
    "patterns": ["..."],
    "confidence": 0.9,
    "reasonsFor": 3,
    "reasonsAgainst": 47,
    "evidenceScore": 0.95,
    "category": "health"
  }
}
```

#### Create Claim
```http
POST /api/claims
Content-Type: application/json

{
  "id": "unique-claim-id",
  "title": "Claim title",
  "description": "Detailed description",
  "url": "https://...",
  "patterns": ["regex1", "regex2"],
  "confidence": 0.85,
  "reasonsFor": 10,
  "reasonsAgainst": 30,
  "evidenceScore": 0.75,
  "category": "science"
}
```

#### Update Claim
```http
PUT /api/claims/:id
Content-Type: application/json

{
  "title": "Updated title",
  ...
}
```

#### Delete Claim
```http
DELETE /api/claims/:id
```

#### Record Detection
```http
POST /api/claims/:id/detect
Content-Type: application/json

{
  "url": "https://example.com/page"
}
```

#### Get Statistics
```http
GET /api/claims/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalClaims": 36,
    "totalDetections": 1523,
    "categoryCounts": [...],
    "avgEvidenceScore": 0.87
  }
}
```

#### Get Categories
```http
GET /api/claims/categories
```

### User Endpoints

#### Register
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword"
}
```

### Analytics Endpoints

#### Get Detections Analytics
```http
GET /api/analytics/detections
```

Response:
```json
{
  "success": true,
  "analytics": {
    "total": 1523,
    "today": 45,
    "thisWeek": 312,
    "thisMonth": 1203,
    "topClaims": [...]
  }
}
```

#### Get Trends
```http
GET /api/analytics/trends
```

Returns daily detection counts for the past 30 days.

#### Get Category Analytics
```http
GET /api/analytics/categories
```

Returns statistics grouped by category.

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-24T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "development"
}
```

## 🗄️ Database Schema

### claims
- `id` (TEXT, PRIMARY KEY)
- `title` (TEXT)
- `description` (TEXT)
- `url` (TEXT)
- `confidence` (REAL 0-1)
- `reasons_for` (INTEGER)
- `reasons_against` (INTEGER)
- `evidence_score` (REAL 0-1)
- `category` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### patterns
- `id` (INTEGER, PRIMARY KEY)
- `claim_id` (TEXT, FOREIGN KEY)
- `pattern` (TEXT)

### users
- `id` (INTEGER, PRIMARY KEY)
- `username` (TEXT, UNIQUE)
- `email` (TEXT, UNIQUE)
- `password_hash` (TEXT)
- `role` (TEXT: user/moderator/admin)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### detections
- `id` (INTEGER, PRIMARY KEY)
- `claim_id` (TEXT, FOREIGN KEY)
- `url` (TEXT)
- `user_agent` (TEXT)
- `detected_at` (DATETIME)

### feedback
- `id` (INTEGER, PRIMARY KEY)
- `claim_id` (TEXT, FOREIGN KEY)
- `user_id` (INTEGER, FOREIGN KEY)
- `rating` (INTEGER 1-5)
- `comment` (TEXT)
- `helpful_count` (INTEGER)
- `created_at` (DATETIME)

## 🔧 Development

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js      # Database configuration
│   ├── models/
│   │   └── Claim.js         # Claim model
│   ├── routes/
│   │   ├── claims.js        # Claims routes
│   │   ├── users.js         # User routes
│   │   └── analytics.js     # Analytics routes
│   ├── middleware/
│   │   └── errorHandler.js  # Error handling
│   ├── scripts/
│   │   └── seed.js          # Database seeding
│   └── server.js            # Main server file
├── data/                    # SQLite database storage
├── package.json
└── .env
```

### Testing

```bash
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
```

### Linting

```bash
npm run lint
```

## 🔒 Security

- Helmet.js for HTTP headers security
- CORS configuration for cross-origin requests
- Rate limiting to prevent abuse
- JWT-based authentication
- bcrypt password hashing
- SQL injection prevention (prepared statements)
- Input validation with express-validator

## 🚢 Deployment

### Environment Variables

Make sure to set these in production:

- `NODE_ENV=production`
- `JWT_SECRET` - Strong random secret
- `DATABASE_PATH` - Path to SQLite database
- `CORS_ORIGIN` - Allowed origins

### Using PM2

```bash
npm install -g pm2
pm2 start src/server.js --name ideastockexchange-api
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t ideastockexchange-api .
docker run -p 3000:3000 -v $(pwd)/data:/app/data ideastockexchange-api
```

## 📊 Monitoring

Access logs are written using Morgan in combined format.

Health check endpoint: `GET /health`

## 🤝 Contributing

See main project CONTRIBUTING.md for guidelines.

## 📄 License

MIT License - see main project LICENSE file
