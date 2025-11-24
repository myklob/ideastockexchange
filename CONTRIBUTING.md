# Contributing to Idea Stock Exchange

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ideastockexchange.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `pytest tests/`
6. Commit: `git commit -am "Add your message"`
7. Push: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dev dependencies
pip install -r requirements.txt
pip install -e .

# Install pre-commit hooks (optional)
pre-commit install
```

## Code Style

We follow PEP 8 and use these tools:

- **Black** for code formatting
- **Flake8** for linting
- **MyPy** for type checking
- **isort** for import sorting

Run before committing:

```bash
black src/
isort src/
flake8 src/
mypy src/
```

## Testing

Write tests for new features:

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=src tests/

# Run specific test file
pytest tests/test_scanner.py
```

## Documentation

- Update docstrings for new functions/classes
- Follow Google-style docstrings
- Update README.md if adding features
- Add examples to `examples/` directory

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages are clear and descriptive

### PR Description Should Include

- What the PR does
- Why this change is needed
- How it was tested
- Any breaking changes
- Screenshots (if UI changes)

## Types of Contributions

### 🐛 Bug Fixes

- Include steps to reproduce
- Add test case demonstrating the bug
- Fix the bug
- Verify test now passes

### ✨ New Features

- Discuss in an issue first
- Follow existing patterns
- Add comprehensive tests
- Update documentation
- Add example usage

### 📚 Documentation

- Fix typos
- Improve clarity
- Add examples
- Translate documentation

### 🔧 Improvements

- Performance optimizations
- Code refactoring
- Better error messages
- Enhanced logging

## Areas for Contribution

### High Priority

- [ ] Additional search providers (DuckDuckGo, etc.)
- [ ] Academic database integration (PubMed, arXiv)
- [ ] Web interface
- [ ] Improved argument quality scoring
- [ ] Fact-checking integration
- [ ] Multi-language support

### Medium Priority

- [ ] Graph visualization of argument trees
- [ ] Export to additional formats (JSON, RDF, GraphML)
- [ ] Caching layer for API calls
- [ ] Batch processing capabilities
- [ ] Real-time collaborative editing
- [ ] Argument similarity detection

### Nice to Have

- [ ] Mobile app
- [ ] Browser extension
- [ ] Social media integration
- [ ] Historical argument tracking
- [ ] Bias detection algorithms
- [ ] Community voting on argument quality

## Code Organization

```
src/
├── models/          # Data models (Belief, Reason, Evidence, etc.)
├── search/          # Search provider integrations
├── extraction/      # LLM-based extraction and analysis
├── enrichment/      # Metadata enrichment
├── analysis/        # Stress tests and proposals
├── generation/      # XML generation
├── utils/           # Utilities and configuration
└── cli.py           # Command-line interface
```

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```
feat(search): add DuckDuckGo search provider

Implement DuckDuckGo search API integration as an
alternative to Google and Bing search.

Closes #123
```

## Design Principles

1. **Modularity**: Each component should be independent
2. **Extensibility**: Easy to add new search providers, LLM backends
3. **Testability**: Write testable code with dependency injection
4. **Documentation**: Code should be self-documenting
5. **Error Handling**: Graceful degradation, clear error messages
6. **Performance**: Async/await for I/O operations

## Questions?

- Open an issue for discussion
- Check existing issues and PRs
- Read the README and documentation
- Ask in discussions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Idea Stock Exchange! 🎉
