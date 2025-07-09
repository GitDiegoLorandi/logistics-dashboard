#!/usr/bin/env node

/**
 * Component Size Analyzer
 * 
 * This script analyzes React components in the codebase to help identify candidates
 * for code-splitting. It looks at:
 * - File size
 * - Import count
 * - Dependency tree depth
 * - Rendering complexity
 * 
 * Usage:
 *   node scripts/analyze-components.js [directory]
 * 
 * Example:
 *   node scripts/analyze-components.js src/components
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DEFAULT_DIR = 'src/components';
const MIN_SIZE_KB = 5; // Minimum file size to report (in KB)
const IMPORT_THRESHOLD = 10; // Minimum number of imports to flag
const HEAVY_DEPENDENCIES = [
  'chart.js',
  'react-chartjs-2',
  'react-table',
  'react-joyride',
  'react-hook-form',
  'zod',
  '@mui',
  'recharts',
  'three',
  'moment',
  'lodash',
  'd3',
];

// Get target directory from command line args or use default
const targetDir = process.argv[2] || DEFAULT_DIR;
const rootDir = process.cwd();
const fullPath = path.join(rootDir, targetDir);

// Results storage
const results = [];

/**
 * Check if file is a React component
 */
function isReactComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for React import
  const hasReactImport = /import\s+.*React.*from\s+['"]react['"]/i.test(content);
  
  // Check for JSX syntax
  const hasJSX = /<[A-Z][A-Za-z0-9]*|<>/i.test(content);
  
  // Check for component definition patterns
  const isComponent = 
    /function\s+[A-Z][A-Za-z0-9]*\s*\(/i.test(content) || 
    /const\s+[A-Z][A-Za-z0-9]*\s*=\s*\(?/i.test(content) ||
    /class\s+[A-Z][A-Za-z0-9]*\s+extends\s+React\.Component/i.test(content);
  
  return (hasReactImport && (hasJSX || isComponent));
}

/**
 * Count imports in a file
 */
function countImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importLines = content.match(/import\s+.+\s+from\s+['"].+['"]/g) || [];
  
  const heavyImports = HEAVY_DEPENDENCIES.filter(dep => 
    importLines.some(line => line.includes(dep))
  );
  
  return {
    count: importLines.length,
    heavyImports
  };
}

/**
 * Analyze component complexity
 */
function analyzeComplexity(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Count hooks
  const hooksCount = (content.match(/use[A-Z][A-Za-z]+\(/g) || []).length;
  
  // Count JSX elements (rough estimate)
  const jsxCount = (content.match(/<[A-Z][A-Za-z0-9]*|<>/g) || []).length;
  
  // Count state updates
  const stateUpdates = (content.match(/set[A-Z][A-Za-z]+\(/g) || []).length;
  
  // Check for expensive operations
  const hasExpensiveOps = 
    /\.map\(|\.filter\(|\.reduce\(|\.sort\(|for\s*\(|while\s*\(/g.test(content);
  
  return {
    hooksCount,
    jsxCount,
    stateUpdates,
    hasExpensiveOps
  };
}

/**
 * Recursively scan directory for React components
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      scanDirectory(filePath);
    } else if (
      stats.isFile() && 
      (file.endsWith('.js') || file.endsWith('.jsx')) &&
      !file.endsWith('.test.js') &&
      !file.endsWith('.spec.js') &&
      !file.endsWith('.stories.js')
    ) {
      try {
        if (isReactComponent(filePath)) {
          const sizeKB = stats.size / 1024;
          
          if (sizeKB >= MIN_SIZE_KB) {
            const { count: importCount, heavyImports } = countImports(filePath);
            const complexity = analyzeComplexity(filePath);
            
            // Calculate splitting score (higher = better candidate)
            const splittingScore = 
              (sizeKB / 10) + 
              (importCount / 5) + 
              (heavyImports.length * 3) + 
              (complexity.jsxCount / 20) + 
              (complexity.hooksCount) + 
              (complexity.hasExpensiveOps ? 5 : 0);
            
            results.push({
              path: filePath.replace(rootDir + path.sep, ''),
              sizeKB: sizeKB.toFixed(2),
              importCount,
              heavyImports,
              complexity,
              splittingScore: splittingScore.toFixed(1),
              recommendation: splittingScore > 10 ? 'High' : splittingScore > 5 ? 'Medium' : 'Low'
            });
          }
        }
      } catch (err) {
        console.error(`Error analyzing ${filePath}:`, err.message);
      }
    }
  });
}

// Main execution
console.log(`\nAnalyzing React components in ${targetDir}...\n`);

try {
  scanDirectory(fullPath);
  
  // Sort results by splitting score (descending)
  results.sort((a, b) => b.splittingScore - a.splittingScore);
  
  // Print results in a table
  console.log('Code-Splitting Candidates:\n');
  console.log('| Component | Size (KB) | Imports | Heavy Deps | JSX Elements | Hooks | Score | Priority |');
  console.log('|-----------|-----------|---------|------------|-------------|-------|-------|----------|');
  
  results.forEach(result => {
    console.log(
      `| ${result.path} | ${result.sizeKB} KB | ${result.importCount} | ${result.heavyImports.length} | ` +
      `${result.complexity.jsxCount} | ${result.complexity.hooksCount} | ${result.splittingScore} | ${result.recommendation} |`
    );
  });
  
  console.log('\nTop 5 candidates for code-splitting:');
  results.slice(0, 5).forEach((result, i) => {
    console.log(`${i + 1}. ${result.path} (Score: ${result.splittingScore})`);
    if (result.heavyImports.length > 0) {
      console.log(`   Heavy dependencies: ${result.heavyImports.join(', ')}`);
    }
  });
  
  console.log('\nSuggested code-splitting implementation:');
  results.slice(0, 3).forEach(result => {
    const componentName = path.basename(result.path, path.extname(result.path));
    console.log(`
// Before
import ${componentName} from './${componentName}';

// After
const ${componentName} = React.lazy(() => import('./${componentName}'));

// Usage with Suspense
<Suspense fallback={<Skeleton preset="card" />}>
  <${componentName} {...props} />
</Suspense>
`);
  });
  
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
} 