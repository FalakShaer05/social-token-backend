const path = require('path');
const fs = require('fs');

/**
 * Helper function to render HTML views
 * @param {string} viewName - Name of the view file (without .html extension)
 * @param {string} subdirectory - Optional subdirectory (e.g., 'pages', 'partials')
 * @returns {string} - HTML content of the view
 */
function renderView(viewName, subdirectory = 'pages') {
  try {
    const viewPath = path.join(__dirname, `../../views/${subdirectory}/${viewName}.html`);
    return fs.readFileSync(viewPath, 'utf8');
  } catch (error) {
    console.error(`Error reading view ${viewName}:`, error);
    throw new Error(`View ${viewName} not found`);
  }
}

/**
 * Helper function to serve a view as HTTP response
 * @param {Object} res - Express response object
 * @param {string} viewName - Name of the view file (without .html extension)
 * @param {string} subdirectory - Optional subdirectory (e.g., 'pages', 'partials')
 */
function serveView(res, viewName, subdirectory = 'pages') {
  try {
    const html = renderView(viewName, subdirectory);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error(`Error serving view ${viewName}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to load ${viewName} page`
    });
  }
}

module.exports = {
  renderView,
  serveView
};
