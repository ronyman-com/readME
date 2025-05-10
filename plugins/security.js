import { promises as fs } from 'fs';
import path from 'path';

const requiredStructure = {
    rootFiles: ['*.js', 'License', 'package.json', 'README.md'],
    templates: {
        base: path.join('templates', 'default', 'layouts'),
        required: true
    }
};

export async function validatePluginStructure(pluginPath) {
    const pluginName = path.basename(pluginPath);
    const result = {
        plugin: pluginName,
        path: pluginPath,
        valid: true,
        checks: [],
        errors: [],
        jsFiles: [] // Track found JS files
    };

    // Check root level files
    for (const filePattern of requiredStructure.rootFiles) {
        if (filePattern === '*.js') {
            // Check for any .js files in plugin root
            try {
                const files = await fs.readdir(pluginPath);
                const jsFiles = files.filter(f => f.endsWith('.js'));
                
                if (jsFiles.length === 0) {
                    result.checks.push({
                        type: 'file',
                        pattern: '*.js',
                        path: pluginPath,
                        exists: false
                    });
                    result.valid = false;
                    result.errors.push('No JavaScript files found in plugin root');
                } else {
                    result.jsFiles = jsFiles; // Store found JS files
                    result.checks.push({
                        type: 'file',
                        pattern: '*.js',
                        path: pluginPath,
                        exists: true,
                        foundFiles: jsFiles
                    });
                }
            } catch (err) {
                result.checks.push({
                    type: 'file',
                    pattern: '*.js',
                    path: pluginPath,
                    exists: false,
                    error: err.message
                });
                result.valid = false;
                result.errors.push(`Error checking for JS files: ${err.message}`);
            }
        } else {
            // Check for other required files
            const filePath = path.join(pluginPath, filePattern);
            try {
                await fs.access(filePath);
                result.checks.push({
                    type: 'file',
                    name: filePattern,
                    path: filePath,
                    exists: true
                });
            } catch {
                result.checks.push({
                    type: 'file',
                    name: filePattern,
                    path: filePath,
                    exists: false
                });
                result.valid = false;
                result.errors.push(`Missing required file: ${filePattern}`);
            }
        }
    }

    // Check templates directory structure
    if (requiredStructure.templates.required) {
        const templatesPath = path.join(pluginPath, requiredStructure.templates.base);
        
        try {
            await fs.access(templatesPath);
            const templateItems = await fs.readdir(templatesPath);
            
            result.checks.push({
                type: 'directory',
                name: 'templates',
                path: templatesPath,
                exists: true,
                hasContent: templateItems.length > 0
            });

            if (templateItems.length === 0) {
                result.valid = false;
                result.errors.push('Templates directory exists but is empty');
            }
        } catch (err) {
            result.checks.push({
                type: 'directory',
                name: 'templates',
                path: templatesPath,
                exists: false,
                error: err.message
            });
            result.valid = false;
            result.errors.push(`Missing templates directory: ${err.message}`);
        }
    }

    return result;
}

export async function generateSecurityReport(results, outputPath) {
    const report = {
        timestamp: new Date().toISOString(),
        generatedBy: 'readme-plugin-validator',
        stats: {
            totalPlugins: results.length,
            validPlugins: results.filter(r => r.valid).length,
            invalidPlugins: results.filter(r => !r.valid).length
        },
        plugins: results.map(plugin => ({
            name: plugin.plugin,
            path: plugin.path,
            isValid: plugin.valid,
            jsFiles: plugin.jsFiles,
            errors: plugin.errors,
            checks: plugin.checks
        }))
    };

    try {
        // Ensure output directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        
        // Write JSON report
        await fs.writeFile(
            outputPath, 
            JSON.stringify(report, null, 2),
            'utf-8'
        );
        
        console.log(`Validation report saved to: ${outputPath}`);
    } catch (err) {
        console.error('Failed to generate security report:', err);
        throw err;
    }
}