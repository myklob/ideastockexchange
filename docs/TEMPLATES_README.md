# UI/UX Design Templates

This directory contains HTML mockup templates demonstrating the proposed user interface and experience for the Idea Stock Exchange platform.

## Overview

These templates are **design prototypes** created to visualize what the platform's user experience could look like. They are static HTML pages with CSS styling, designed to showcase the UI/UX concept.

## Template Files

All template files are prefixed with `template-` to distinguish them from the actual application code:

- **template-index.html** - Home page with hero section, features showcase, and trending ideas
- **template-belief-analysis.html** - Belief analysis tool with evidence evaluation, Bayesian updates, and confidence tracking
- **template-argument-analysis.html** - Argument analysis with validity checks, soundness analysis, and fallacy detection
- **template-marketplace.html** - Idea marketplace with filtering, sorting, and browsing capabilities
- **template-idea-detail.html** - Individual idea detail page with trading interface and price charts
- **template-portfolio.html** - User portfolio dashboard with holdings, performance metrics, and activity tracking
- **template-styles.css** - Comprehensive CSS styling for all templates

## How to View

1. Open any of the template HTML files in a web browser
2. Start with `template-index.html` to see the home page
3. Navigate through the pages using the navigation menu
4. All pages are fully styled and interconnected

```bash
# Example: Open in browser
open template-index.html  # macOS
xdg-open template-index.html  # Linux
start template-index.html  # Windows
```

## Features Demonstrated

### Visual Design
- Modern, professional UI with gradient accents
- Responsive layout (mobile, tablet, desktop)
- Consistent color scheme and typography
- Smooth transitions and hover effects

### Core Concepts
- **Trading Interface**: Buy/sell ideas like stocks
- **Analysis Tools**: Detailed belief and argument analysis
- **Evidence Evaluation**: Supporting and challenging evidence display
- **Confidence Tracking**: Visual confidence meters and Bayesian updates
- **Community Features**: Arguments, comments, and trading activity
- **Portfolio Management**: Track holdings and performance

### Interactive Elements
- Navigation menus
- Filters and sorting options
- Trading forms
- Tabs and accordions
- Charts and data visualizations (placeholders)

## Design Philosophy

The templates emphasize:

1. **Clarity** - Information is presented in a clear, organized manner
2. **Data Visualization** - Charts, meters, and visual indicators for quick comprehension
3. **Engagement** - Interactive elements encourage exploration
4. **Professionalism** - Clean, modern design suitable for serious discourse
5. **Accessibility** - Readable typography and good contrast

## Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox and grid
- **Responsive Design** - Mobile-first approach
- **No JavaScript** - Pure HTML/CSS for easy viewing and modification

## Integration Notes

These templates are meant to inform the actual implementation in the React frontend (`/frontend/src`). Key components to integrate:

- Navigation structure
- Page layouts
- Card designs
- Form interfaces
- Color scheme and typography
- Responsive breakpoints

## Customization

To modify the templates:

1. Edit `template-styles.css` for global styling changes
2. Modify individual HTML files for content and structure changes
3. Update CSS variables in `:root` for theme customization

```css
/* Example: Change primary color */
:root {
    --primary-color: #3b82f6;  /* Change this value */
}
```

## Future Enhancements

Potential additions to these templates:

- [ ] Dark mode toggle
- [ ] More detailed chart implementations
- [ ] Interactive filter demos
- [ ] Mobile navigation menu
- [ ] Additional page templates (settings, help, etc.)

## Questions or Feedback

These templates are prototypes to visualize the platform's potential UX. For actual implementation, refer to the React components in `/frontend/src`.

---

**Note**: These are static mockups for design visualization. The actual application uses React components with backend integration.
