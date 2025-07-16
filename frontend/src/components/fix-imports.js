// Script to fix case-sensitive imports in component files
const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname);

// Function to recursively get all JavaScript files in a directory
function getJsFiles(dir) {
  let files = [];
  const dirContents = fs.readdirSync(dir);
  
  dirContents.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getJsFiles(fullPath));
    } else if (file.endsWith('.js')) {
      files.push(fullPath);
    }
  });
  
  return files;
}

// Get all JavaScript files
const jsFiles = getJsFiles(componentsDir);

// Patterns to replace
const replacements = [
  { from: /from ['"]\.\/UI\//g, to: 'from \'./ui/' },
  { from: /from ['"]\.\.\/UI\//g, to: 'from \'../ui/' },
  { from: /from ['"]\.\.\/(.*?)\/Layout\//g, to: 'from \'../$1/layout/' },
  { from: /from ['"]\.\.\/(.*?)\/Dashboard\//g, to: 'from \'../$1/dashboard/' },
  { from: /from ['"]\.\.\/(.*?)\/Deliveries\//g, to: 'from \'../$1/deliveries/' },
  { from: /from ['"]\.\.\/(.*?)\/Deliverers\//g, to: 'from \'../$1/deliverers/' },
  { from: /from ['"]\.\.\/(.*?)\/Users\//g, to: 'from \'../$1/users/' },
  { from: /from ['"]\.\.\/(.*?)\/Analytics\//g, to: 'from \'../$1/analytics/' },
  { from: /from ['"]\.\.\/(.*?)\/Jobs\//g, to: 'from \'../$1/jobs/' },
  { from: /from ['"]\.\.\/(.*?)\/Settings\//g, to: 'from \'../$1/settings/' },
  { from: /from ['"]\.\/Layout\//g, to: 'from \'./layout/' },
  { from: /from ['"]\.\/Dashboard\//g, to: 'from \'./dashboard/' },
  { from: /from ['"]\.\/Deliveries\//g, to: 'from \'./deliveries/' },
  { from: /from ['"]\.\/Deliverers\//g, to: 'from \'./deliverers/' },
  { from: /from ['"]\.\/Users\//g, to: 'from \'./users/' },
  { from: /from ['"]\.\/Analytics\//g, to: 'from \'./analytics/' },
  { from: /from ['"]\.\/Jobs\//g, to: 'from \'./jobs/' },
  { from: /from ['"]\.\/Settings\//g, to: 'from \'./settings/' },
  // Data visualization charts imports
  { from: /from ['"]\.\.\/UI\/data-visualization\/charts\//g, to: 'from \'../ui/data-visualization/charts/' },
  { from: /from ['"]\.\/UI\/data-visualization\/charts\//g, to: 'from \'./ui/data-visualization/charts/' }
];

// Fix imports in each file
let fixedFiles = 0;
jsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed imports in: ${path.relative(componentsDir, file)}`);
    fixedFiles++;
  }
});

console.log(`\nImport paths fixed in ${fixedFiles} files`); 