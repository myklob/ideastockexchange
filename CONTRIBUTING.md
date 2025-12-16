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
