# Internationalization (i18n) Guide

This guide explains how internationalization is implemented in the Logistics Dashboard application.

## Overview

The application uses `react-i18next` for internationalization, allowing all text to be translated into multiple languages. This improves accessibility and user experience for international users.

## Key Features

- Multiple language support (currently English and Spanish)
- Namespace organization for better translation management
- Automatic language detection
- Language switcher component
- Extended translation hooks with additional functionality
- Formatting utilities for dates, numbers, and currencies

## Project Structure

```
frontend/
├── public/
│   └── locales/           # Translation files
│       ├── en/            # English translations
│       │   ├── common.json
│       │   ├── auth.json
│       │   ├── dashboard.json
│       │   └── ...
│       └── es/            # Spanish translations
│           ├── common.json
│           ├── auth.json
│           └── ...
├── src/
│   ├── i18n/
│   │   └── config.js      # i18n configuration
│   ├── hooks/
│   │   └── useTranslation.js  # Custom translation hooks
│   └── components/
│       └── UI/
│           └── LanguageSwitcher.js  # Language switcher component
```

## Translation Files

Translations are organized into namespaces:

- **common.json**: Shared translations used throughout the application
- **auth.json**: Authentication-related translations
- **dashboard.json**: Dashboard-specific translations
- **deliveries.json**: Delivery-related translations
- etc.

## Usage

### Basic Translation

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('title')}</h1>;
}
```

### Using Multiple Namespaces

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['common', 'dashboard']);
  
  return (
    <div>
      <h1>{t('dashboard:title')}</h1>
      <button>{t('common:actions.save')}</button>
    </div>
  );
}
```

### Using Our Custom Hook

```jsx
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t, tOr, ns } = useTranslation('common');
  
  return (
    <div>
      {/* Basic translation */}
      <h1>{t('title')}</h1>
      
      {/* With fallback */}
      <p>{tOr('description', 'Default description')}</p>
      
      {/* From another namespace */}
      <button>{ns('auth', 'login.signIn')}</button>
    </div>
  );
}
```

### Formatting

```jsx
import { useFormatting } from '../hooks/useTranslation';

function MyComponent() {
  const { formatDate, formatNumber, formatCurrency } = useFormatting();
  
  return (
    <div>
      <p>Date: {formatDate(new Date(), { dateStyle: 'full' })}</p>
      <p>Number: {formatNumber(1000)}</p>
      <p>Price: {formatCurrency(19.99, 'USD')}</p>
    </div>
  );
}
```

### Language Switcher

The language switcher component is available for users to change the application language:

```jsx
import LanguageSwitcher from '../components/UI/LanguageSwitcher';

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <LanguageSwitcher />
    </header>
  );
}
```

## Translation Parameters

You can pass parameters to translations:

```jsx
// Translation file
{
  "welcome": "Welcome, {{name}}!"
}

// In your component
t('welcome', { name: 'John' }) // "Welcome, John!"
```

## Pluralization

```jsx
// Translation file
{
  "items_zero": "No items",
  "items_one": "{{count}} item",
  "items_other": "{{count}} items"
}

// In your component
t('items', { count: 0 }) // "No items"
t('items', { count: 1 }) // "1 item"
t('items', { count: 2 }) // "2 items"
```

## Adding a New Language

1. Create a new folder under `public/locales/` with the language code (e.g., `fr` for French)
2. Copy the JSON files from the `en` folder to the new folder
3. Translate the content of each file
4. Add the language to the `languages` array in `LanguageSwitcher.js`

## Extracting Translations

Use the i18next-scanner to automatically extract translation keys from your code:

```bash
npm run extract-translations
```

## Best Practices

1. **Use namespaces** to organize translations logically
2. **Keep translation keys hierarchical** for better organization
3. **Use parameters** instead of concatenating strings
4. **Provide context** for translators when necessary
5. **Use pluralization** for countable items
6. **Extract all hardcoded strings** into translation files
7. **Test with different languages** to ensure layout works with varying text lengths

## Additional Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Internationalization Best Practices](https://phrase.com/blog/posts/react-i18n-best-practices/) 