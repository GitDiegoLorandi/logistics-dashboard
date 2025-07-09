#!/usr/bin/env node

/**
 * This script checks if all files in a directory follow the kebab-case naming convention.
 * It does not rename files, but reports which files don't follow the convention.
 * 
 * Usage: node enforce-naming-convention.js [directory]
 * Example: node enforce-naming-convention.js src/components
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Directories to exclude
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'coverage',
];

// File extensions to check
const INCLUDED_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.scss',
];

// Files that are allowed to use PascalCase (e.g., React component files)
const PASCAL_CASE_EXCEPTIONS = [
  // Add specific files that are allowed to use PascalCase here
];

// Check if a string follows kebab-case convention
function isKebabCase(str) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}

// Check if a string follows PascalCase convention (for exceptions)
function isPascalCase(str) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

// Check if a file should be checked based on its extension
function shouldCheckFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return INCLUDED_EXTENSIONS.includes(ext);
}

// Check if a directory should be excluded
function shouldExcludeDir(dirname) {
  return EXCLUDED_DIRS.includes(path.basename(dirname));
}

// Check if a file is allowed to use PascalCase
function isExceptionFile(filepath) {
  return PASCAL_CASE_EXCEPTIONS.some(exception => filepath.includes(exception));
}

// Process a directory recursively
function processDirectory(directory) {
  let nonCompliantFiles = [];
  
  function traverse(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        if (!shouldExcludeDir(filePath)) {
          traverse(filePath);
        }
      } else if (stats.isFile() && shouldCheckFile(file)) {
        const filename = path.basename(file, path.extname(file));
        const relativePath = path.relative(directory, filePath);
        
        // Check if the file follows the naming convention
        if (!isKebabCase(filename) && !(isExceptionFile(filePath) && isPascalCase(filename))) {
          nonCompliantFiles.push({
            path: relativePath,
            name: filename
          });
        }
      }
    });
  }
  
  traverse(directory);
  return nonCompliantFiles;
}

// Main function
function main() {
  const targetDir = process.argv[2] || '.';
  const absolutePath = path.resolve(targetDir);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(chalk.red(`Error: Directory '${targetDir}' does not exist`));
    process.exit(1);
  }
  
  console.log(chalk.blue(`Checking naming conventions in: ${absolutePath}`));
  
  const nonCompliantFiles = processDirectory(absolutePath);
  
  if (nonCompliantFiles.length === 0) {
    console.log(chalk.green('✅ All files follow the kebab-case naming convention!'));
  } else {
    console.log(chalk.yellow(`Found ${nonCompliantFiles.length} files that don't follow kebab-case naming convention:`));
    
    nonCompliantFiles.forEach(file => {
      console.log(chalk.yellow(`  - ${file.path} (${file.name})`));
    });
    
    console.log(chalk.blue('\nTo rename these files to kebab-case, run:'));
    console.log(chalk.blue(`  node scripts/rename-to-kebab-case.js ${targetDir}`));
    
    process.exit(1);
  }
}

main(); 