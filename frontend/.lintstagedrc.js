module.exports = {
  // Apply ESLint and Prettier to JS and JSX files
  '*.{js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  // Apply Prettier to JSON, CSS, and MD files
  '*.{json,css,md}': ['prettier --write'],
}; 