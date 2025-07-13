# Tailwind CSS Guidelines

This document outlines the guidelines and best practices for using Tailwind CSS in our logistics dashboard project.

## Theme Configuration

We use a theme-based approach with CSS variables to maintain consistency across the application. All colors, spacing, and other design tokens are defined in:

- `src/styles/theme.css` - CSS variables for light and dark mode
- `tailwind.config.js` - Tailwind configuration that references these variables

### Color System

Instead of using hard-coded hex values, always use the semantic color variables:

```jsx
// ❌ Don't do this
<div className="text-[#3b82f6] bg-[#ffffff] border-[#ef4444]">...</div>

// ✅ Do this instead
<div className="text-primary bg-background border-destructive">...</div>
```

Our color system includes:

- **Base**: `background`, `foreground`
- **UI**: `primary`, `secondary`, `accent`, `muted`
- **States**: `destructive`, `success`, `warning`, `info`
- **Components**: `card`, `popover`, `border`, `input`, `ring`

Each color has a `-foreground` variant for text that appears on that color.

### Spacing and Sizing

Use Tailwind's spacing scale instead of hard-coded pixel values:

```jsx
// ❌ Don't do this
<div style={{ padding: '16px', marginBottom: '24px' }}>...</div>

// ✅ Do this instead
<div className="p-4 mb-6">...</div>
```

For arbitrary values that don't fit the scale, use square bracket notation:

```jsx
<div className="h-[42px] w-[327px]">...</div>
```

### Typography

Use the configured font size scale:

```jsx
// ❌ Don't do this
<p style={{ fontSize: '14px', lineHeight: '20px' }}>...</p>

// ✅ Do this instead
<p className="text-sm">...</p>
```

Our font size scale:
- `text-xs`: 12px / 16px
- `text-sm`: 14px / 20px
- `text-base`: 16px / 24px
- `text-lg`: 18px / 28px
- `text-xl`: 20px / 28px
- `text-2xl`: 24px / 32px
- `text-3xl`: 30px / 36px
- `text-4xl`: 36px / 40px

## Utility Functions

### Class Merging

Use the `cn()` utility for merging class names:

```jsx
import { cn } from '../lib/utils';

function Button({ className, ...props }) {
  return (
    <button 
      className={cn(
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        className
      )}
      {...props}
    />
  );
}
```

## ESLint Plugin

We use `eslint-plugin-tailwindcss` to enforce best practices:

- Class ordering follows the recommended Tailwind order
- No deprecated classes are used
- No custom class names without corresponding Tailwind config
- No contradicting classes

Run the linter with:

```bash
npm run lint:css
```

## Finding Hard-coded Values

To find hard-coded colors and pixel values in the codebase, run:

```bash
npm run find:hardcoded
```

This will scan the codebase and suggest replacements for hard-coded values.

## Dark Mode

Our application supports dark mode using the `dark:` variant:

```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Dark mode supported content
</div>
```

The theme switcher in `src/components/UI/theme-switcher.js` handles toggling between light, dark, and system preference.

## Component Best Practices

1. **Use semantic color variables** instead of hard-coded colors
2. **Use the spacing scale** instead of hard-coded pixel values
3. **Use responsive variants** (`sm:`, `md:`, `lg:`, `xl:`) for different screen sizes
4. **Use the `cn()` utility** for merging class names
5. **Support dark mode** using the `dark:` variant
6. **Use arbitrary values** (`[value]`) only when necessary

## Examples

### Card Component

```jsx
<div className="rounded-lg border border-border bg-card p-4 shadow-sm dark:border-border/50">
  <h3 className="text-lg font-medium text-card-foreground">Card Title</h3>
  <p className="mt-2 text-sm text-muted-foreground">Card content goes here...</p>
  <div className="mt-4 flex justify-end">
    <button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
      Action
    </button>
  </div>
</div>
```

### Alert Component

```jsx
<div className="rounded-md border border-success/30 bg-success/10 p-4 text-success">
  <div className="flex">
    <CheckCircle className="h-5 w-5 shrink-0" />
    <div className="ml-3">
      <h3 className="text-sm font-medium">Success alert</h3>
      <div className="mt-2 text-sm">
        <p>Your data has been successfully saved.</p>
      </div>
    </div>
  </div>
</div>
``` 