module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-undef': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // Best Practices
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Style
    indent: ['error', 2, { SwitchCase: 1 }],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // React specific rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',

    // Node.js specific rules
    'no-process-exit': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    // Frontend/React specific configuration
    {
      files: ['frontend/**/*.js', 'frontend/**/*.jsx'],
      env: {
        browser: true,
        es2021: true,
        jest: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
      ],
      plugins: ['react', 'react-hooks'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'warn',
        'react/no-unescaped-entities': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
    },
    // Backend/Node.js specific configuration
    {
      files: ['backend/**/*.js'],
      env: {
        node: true,
        es2021: true,
        jest: true,
      },
      extends: ['eslint:recommended', 'prettier'],
      rules: {
        'no-console': 'off', // Allow console in backend for logging
        'no-process-exit': 'warn',
        'no-path-concat': 'error',
        'handle-callback-err': 'error',
      },
    },
    // Backend scripts and utilities (more lenient)
    {
      files: [
        'backend/src/scripts/**/*.js',
        'backend/test-*.js',
        'backend/src/config/db.js',
        'backend/src/server.js',
      ],
      rules: {
        'no-console': 'off',
        'no-process-exit': 'warn', // Allow in scripts but warn
      },
    },
    // Test files
    {
      files: ['**/*.test.js', '**/__tests__/**/*.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
        'no-process-exit': 'off',
      },
    },
    {
      files: ['**/config/**/*.js', '**/scripts/**/*.js', 'test-*.js'],
      rules: {
        'no-console': 'off', // Allow console in config and scripts
        'no-process-exit': 'warn',
      },
    },
  ],
};
