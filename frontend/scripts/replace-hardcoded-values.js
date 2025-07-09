#!/usr/bin/env node

/**
 * This script finds and suggests replacements for hard-coded colors and pixel values
 * in the codebase to use Tailwind CSS classes and variables instead.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color mapping from hex to Tailwind CSS variables
const COLOR_MAPPINGS = {
  // Blues
  '#3b82f6': 'text-primary bg-primary border-primary',
  '#60a5fa': 'text-primary bg-primary border-primary',
  '#8884d8': 'text-primary/80 bg-primary/80 border-primary/80',
  
  // Greens
  '#10b981': 'text-success bg-success border-success',
  '#34c759': 'text-success bg-success border-success',
  
  // Ambers/Yellows
  '#f59e0b': 'text-warning bg-warning border-warning',
  '#facc15': 'text-warning bg-warning border-warning',
  
  // Reds
  '#ef4444': 'text-destructive bg-destructive border-destructive',
  '#f87171': 'text-destructive bg-destructive border-destructive',
  
  // Neutrals
  '#ffffff': 'text-background bg-background border-background',
  '#1f2937': 'text-foreground bg-foreground border-foreground',
  '#6b7280': 'text-muted-foreground bg-muted-foreground border-muted-foreground',
  '#4b5563': 'text-muted-foreground bg-muted-foreground border-muted-foreground',
};

// Shadow mappings
const SHADOW_MAPPINGS = {
  '0 1px 2px 0 rgba(0, 0, 0, 0.05)': 'shadow-sm',
  '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)': 'shadow',
  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)': 'shadow-md',
  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)': 'shadow-md',
  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)': 'shadow-lg',
  '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)': 'shadow-xl',
};

// Files to ignore
const IGNORED_FILES = [
  'node_modules',
  'build',
  'dist',
  '.git',
  'package.json',
  'package-lock.json',
];

// Extensions to process
const EXTENSIONS_TO_PROCESS = ['.js', '.jsx', '.css'];

// Find all files in the src directory
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    // Skip ignored files and directories
    if (IGNORED_FILES.some(ignored => filePath.includes(ignored))) {
      return;
    }
    
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else {
      const ext = path.extname(filePath);
      if (EXTENSIONS_TO_PROCESS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Process a file to find and suggest replacements
function processFile(filePath) {
  console.log(`\nProcessing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Find hex colors
  const hexColorRegex = /#[0-9a-fA-F]{3,6}/g;
  const hexMatches = content.match(hexColorRegex) || [];
  
  if (hexMatches.length > 0) {
    console.log(`  Found ${hexMatches.length} hex colors`);
    hexMatches.forEach(match => {
      if (COLOR_MAPPINGS[match]) {
        console.log(`  - ${match} => Use ${COLOR_MAPPINGS[match]} instead`);
        hasChanges = true;
      }
    });
  }
  
  // Find pixel values
  const pixelRegex = /\b\d+px\b/g;
  const pixelMatches = content.match(pixelRegex) || [];
  
  if (pixelMatches.length > 0) {
    console.log(`  Found ${pixelMatches.length} pixel values`);
    pixelMatches.forEach(match => {
      const value = parseInt(match);
      let suggestion = '';
      
      // Suggest Tailwind spacing values
      if (value <= 0) suggestion = '0';
      else if (value <= 1) suggestion = 'px';
      else if (value <= 2) suggestion = '0.5';
      else if (value <= 4) suggestion = '1';
      else if (value <= 6) suggestion = '1.5';
      else if (value <= 8) suggestion = '2';
      else if (value <= 10) suggestion = '2.5';
      else if (value <= 12) suggestion = '3';
      else if (value <= 14) suggestion = '3.5';
      else if (value <= 16) suggestion = '4';
      else if (value <= 20) suggestion = '5';
      else if (value <= 24) suggestion = '6';
      else if (value <= 28) suggestion = '7';
      else if (value <= 32) suggestion = '8';
      else if (value <= 36) suggestion = '9';
      else if (value <= 40) suggestion = '10';
      else if (value <= 44) suggestion = '11';
      else if (value <= 48) suggestion = '12';
      else if (value <= 56) suggestion = '14';
      else if (value <= 64) suggestion = '16';
      else if (value <= 80) suggestion = '20';
      else if (value <= 96) suggestion = '24';
      else if (value <= 112) suggestion = '28';
      else if (value <= 128) suggestion = '32';
      else if (value <= 144) suggestion = '36';
      else if (value <= 160) suggestion = '40';
      else if (value <= 176) suggestion = '44';
      else if (value <= 192) suggestion = '48';
      else if (value <= 208) suggestion = '52';
      else if (value <= 224) suggestion = '56';
      else if (value <= 240) suggestion = '60';
      else if (value <= 256) suggestion = '64';
      else if (value <= 288) suggestion = '72';
      else if (value <= 320) suggestion = '80';
      else if (value <= 384) suggestion = '96';
      else suggestion = `[${value}px]`;
      
      if (suggestion) {
        console.log(`  - ${match} => Use ${suggestion} instead`);
        hasChanges = true;
      }
    });
  }
  
  // Find shadow values
  for (const [shadow, replacement] of Object.entries(SHADOW_MAPPINGS)) {
    if (content.includes(shadow)) {
      console.log(`  - Found shadow: ${shadow} => Use ${replacement} instead`);
      hasChanges = true;
    }
  }
  
  if (!hasChanges) {
    console.log('  No issues found');
  }
  
  return hasChanges;
}

// Main function
function main() {
  console.log('Scanning for hard-coded colors and pixel values...');
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  console.log(`Found ${files.length} files to process`);
  
  let filesWithIssues = 0;
  
  files.forEach(file => {
    const hasIssues = processFile(file);
    if (hasIssues) {
      filesWithIssues++;
    }
  });
  
  console.log(`\nScan complete. Found issues in ${filesWithIssues} files.`);
  console.log('\nTo fix these issues:');
  console.log('1. Replace hex colors with Tailwind CSS color classes');
  console.log('2. Replace pixel values with Tailwind CSS spacing utilities');
  console.log('3. Run ESLint with the tailwindcss plugin to enforce best practices');
  console.log('\nExample commands:');
  console.log('  npm run lint:css');
  console.log('  npm run lint:fix');
}

main(); 