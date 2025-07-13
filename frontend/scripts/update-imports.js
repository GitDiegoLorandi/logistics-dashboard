#!/usr/bin/env node

/**
 * This script updates import statements in files after renaming to kebab-case.
 * It scans all JavaScript/TypeScript files and updates import paths.
 * 
 * Usage: node update-imports.js [directory]
 * Example: node update-imports.js src
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

// File extensions to process
const INCLUDED_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
];

// Regular expression to match import statements
// This captures: import { X } from './path/to/File' or import X from './path/to/File'
const IMPORT_REGEX = /import\s+(?:{[^}]*}|\w+)\s+from\s+['"]([^'"]+)['"]/g;

// Convert camelCase or PascalCase to kebab-case
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// Check if a directory should be excluded
function shouldExcludeDir(dirname) {
  return EXCLUDED_DIRS.includes(path.basename(dirname));
}

// Check if a file should be processed
function shouldProcessFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return INCLUDED_EXTENSIONS.includes(ext);
}

// Convert a path to kebab-case
function convertPathToKebabCase(importPath) {
  // Don't convert node_modules or absolute paths
  if (importPath.startsWith('node_modules/') || 
      !importPath.startsWith('.') || 
      importPath.includes('node_modules')) {
    return importPath;
  }
  
  const parts = importPath.split('/');
  
  // Convert each part of the path to kebab-case if it's a file name (not a directory)
  const convertedParts = parts.map((part, index) => {
    // Skip empty parts, dots, or special directories
    if (!part || part === '.' || part === '..' || part === 'node_modules') {
      return part;
    }
    
    // Check if this is the last part (file name)
    const isLastPart = index === parts.length - 1;
    
    // If it's a file name without extension, convert it
    if (isLastPart && !part.includes('.')) {
      return toKebabCase(part);
    }
    
    // If it has an extension, split by dot and convert only the filename
    if (isLastPart && part.includes('.')) {
      const [filename, ...extensions] = part.split('.');
      return `${toKebabCase(filename)}.${extensions.join('.')}`;
    }
    
    // For directories, we also convert to kebab-case
    return toKebabCase(part);
  });
  
  return convertedParts.join('/');
}

// Process a file to update import statements
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;
    
    // Replace import statements
    updatedContent = content.replace(IMPORT_REGEX, (match, importPath) => {
      const kebabCasePath = convertPathToKebabCase(importPath);
      
      if (importPath !== kebabCasePath) {
        hasChanges = true;
        return match.replace(importPath, kebabCasePath);
      }
      
      return match;
    });
    
    // Write changes back to file if needed
    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(chalk.green(`✓ Updated imports in: ${filePath}`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red(`Error processing file ${filePath}: ${error.message}`));
    return false;
  }
}

// Process all files in a directory recursively
function processDirectory(directory) {
  let updatedFiles = 0;
  
  function traverse(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        if (!shouldExcludeDir(filePath)) {
          updatedFiles += traverse(filePath);
        }
      } else if (stats.isFile() && shouldProcessFile(file)) {
        if (processFile(filePath)) {
          updatedFiles++;
        }
      }
    });
    
    return updatedFiles;
  }
  
  return traverse(directory);
}

// Main function
function main() {
  const targetDir = process.argv[2] || '.';
  const absolutePath = path.resolve(targetDir);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(chalk.red(`Error: Directory '${targetDir}' does not exist`));
    process.exit(1);
  }
  
  console.log(chalk.blue(`Updating import statements in: ${absolutePath}`));
  
  const updatedFiles = processDirectory(absolutePath);
  
  console.log(chalk.green(`Done! Updated imports in ${updatedFiles} files.`));
}

main(); 