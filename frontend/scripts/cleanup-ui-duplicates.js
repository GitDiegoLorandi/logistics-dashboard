#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

// Paths
const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const LOWERCASE_UI_DIR = path.join(COMPONENTS_DIR, 'ui');
const UPPERCASE_UI_DIR = path.join(COMPONENTS_DIR, 'UI');

// Check if both directories exist
if (!fs.existsSync(LOWERCASE_UI_DIR)) {
  console.log(chalk.green('No duplicate UI folder found. Nothing to clean up.'));
  process.exit(0);
}

if (!fs.existsSync(UPPERCASE_UI_DIR)) {
  console.log(chalk.yellow('Warning: Only lowercase "ui" directory found, but no uppercase "UI" directory.'));
  console.log(chalk.yellow('This script expects both to exist, with uppercase being the canonical one.'));
  process.exit(1);
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Replace imports from lowercase 'ui' to uppercase 'UI'
    const updatedContent = content.replace(/from ['"]\.\.\/\.\.?\/components\/ui\//g, 'from \'$&'.replace('ui/', 'UI/'));
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(chalk.green(`✓ Fixed UI imports in: ${filePath}`));
      return true;
    }
    return false;
  } catch (error) {
    console.log(chalk.red(`Error processing file ${filePath}: ${error.message}`));
    return false;
  }
}

// Function to recursively walk directories and fix imports
function walkAndFixImports(dir) {
  let updatedFiles = 0;
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and build directories
        if (file !== 'node_modules' && file !== 'build') {
          walk(filePath);
        }
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (fixImportsInFile(filePath)) {
          updatedFiles++;
        }
      }
    }
  }
  
  walk(dir);
  return updatedFiles;
}

// Main execution
console.log(chalk.blue('Starting UI folder cleanup...'));

// Step 1: Fix all imports to use uppercase UI
console.log(chalk.blue('Fixing imports to use uppercase UI directory...'));
const srcDir = path.join(process.cwd(), 'src');
const updatedFiles = walkAndFixImports(srcDir);
console.log(chalk.green(`Done! Updated imports in ${updatedFiles} files.`));

// Step 2: Remove the lowercase ui directory
console.log(chalk.blue('Removing duplicate lowercase "ui" directory...'));
try {
  fs.rmSync(LOWERCASE_UI_DIR, { recursive: true, force: true });
  console.log(chalk.green('✓ Successfully removed duplicate lowercase "ui" directory.'));
} catch (error) {
  console.log(chalk.red(`Error removing directory: ${error.message}`));
  process.exit(1);
}

// Step 3: Run ESLint fix to clean up any remaining issues
console.log(chalk.blue('Running ESLint to fix any remaining issues...'));
try {
  execSync('npx eslint src/components --fix', { stdio: 'inherit' });
  console.log(chalk.green('✓ ESLint fixes applied.'));
} catch (error) {
  console.log(chalk.yellow('Warning: ESLint encountered issues. You may need to fix some imports manually.'));
}

console.log(chalk.green('\n✅ UI folder cleanup completed successfully!')); 