# Idea Stock Exchange - Full Implementation

## Overview
A comprehensive full-stack application for automated conflict resolution and cost-benefit analysis using a PageRank-inspired ReasonRank algorithm.

## Technology Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React** 18
- **React Router** for navigation
- **Axios** for API communication
- **Vite** as build tool
- **Tailwind CSS** for styling

## Features Implemented

### 1. Authentication System ✅
- JWT-based authentication
- User registration with validation
- Secure login/logout
- Password hashing with bcrypt
- Protected routes
- Role-based authorization (user, moderator, admin)
- Auth context for global state management

### 2. Database Models ✅
- **User Model**: Username, email, password, reputation, roles
- **Belief Model**: Statements, categories, conclusion scores, statistics
- **Argument Model**: Content, type (supporting/opposing), scores, votes
- **Evidence Model**: Sources, verification status, credibility scores

### 3. Backend API Endpoints ✅

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

#### Beliefs
- `GET /api/beliefs` - Get all beliefs (with filtering, search, pagination)
- `GET /api/beliefs/:id` - Get specific belief
- `POST /api/beliefs` - Create new belief (protected)
- `PUT /api/beliefs/:id` - Update belief (protected)
- `DELETE /api/beliefs/:id` - Delete belief (protected)
- `GET /api/beliefs/:id/arguments` - Get all arguments for a belief
- `POST /api/beliefs/:id/calculate-score` - Recalculate conclusion score

#### Arguments
- `POST /api/arguments` - Create argument (protected)
- `PUT /api/arguments/:id` - Update argument (protected)
- `DELETE /api/arguments/:id` - Delete argument (protected)
- `POST /api/arguments/:id/vote` - Vote on argument (protected)

#### Evidence
- `GET /api/evidence` - Get all evidence
- `GET /api/evidence/:id` - Get specific evidence
- `POST /api/evidence` - Create evidence (protected)
- `PUT /api/evidence/:id` - Update evidence (protected)
- `DELETE /api/evidence/:id` - Delete evidence (protected)
- `POST /api/evidence/:id/verify` - Verify evidence (protected)

#### Algorithms
- `POST /api/argumentrank` - Calculate ArgumentRank scores
- `POST /api/conclusion-score` - Calculate conclusion score
- `GET /api/examples/argumentrank` - Example calculation

### 4. Frontend Features ✅

#### Components
- **LoginForm**: User authentication
- **RegisterForm**: User registration
- **BeliefForm**: Create/edit beliefs
- **ReasonRankTemplate**: Argument visualization with scores
- **AuthContext**: Global authentication state

#### Pages
- **Home**: Landing page with ReasonRank demonstration
- **Login/Register**: Authentication pages
- **Create Belief**: Form for creating new beliefs
- **Profile**: User profile display
- **Beliefs List**: Browse all beliefs (placeholder)
- **Belief Details**: Detailed belief view (placeholder)

#### API Service Layer
- Centralized API communication
- Automatic token management
- Request/response interceptors
- Organized by domain (auth, beliefs, arguments, evidence)

### 5. Core Algorithms ✅

#### ArgumentRank Algorithm
```javascript
function argumentrank(M, numIterations = 100, d = 0.85)
```
- Adapted from Google's PageRank
- Evaluates argument credibility based on inter-linking support
- Uses adjacency matrix with support (+) and opposition (-) values
- Iterative score calculation with damping factor

#### Conclusion Score Calculation
```
CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)
```
Components:
- **RtA/RtD**: Reasons to Agree/Disagree
- **ES**: Evidence Strength
- **LC**: Logical Coherence
- **VC**: Verification Credibility
- **LR**: Linkage Relevance
- **UD**: Uniqueness
- **AI**: Argument Importance

### 6. Security Features ✅
- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation
- CORS configuration
- Role-based access control

### 7. Database Features ✅
- MongoDB connection with error handling
- Mongoose schemas with validation
- Indexes for performance
- Population of references
- Automatic timestamp tracking
- Statistics tracking
- View counting

## File Structure

```
ideastockexchange/
├── backend/
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── beliefController.js   # Belief CRUD operations
│   │   ├── argumentController.js # Argument operations
│   │   └── evidenceController.js # Evidence management
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Belief.js            # Belief model
│   │   ├── Argument.js          # Argument model
│   │   ├── Evidence.js          # Evidence model
│   │   └── index.js             # Model exports
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── beliefs.js           # Belief routes
│   │   ├── arguments.js         # Argument routes
│   │   └── evidence.js          # Evidence routes
│   ├── .env                     # Environment variables
│   ├── package.json             # Dependencies
│   └── server.js                # Express server setup
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.js
│   │   │   │   └── RegisterForm.js
│   │   │   ├── Beliefs/
│   │   │   │   └── BeliefForm.js
│   │   │   └── ReasonRankTemplate.js
│   │   ├── context/
│   │   │   └── AuthContext.js   # Auth state management
│   │   ├── services/
│   │   │   └── api.js           # API communication layer
│   │   ├── app.js               # Main app component
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud instance)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ideastockexchange
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d
```

4. Start the server:
```bash
npm start
```

Server will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on http://localhost:3000

## API Usage Examples

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a Belief
```bash
curl -X POST http://localhost:5000/api/beliefs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "statement": "Renewable energy is cost-effective",
    "description": "Analysis of renewable energy economics",
    "category": "economics",
    "tags": ["energy", "environment"]
  }'
```

### Calculate ArgumentRank
```bash
curl -X POST http://localhost:5000/api/argumentrank \
  -H "Content-Type: application/json" \
  -d '{
    "matrix": [[0, -0.5, 0], [0.5, 0, -0.5], [0.5, -0.5, 0]],
    "iterations": 100,
    "dampingFactor": 0.85
  }'
```

## Next Steps

### High Priority
1. **MongoDB Installation**: Set up local or cloud MongoDB instance
2. **Beliefs List Page**: Complete implementation with API integration
3. **Belief Details Page**: Full belief view with arguments display
4. **Argument Creation UI**: Form to add arguments to beliefs
5. **Evidence Upload**: Interface for submitting evidence
6. **Real-time Updates**: WebSocket integration for live score updates

### Medium Priority
7. **Advanced Search**: Full-text search across beliefs and arguments
8. **Trending Algorithm**: Implement trending beliefs calculation
9. **Reputation System**: Calculate and display user reputation
10. **Notifications**: User notifications for activity
11. **Admin Dashboard**: Moderation tools for admins
12. **Data Visualization**: Charts for scores and trends

### Future Enhancements
13. **Mobile App**: React Native mobile application
14. **Social Features**: Follow users, bookmark beliefs
15. **Export Features**: PDF/CSV export of analysis
16. **API Rate Limiting**: Protect against abuse
17. **Caching Layer**: Redis for performance
18. **Testing Suite**: Unit and integration tests
19. **Documentation**: API documentation with Swagger
20. **Deployment**: Production deployment guide

## Testing

### Manual Testing Checklist
- [ ] User registration works
- [ ] User login works
- [ ] Token persists across page refreshes
- [ ] Protected routes require authentication
- [ ] Belief creation works
- [ ] Argument creation works
- [ ] Evidence submission works
- [ ] Score calculation works
- [ ] Voting system works
- [ ] Evidence verification works

## Known Issues
- MongoDB connection requires local instance or cloud setup
- No automated tests yet
- Some placeholder pages need implementation
- Real-time updates not yet implemented

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License
MIT License - See LICENSE file for details
