# Views Directory

This directory contains all the HTML templates and views for the Social Token NFT Marketplace backend.

## Directory Structure

```
views/
├── pages/           # Full page templates
│   └── support-form.html
├── partials/        # Reusable partial templates
└── README.md        # This file
```

## Usage

### Pages
- **`pages/support-form.html`** - Support ticket submission form
  - Accessible at `/support` or `/v1/support`
  - Contains complete HTML page with embedded CSS and JavaScript
  - Handles form submission via AJAX to `/v1/support` endpoint

### Partials
- **`partials/`** - For reusable components like headers, footers, navigation, etc.
  - Can be included in multiple pages
  - Useful for maintaining consistent UI elements

## Adding New Views

1. **For full pages**: Add HTML files to `pages/` directory
2. **For partials**: Add HTML fragments to `partials/` directory
3. **Update controllers**: Use `res.render('path/to/view')` to serve views
4. **Follow naming convention**: Use kebab-case for file names (e.g., `user-profile.html`)

## View Engine Configuration

The application is configured to use HTML as the view engine:
- View engine: `html`
- Views directory: `./views`
- Templates are served using Express's built-in view rendering

## Best Practices

1. **Separation of Concerns**: Keep HTML in views, logic in controllers
2. **Reusability**: Use partials for common elements
3. **Responsive Design**: Ensure all views are mobile-friendly
4. **Accessibility**: Follow WCAG guidelines for form accessibility
5. **Performance**: Minimize inline CSS/JS, consider external files for larger projects
