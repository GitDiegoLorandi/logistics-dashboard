#!/usr/bin/env node

/**
 * This script fixes UI directory imports across the project
 * It replaces '../ui/' with '../UI/' in import statements
 * And removes the duplicate lowercase 'ui' directory
 * 
 * Usage: node fix-ui-imports.js [directory]
 * Example: node fix-ui-imports.js src
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

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

// Check if a directory should be excluded
function shouldExcludeDir(dirname) {
  return EXCLUDED_DIRS.includes(path.basename(dirname));
}

// Check if a file should be processed
function shouldProcessFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return INCLUDED_EXTENSIONS.includes(ext);
}

// Process a file to fix UI imports
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace '../ui/' with '../UI/' in import statements
    const updatedContent = content.replace(/from ['"](.+)\/ui\/(.+)['"]/g, 'from \'$1/UI/$2\'');
    
    // Check if any changes were made
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(chalk.green(`✓ Fixed UI imports in: ${filePath}`));
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

// Remove the lowercase ui directory if it exists and UI directory also exists
function removeLowercaseUiDirectory(baseDir) {
  try {
    const componentsDir = path.join(baseDir, 'components');
    
    if (!fs.existsSync(componentsDir)) {
      console.log(chalk.yellow(`Components directory not found at ${componentsDir}`));
      return false;
    }
    
    const uiDirLower = path.join(componentsDir, 'ui');
    const uiDirUpper = path.join(componentsDir, 'UI');
    
    if (fs.existsSync(uiDirLower) && fs.existsSync(uiDirUpper)) {
      console.log(chalk.blue(`Found both lowercase 'ui' and uppercase 'UI' directories.`));
      
      // On Windows, we need to be careful with case-insensitive file systems
      // First, make sure all files from lowercase ui are in uppercase UI
      const uiFiles = fs.readdirSync(uiDirLower);
      
      uiFiles.forEach(file => {
        const sourcePath = path.join(uiDirLower, file);
        const targetPath = path.join(uiDirUpper, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
          if (!fs.existsSync(targetPath)) {
            // Copy directory recursively
            fs.mkdirSync(targetPath, { recursive: true });
            const nestedFiles = fs.readdirSync(sourcePath);
            nestedFiles.forEach(nestedFile => {
              const nestedSourcePath = path.join(sourcePath, nestedFile);
              const nestedTargetPath = path.join(targetPath, nestedFile);
              fs.copyFileSync(nestedSourcePath, nestedTargetPath);
            });
          }
        } else if (!fs.existsSync(targetPath)) {
          // Copy file
          fs.copyFileSync(sourcePath, targetPath);
        }
      });
      
      // Use a platform-specific command to remove the directory
      // This helps avoid case sensitivity issues on Windows
      try {
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${uiDirLower}"`, { stdio: 'ignore' });
        } else {
          execSync(`rm -rf "${uiDirLower}"`, { stdio: 'ignore' });
        }
        console.log(chalk.green(`✓ Removed duplicate lowercase 'ui' directory`));
        return true;
      } catch (error) {
        console.error(chalk.red(`Error removing lowercase 'ui' directory: ${error.message}`));
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red(`Error handling directories: ${error.message}`));
    return false;
  }
}

// Main function
function main() {
  const targetDir = process.argv[2] || '.';
  const absolutePath = path.resolve(targetDir);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(chalk.red(`Error: Directory '${targetDir}' does not exist`));
    process.exit(1);
  }
  
  console.log(chalk.blue(`Fixing UI imports in: ${absolutePath}`));
  
  const updatedFiles = processDirectory(absolutePath);
  const removedDir = removeLowercaseUiDirectory(absolutePath);
  
  console.log(chalk.green(`Done! Fixed UI imports in ${updatedFiles} files.`));
  if (removedDir) {
    console.log(chalk.green(`Successfully removed duplicate lowercase 'ui' directory.`));
  }
}

main(); 