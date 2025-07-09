# Feature-Slice Architecture

This directory follows the Feature-Slice Architecture (FSA) pattern, which organizes code by business domain features rather than technical concerns.

## Structure

Each feature directory should follow this structure:

```
features/
  ├── featureName/              # Feature module
  │   ├── api/                  # API layer for the feature
  │   │   ├── index.js          # API exports
  │   │   └── featureService.js # API service for the feature
  │   ├── components/           # UI components specific to the feature
  │   │   ├── FeatureList.js
  │   │   ├── FeatureForm.js
  │   │   └── ...
  │   ├── hooks/                # Custom hooks for the feature
  │   │   ├── useFeatureData.js
  │   │   └── ...
  │   ├── pages/                # Page components for the feature
  │   │   ├── FeaturePage.js
  │   │   ├── FeatureDetailPage.js
  │   │   └── ...
  │   ├── utils/                # Utility functions for the feature
  │   │   ├── featureHelpers.js
  │   │   └── ...
  │   └── index.js              # Public API for the feature
```

## Guidelines

1. **Isolation**: Features should be isolated from each other. They should not import from other features directly.

2. **Shared Code**: Common code used across features should be placed in the appropriate shared layer:
   - Common UI components → `src/components`
   - Common hooks → `src/hooks`
   - Common utilities → `src/lib`
   - Common API services → `src/services/api`

3. **Public API**: Each feature should expose a clear public API through its `index.js` file.

4. **Feature Boundaries**: Keep feature-specific code within its feature directory. Don't leak implementation details.

5. **Dependency Direction**: Dependencies should flow from specific to general:
   - Features can depend on shared layers
   - Shared layers should not depend on features
   - Features should not depend on other features

## Example Features

- **deliveries**: Delivery management functionality
- **deliverers**: Deliverer management functionality
- **analytics**: Analytics and reporting functionality
- **users**: User management functionality
- **auth**: Authentication and authorization functionality
- **settings**: Application settings functionality 