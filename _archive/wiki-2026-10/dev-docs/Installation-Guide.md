# Installation Guide

This guide will help you set up the Idea Stock Exchange development environment on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 16.x or higher | [nodejs.org](https://nodejs.org/) |
| npm | 8.x or higher | Comes with Node.js |
| MongoDB | 5.x or higher | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

To verify your installations:
```bash
node --version    # Should show v16.x.x or higher
npm --version     # Should show 8.x.x or higher
mongod --version  # Should show v5.x.x or higher
git --version     # Should show git version x.x.x
```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/myklob/ideastockexchange.git
cd ideastockexchange
```

This creates the following project structure:

```
ideastockexchange/
├── backend/           # Node.js + Express API server
│   ├── config/        # Database configuration
│   ├── controllers/   # Business logic
│   ├── middleware/    # Authentication middleware
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API endpoints
│   ├── utils/         # Algorithms (fallacy/redundancy detection)
│   ├── scripts/       # Database seeding
│   └── server.js      # Main server entry point
├── frontend/          # React application
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # State management
│       ├── pages/       # Main views
│       └── services/    # API communication layer
└── docs/              # Additional documentation
```

---

## Step 2: Install Backend Dependencies

Navigate to the backend directory and install packages:

```bash
cd backend
npm install
```

This installs:
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

---

## Step 3: Install Frontend Dependencies

Navigate to the frontend directory:

```bash
cd ../frontend
npm install
```

This installs:
- **react** - UI library (v18)
- **react-router-dom** - Client-side routing (v6)
- **vite** - Build tool and dev server
- **tailwindcss** - Utility-first CSS framework
- **lucide-react** - Icon library
- **axios** - HTTP client

---

## Step 4: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd ../backend
touch .env
```

Add the following configuration:

```env
# Database Connection
MONGODB_URI=mongodb://localhost:27017/ideastockexchange

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Security Notes:**
- Replace `JWT_SECRET` with a strong, random string (at least 32 characters)
- Never commit `.env` files to version control
- Use different secrets for development and production

---

## Step 5: Start MongoDB

### Option A: Local MongoDB

If you have MongoDB installed locally:

```bash
# Start MongoDB service
mongod --dbpath /path/to/your/data/directory

# Or on macOS with Homebrew
brew services start mongodb-community
```

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ideastockexchange
```

---

## Step 6: Start the Application

You'll need two terminal windows/tabs:

### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
======================================================================
🚀 Idea Stock Exchange API Server
======================================================================
📡 Server running on port 5000
🌐 API Base URL: http://localhost:5000/api
📊 Health Check: http://localhost:5000/api/health
======================================================================

📋 Authentication Endpoints:
  POST /api/auth/register - Register new user
  POST /api/auth/login    - Login user
  GET  /api/auth/me       - Get current user

💡 Belief Endpoints:
  GET    /api/beliefs           - Get all beliefs
  GET    /api/beliefs/:id       - Get specific belief
  POST   /api/beliefs           - Create new belief
  ...
```

### Terminal 2: Frontend Dev Server

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

---

## Step 7: Verify Installation

### 1. Check Backend Health

Visit: `http://localhost:5000/api/health`

Expected response:
```json
{
  "status": "ok",
  "message": "Idea Stock Exchange API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 2. Check Frontend

Visit: `http://localhost:5173`

You should see the Idea Stock Exchange homepage with:
- Navigation bar
- Beliefs list (empty initially)
- Register/Login options

### 3. Test Database Connection

Check MongoDB logs for successful connection message from Mongoose.

---

## Step 8: Seed Sample Data (Optional)

To populate the database with sample beliefs and arguments:

```bash
cd backend
node scripts/seedDatabase.js
```

This creates:
- Sample users
- Example beliefs across categories
- Supporting and opposing arguments
- Sample evidence

---

## Common Issues & Solutions

### Port Already in Use

```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### MongoDB Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Ensure MongoDB is running:
```bash
# Check if mongod is running
ps aux | grep mongod

# Start it if not
mongod --dbpath /your/data/path
```

### CORS Errors

If you see CORS errors in browser console:
1. Ensure backend is running on port 5000
2. Check that `cors()` middleware is enabled in `server.js`
3. Verify frontend API service points to correct backend URL

### JWT Token Issues

If authentication fails:
1. Verify `JWT_SECRET` is set in `.env`
2. Check that the secret matches between login and verification
3. Clear browser localStorage and try again

---

## Development Workflow

### Making Changes

1. **Backend Changes**: Server auto-restarts with nodemon
2. **Frontend Changes**: Vite hot-reloads instantly
3. **Database Changes**: Update schemas in `backend/models/`

### Code Style

- Backend: CommonJS modules with ES6 features
- Frontend: ES modules with React hooks
- Styling: Tailwind CSS utility classes

### Testing API Endpoints

Use tools like:
- **Postman** - GUI API client
- **curl** - Command-line HTTP client
- **Thunder Client** - VS Code extension

Example with curl:
```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Get all beliefs
curl http://localhost:5000/api/beliefs
```

---

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Use a process manager like PM2
3. Configure reverse proxy (Nginx/Apache)
4. Enable HTTPS
5. Set secure JWT secret
6. Configure MongoDB authentication
7. Set up monitoring and logging

See our [Deployment Guide](Deployment-Guide) for detailed instructions.

---

## Next Steps

Now that you have the environment running:

1. Read the [Core Concepts](Core-Concepts) to understand the data model
2. Explore the [API Reference](API-Reference) to see available endpoints
3. Check [Frontend Components](Frontend-Components) to understand the UI
4. Review [Algorithms](Algorithms) to learn about scoring mechanisms

---

**Need help?** Open an issue on [GitHub](https://github.com/myklob/ideastockexchange/issues) or reach out on Twitter [@myclob](https://twitter.com/myclob).
