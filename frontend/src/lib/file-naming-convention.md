# File Naming Convention

## Overview
This document establishes consistent file naming conventions for the logistics dashboard application to improve code organization, readability, and maintainability.

## Conventions

### Component Files
- Use **kebab-case** for all component files: `component-name.js`
- Use **kebab-case** for all component directories: `component-group/`
- Component directories should have an `index.js` file that exports all components

### Utility Files
- Use **kebab-case** for all utility files: `utility-name.js`
- Group related utilities in directories with kebab-case names

### Hook Files
- Prefix with `use-` and use kebab-case: `use-custom-hook.js`

### Context Files
- Suffix with `-context` and use kebab-case: `feature-context.js`

### Test Files
- Use the same name as the file being tested with `.test.js` suffix: `component-name.test.js`

### Story Files
- Use the same name as the component with `.stories.js` suffix: `component-name.stories.js`

## Examples

```
src/
  components/
    ui/
      button.js
      button.test.js
      button.stories.js
      data-table/
        data-table.js
        data-table-pagination.js
        index.js
  hooks/
    use-auth.js
    use-form.js
  contexts/
    auth-context.js
  utils/
    date-formatter.js
```

## Migration Plan
1. Create a script to automate renaming files according to convention
2. Update imports across the codebase
3. Update build configurations if necessary
4. Test thoroughly after migration 