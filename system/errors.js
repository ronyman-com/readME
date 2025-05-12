const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const REPORT_PATH = path.join(__dirname, 'report.json');
const LOGS_DIR = path.join(__dirname, 'logs');

// Initialize error report structure
const errorReport = {
  lastUpdated: new Date().toISOString(),
  system: {
    node: process.version,
    platform: process.platform,
    arch: process.arch
  },
  scripts: {}
};

// Get all scripts from package.json
const packageJson = require('../package.json');
const scripts = packageJson.scripts;

async function runScriptsWithErrorHandling() {
  // Ensure logs directory exists
  await fs.ensureDir(LOGS_DIR);

  // Run each script and capture errors
  for (const [scriptName, command] of Object.entries(scripts)) {
    if (scriptName === 'test') continue; // Skip test script

    const logFilePath = path.join(LOGS_DIR, `${scriptName}.log`);
    errorReport.scripts[scriptName] = {
      command,
      status: 'pending',
      timestamp: new Date().toISOString(),
      logFile: logFilePath
    };

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 300000 // 5 minutes timeout
      });

      // Write logs to file
      await fs.writeFile(logFilePath, `${stdout}\n${stderr}`);

      if (stderr) {
        errorReport.scripts[scriptName].status = 'completed_with_errors';
        errorReport.scripts[scriptName].error = stderr.toString().trim();
      } else {
        errorReport.scripts[scriptName].status = 'success';
      }
    } catch (error) {
      // Write error logs to file
      await fs.writeFile(logFilePath, error.stack || error.message);

      errorReport.scripts[scriptName].status = 'failed';
      errorReport.scripts[scriptName].error = {
        message: error.message,
        code: error.code,
        signal: error.signal,
        stack: error.stack
      };
    }

    // Update timestamp
    errorReport.scripts[scriptName].timestamp = new Date().toISOString();
  }

  // Save the report
  await fs.writeJson(REPORT_PATH, errorReport, { spaces: 2 });
  console.log(`Error report generated at: ${REPORT_PATH}`);
}

// Run if executed directly
if (require.main === module) {
  runScriptsWithErrorHandling().catch(async (error) => {
    errorReport.systemError = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    await fs.writeJson(REPORT_PATH, errorReport, { spaces: 2 });
    console.error('Failed to generate error report:', error);
    process.exit(1);
  });
}

module.exports = {
  runScriptsWithErrorHandling,
  getErrorReport: () => errorReport
};