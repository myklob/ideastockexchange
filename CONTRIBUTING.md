# Contributing to Idea Stock Exchange

Thank you for your interest in contributing! This project aims to improve online debate through structured topic pages.

## Ways to Contribute

### 1. Report Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Python version, LLM provider)

### 2. Suggest Features

We welcome feature suggestions! Please:
- Check if it's already been suggested
- Explain the use case
- Describe how it would work

### 3. Improve Documentation

Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add examples
- Improve setup instructions

### 4. Submit Code

#### Getting Started

```bash
# Fork the repository
git clone https://github.com/yourusername/ideastockexchange.git
cd ideastockexchange

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set up your LLM (e.g., Ollama)
ollama serve
```

#### Making Changes

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and open a pull request

#### Code Style

- Follow PEP 8
- Use type hints where appropriate
- Add docstrings to new functions/classes
- Keep functions focused and single-purpose

#### Testing Your Changes

```bash
# Test LLM connection
python -m src.cli test

# Test with example data
python -m src.cli generate -t "Test Topic" -i examples/healthcare.json

# Verify output
ls -la topics/
```

## Areas for Contribution

### High Priority

- [ ] Add automated tests (unit, integration)
- [ ] Improve error handling and recovery
- [ ] Add support for more LLM providers
- [ ] Create web UI for easier use
- [ ] Optimize for speed (caching, parallel processing)

### Medium Priority

- [ ] Add database storage for topics
- [ ] Implement version control for topic updates
- [ ] Create topic comparison views
- [ ] Add export to multiple formats (PDF, Markdown, etc.)
- [ ] Improve belief extraction from unstructured text

### Nice to Have

- [ ] Multi-language support
- [ ] Collaborative editing features
- [ ] Topic recommendation system
- [ ] Visualization of belief networks
- [ ] Integration with existing wiki platforms

## Architectural Guidelines

### Adding New Features

1. **Keep it modular** - New features should be in separate modules
2. **Use the LLM client** - Don't create duplicate LLM connections
3. **Follow existing patterns** - Look at similar code for consistency
4. **Update documentation** - Add to relevant docs files

### Example: Adding a New Analyzer

```python
# src/my_analyzer.py
from typing import Dict, Any
from .llm_client import LLMClient

class MyAnalyzer:
    """Description of what this analyzes"""

    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze something

        Args:
            data: Input data

        Returns:
            Analysis results
        """
        # Implementation
        pass
```

Then integrate in `generator.py`:
```python
from .my_analyzer import MyAnalyzer

class TopicPageGenerator:
    def __init__(self, config):
        # ... existing code ...
        self.my_analyzer = MyAnalyzer(self.llm)
```

## Questions?

Feel free to:
- Open an issue for discussion
- Reach out via the project's communication channels
- Check existing documentation

Thank you for helping make online debate better! 🎯
Thank you for your interest in contributing to the Idea Stock Exchange! This project aims to create a transparent, evidence-based platform for evaluating truth and importance of ideas. Every contribution helps build a more rational world.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Testing](#testing)
9. [Documentation](#documentation)
10. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge to:

- Be respectful of differing viewpoints and experiences
- Focus on what is best for the community and the truth-seeking mission
- Show empathy towards other community members
- Accept constructive criticism gracefully
- Prioritize evidence and logic over rhetoric and popularity

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing opinions
- Gracefully accepting constructive criticism
- Focusing on logical reasoning and evidence
- Showing empathy towards others

**Unacceptable behaviors include:**
- Trolling, insulting, or derogatory comments
- Personal attacks or ad hominem arguments
- Publishing others' private information
- Spam or manipulation of scoring systems
- Other conduct violating the principle of good-faith discourse

---

## How Can I Contribute?

### 1. Reporting Bugs

**Before submitting a bug report:**
- Check the [existing issues](https://github.com/myklob/ideastockexchange/issues) to avoid duplicates
- Collect information about the bug:
  - Stack trace if applicable
  - OS, browser, and versions
  - Steps to reproduce
  - Expected vs actual behavior

**Submit bugs using the bug report template:**
```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 90]
- Version: [e.g. commit hash or release tag]

## Additional Context
[Screenshots, logs, etc.]
```

### 2. Suggesting Enhancements

**Before submitting an enhancement:**
- Review the [ARCHITECTURE.md](docs/ARCHITECTURE.md) to see if it's already planned
- Check existing feature requests
- Consider if it aligns with the project's mission

**Submit enhancement suggestions:**
```markdown
## Feature Description
[Clear description of the enhancement]

## Problem It Solves
[What problem does this address?]

## Proposed Solution
[How would it work?]

## Alternatives Considered
[Other approaches you've thought about]

## Additional Context
[Mockups, examples, etc.]
```

### 3. Your First Code Contribution

**Good first issues** are labeled `good-first-issue` in our issue tracker. These are:
- Well-defined
- Limited in scope
- Have clear acceptance criteria
- Great for learning the codebase

**Areas needing help:**
- Frontend components and UI improvements
- Testing (unit, integration, E2E)
- Documentation improvements
- Algorithm refinements
- Bug fixes

### 4. Pull Requests

See [Pull Request Process](#pull-request-process) below.

---

## Development Setup

### Prerequisites

- **Node.js** 16+ and npm
- **MongoDB** 5+ (local or Atlas)
- **Git**
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/ideastockexchange.git
   cd ideastockexchange
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/myklob/ideastockexchange.git
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Set up environment variables**

   Create `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ideastockexchange
   JWT_SECRET=your_dev_secret_key
   PORT=5000
   NODE_ENV=development
   ```

6. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod

   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI with your connection string
   ```

7. **Run the application**

   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

8. **Verify setup**

   Open `http://localhost:5173` in your browser. You should see the ISE homepage.

---

## Project Structure

```
ideastockexchange/
├── backend/
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Belief.js
│   │   ├── Argument.js
│   │   └── Evidence.js
│   ├── routes/              # API route handlers
│   │   ├── auth.js
│   │   ├── beliefs.js
│   │   ├── arguments.js
│   │   ├── evidence.js
│   │   └── analysis.js
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth, validation, etc.
│   ├── utils/               # Helper functions, algorithms
│   │   ├── fallacyDetector.js
│   │   └── redundancyDetector.js
│   ├── config/              # Database, environment config
│   └── server.js            # Main Express server
├── frontend/
│   └── src/
│       ├── pages/           # Top-level views
│       │   ├── BeliefsList.jsx
│       │   ├── BeliefDetails.jsx
│       │   └── AddArgument.jsx
│       ├── components/      # Reusable components
│       │   ├── Beliefs/
│       │   ├── Arguments/
│       │   ├── Evidence/
│       │   └── Auth/
│       ├── context/         # React Context (auth, theme)
│       ├── services/        # API client
│       └── App.jsx          # Main app component
├── docs/                    # Documentation
│   └── ARCHITECTURE.md
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

### Key Files to Understand

| File | Purpose |
|------|---------|
| `backend/server.js` | Express server, ArgumentRank algorithm |
| `backend/models/*.js` | Database schemas and methods |
| `backend/utils/fallacyDetector.js` | Logical fallacy detection |
| `backend/utils/redundancyDetector.js` | Argument similarity analysis |
| `frontend/src/pages/BeliefDetails.jsx` | Main debate view |
| `frontend/src/components/Beliefs/ScoreBreakdown.jsx` | Score visualization |
| `frontend/src/services/api.js` | API client functions |

---

## Coding Standards

### JavaScript/React Style

We follow standard JavaScript/React best practices:

**General:**
- Use ES6+ features (arrow functions, destructuring, etc.)
- Prefer `const` over `let`; avoid `var`
- Use meaningful variable names (`beliefId` not `id`, `argumentContent` not `content`)
- Keep functions small and focused (single responsibility)

**React:**
- Use functional components with hooks
- Destructure props at the top of components
- Use prop-types or TypeScript for type checking (future)
- Keep components under 300 lines (split if larger)
- Co-locate related logic (useState hooks together)

**Naming Conventions:**
- **Components**: PascalCase (`BeliefCard.jsx`)
- **Files**: camelCase for utilities (`fallacyDetector.js`), PascalCase for components
- **Variables**: camelCase (`conclusionScore`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_CHARS`)
- **API endpoints**: kebab-case (`/api/conclusion-score`)

**Example - Good:**
```javascript
// Good
const BeliefCard = ({ belief, onVote }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleVoteClick = (type) => {
    onVote(belief._id, type);
  };

  return (
    <div className="belief-card">
      {/* ... */}
    </div>
  );
};
```

**Example - Bad:**
```javascript
// Bad
function beliefcard(props) {
  var x = false;

  const clickHandler = function(t) {
    props.onVote(props.b.id, t);
  }

  return <div>{/* ... */}</div>
}
```

### Backend Style

**Models:**
- Use Mongoose schema validation
- Include methods for calculated fields
- Add indexes for frequently queried fields

**Routes:**
- Keep route files focused (one resource per file)
- Use middleware for auth checks
- Return consistent response formats

**Error Handling:**
- Use try/catch for async operations
- Return appropriate HTTP status codes
- Include helpful error messages

**Example:**
```javascript
// Good
router.post('/', auth, async (req, res) => {
  try {
    const { statement, description, category } = req.body;

    // Validation
    if (!statement || statement.length < 10) {
      return res.status(400).json({
        error: 'Statement must be at least 10 characters'
      });
    }

    const belief = await Belief.create({
      statement,
      description,
      category,
      author: req.user._id
    });

    res.status(201).json({ success: true, data: belief });
  } catch (error) {
    console.error('Error creating belief:', error);
    res.status(500).json({ error: 'Failed to create belief' });
  }
});
```

### CSS/Styling

We use **Tailwind CSS** for styling:

- Use Tailwind utility classes
- Extract repeated patterns into components
- Follow mobile-first responsive design
- Use semantic color names (`bg-blue-600` not `bg-#1234ab`)

---

## Commit Guidelines

We follow **Conventional Commits** for clear history:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Scopes:**
- `auth`: Authentication
- `beliefs`: Belief-related code
- `arguments`: Argument-related code
- `evidence`: Evidence-related code
- `ui`: UI components
- `api`: API endpoints
- `scoring`: Scoring algorithms
- `db`: Database models/migrations

**Examples:**

```bash
# Feature
git commit -m "feat(arguments): add sub-argument creation UI"

# Bug fix
git commit -m "fix(scoring): correct conclusion score calculation when no arguments exist"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactor
git commit -m "refactor(api): simplify belief query logic"
```

**Detailed commit:**
```
feat(evidence): add DOI auto-lookup integration

- Integrate CrossRef API for automatic metadata
- Add loading state during lookup
- Display error message if DOI not found
- Update EvidenceForm component tests

Closes #123
```

---

## Pull Request Process

### Before Submitting

1. **Update your fork:**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make your changes:**
   - Write clean, readable code
   - Follow coding standards
   - Add comments for complex logic

4. **Test your changes:**
   - Manual testing
   - Run existing tests (when available)
   - Add new tests for new features

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting the PR

1. **Go to GitHub** and create a pull request from your fork

2. **Fill out the PR template:**

```markdown
## Description
[Clear description of what this PR does]

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
[Describe the tests you ran]

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

### Review Process

1. **Automated checks** will run (when CI/CD is set up)
2. **Maintainers will review** within 1-7 days
3. **Address feedback:**
   - Make requested changes
   - Push additional commits to the same branch
   - Re-request review when ready

4. **Merge:**
   - Once approved, a maintainer will merge
   - Delete your feature branch after merge

---

## Testing

### Current State
Testing infrastructure is being set up. For now:

**Manual Testing:**
1. Test your changes in the browser
2. Check different screen sizes (responsive)
3. Test edge cases (empty states, errors, etc.)
4. Verify backend changes with Postman/curl

**Future Testing:**
- Unit tests with Jest
- Integration tests for API
- E2E tests with Cypress/Playwright
- Component tests with React Testing Library

### Writing Tests (Future)

**Example unit test (Jest):**
```javascript
describe('calculateConclusionScore', () => {
  it('should return 50 when no arguments exist', async () => {
    const belief = await Belief.create({
      statement: 'Test belief',
      author: userId
    });

    const score = await belief.calculateConclusionScore();
    expect(score).toBe(50);
  });

  it('should calculate weighted average based on argument scores', async () => {
    // Test implementation
  });
});
```

**Example component test:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import BeliefCard from './BeliefCard';

test('renders belief statement', () => {
  const belief = { statement: 'Test belief', conclusionScore: 75 };
  render(<BeliefCard belief={belief} />);

  expect(screen.getByText('Test belief')).toBeInTheDocument();
});
```

---

## Documentation

### Code Comments

**When to comment:**
- Complex algorithms (fallacy detection, scoring)
- Non-obvious business logic
- Workarounds or hacks
- TODO items

**Example:**
```javascript
// Calculate uniqueness score using 4 similarity algorithms:
// 1. Levenshtein distance (character-level)
// 2. Jaccard similarity (word-level)
// 3. TF-IDF + Cosine similarity (semantic)
// 4. N-gram analysis (phrase-level)
const uniquenessScore = await calculateUniqueness(argument, existingArguments);
```

### README/Documentation Updates

**When to update docs:**
- Adding new features
- Changing API endpoints
- Updating installation steps
- Adding new dependencies

**Files to update:**
- `README.md` - Overview, installation, getting started
- `docs/ARCHITECTURE.md` - System design, data models
- `docs/API.md` - API reference (when created)

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Q&A, ideas, general discussion
- **Pull Request Comments**: Code review, specific changes
- **Twitter**: [@myclob](https://twitter.com/myclob) - Announcements

### Getting Help

**Stuck on something?**
1. Check existing documentation (README, ARCHITECTURE.md)
2. Search existing issues
3. Ask in GitHub Discussions
4. Tag maintainers in your PR if blocked

### Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- README acknowledgements (for significant contributions)

---

## Development Roadmap

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full roadmap.

**Current priorities (Phase 1 completion):**
1. Testing infrastructure
2. Evidence integration in argument UI
3. Sub-argument creation UI
4. API documentation
5. Performance optimization

**Upcoming phases:**
- Phase 2: Advanced scoring (Importance, Epistemic Impact)
- Phase 3: CBO system and incentives
- Phase 4: Media integration
- Phase 5: AI tools
- Phase 6: Governance and peer review

---

## Questions?

If you have questions not covered here:
1. Check [ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. Search [GitHub Issues](https://github.com/myklob/ideastockexchange/issues)
3. Open a new issue with the `question` label

---

**Thank you for contributing to building a more rational world!** 🚀

Every line of code, every bug report, every documentation improvement brings us closer to a transparent marketplace of ideas where truth is determined by evidence and logic, not rhetoric and popularity.

**Happy coding!**
