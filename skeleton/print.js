const fs = require('fs').promises;
const path = require('path');
const plugins = require('./controllers/plugins');
const templates = require('./controllers/templates');
const themes = require('./controllers/themes');

async function generateReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    checks: {
      plugins: await plugins.checkPlugins(),
      templates: await templates.checkTemplates(),
      themes: await themes.checkThemes()
    },
    security: {
      status: 'pending',
      vulnerabilities: []
    }
  };

  // Basic security checks
  try {
    // Check for package vulnerabilities
    const packageLock = require('../../../package-lock.json');
    if (packageLock.dependencies) {
      report.security.vulnerabilities = Object.entries(packageLock.dependencies)
        .filter(([name, pkg]) => pkg.vulnerabilities)
        .map(([name, pkg]) => ({
          package: name,
          version: pkg.version,
          vulnerabilities: pkg.vulnerabilities
        }));
    }

    report.security.status = report.security.vulnerabilities.length > 0 ? 'fail' : 'ok';
  } catch (err) {
    report.security.status = 'error';
    report.security.error = err.message;
  }

  // Save report
  await fs.writeFile(
    path.join(__dirname, 'skeleton.json'),
    JSON.stringify(report, null, 2)
  );

  return report;
}

// Run if executed directly
if (require.main === module) {
  generateReport().then(report => {
    console.log('Skeleton report generated successfully');
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }).catch(err => {
    console.error('Failed to generate skeleton report:', err);
    process.exit(1);
  });
}

module.exports = generateReport;