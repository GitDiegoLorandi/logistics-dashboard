#!/usr/bin/env node

/**
 * This script renames files to follow the kebab-case naming convention.
 * 
 * Usage: node rename-to-kebab-case.js [directory]
 * Example: node rename-to-kebab-case.js src/components
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

// Convert a string to kebab-case
function toKebabCase(str) {
  return str
    // Handle special case for uppercase acronyms (e.g., API -> api)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    // Handle regular camelCase pattern
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .toLowerCase();
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

// Process a directory recursively and rename files
function processDirectory(directory) {
  console.log(`Scanning directory: ${directory}`);
  
  const files = fs.readdirSync(directory);
  
  // Process files first
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && shouldCheckFile(file)) {
      const filename = path.basename(file, path.extname(file));
      const ext = path.extname(file);
      
      // Skip if already kebab-case or is an exception
      if (isKebabCase(filename) || (isExceptionFile(filePath) && isPascalCase(filename))) {
        console.log(`Renaming: ${file} → ${file}`);
        console.log('  ✓ Success');
        return;
      }
      
      // Convert to kebab-case
      const kebabFilename = toKebabCase(filename);
      const newFilePath = path.join(directory, `${kebabFilename}${ext}`);
      
      console.log(`Renaming: ${file} → ${kebabFilename}${ext}`);
      
      try {
        fs.renameSync(filePath, newFilePath);
        console.log('  ✓ Success');
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
      }
    }
  });
  
  // Then process subdirectories
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory() && !shouldExcludeDir(filePath)) {
      processDirectory(filePath);
    }
  });
}

// Main function
function main() {
  const targetDir = process.argv[2] || '.';
  const absolutePath = path.resolve(targetDir);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(chalk.red(`Error: Directory '${targetDir}' does not exist`));
    process.exit(1);
  }
  
  console.log(chalk.blue(`Converting filenames to kebab-case in: ${absolutePath}`));
  
  processDirectory(absolutePath);
  
  console.log(chalk.green('Done!'));
}

main(); 