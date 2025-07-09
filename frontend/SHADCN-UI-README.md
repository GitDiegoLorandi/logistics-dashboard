# Shadcn/UI + Tailwind CSS + CSS Grid Implementation Guide

This project uses Shadcn/UI components, Tailwind CSS, and CSS Grid for consistent styling across all pages and sections.

## Setup

The necessary dependencies have been installed. If you need to set up Shadcn/UI in another project, you can run:

```bash
npm run setup-shadcn
```

## Available Components

### Layout Components

- `Grid` and `GridItem`: Use these components for consistent grid layouts.
  ```jsx
  <Grid columns="grid-cols-12" gap="gap-4">
    <GridItem colSpan="col-span-4">Sidebar</GridItem>
    <GridItem colSpan="col-span-8">Main Content</GridItem>
  </Grid>
  ```

### UI Components

- `Button`: A versatile button component with various styles.
  ```jsx
  <Button variant="default">Default Button</Button>
  <Button variant="destructive">Destructive Button</Button>
  <Button variant="outline">Outline Button</Button>
  <Button variant="secondary">Secondary Button</Button>
  <Button variant="ghost">Ghost Button</Button>
  <Button variant="link">Link Button</Button>
  ```

- `Card`: A card component for displaying content in a contained area.
  ```jsx
  <Card>
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Card Description</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Card Content</p>
    </CardContent>
    <CardFooter>
      <Button>Action</Button>
    </CardFooter>
  </Card>
  ```

- `Badge`: A badge component for displaying status or labels.
  ```jsx
  <Badge>Default</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="destructive">Destructive</Badge>
  <Badge variant="outline">Outline</Badge>
  <Badge variant="success">Success</Badge>
  <Badge variant="warning">Warning</Badge>
  <Badge variant="info">Info</Badge>
  ```

## Utility Functions

- `cn`: A utility function for merging Tailwind CSS classes without conflicts.
  ```jsx
  import { cn } from "../lib/utils";

  <div className={cn(
    "base-class",
    condition && "conditional-class",
    "another-class"
  )}>
    Content
  </div>
  ```

## CSS Grid System

The project uses CSS Grid for layouts. Here are some common patterns:

### 12-Column Grid

```jsx
<Grid columns="grid-cols-12" gap="gap-4">
  <GridItem colSpan="col-span-12 md:col-span-6 lg:col-span-4">
    {/* Responsive column that takes full width on mobile, half on medium screens, and one-third on large screens */}
  </GridItem>
</Grid>
```

### Responsive Grid

```jsx
<Grid columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" gap="gap-6">
  {/* Creates a 1-column grid on mobile, 2-column on medium screens, and 3-column on large screens */}
  <GridItem>Item 1</GridItem>
  <GridItem>Item 2</GridItem>
  <GridItem>Item 3</GridItem>
</Grid>
```

## Theme Customization

The theme colors and other design tokens are defined in `tailwind.config.js` and CSS variables in `index.css`. To modify the theme:

1. Update the CSS variables in `index.css` for light/dark mode colors.
2. Extend the Tailwind configuration in `tailwind.config.js` for additional customizations.

## Best Practices

1. **Consistent Components**: Always use the provided UI components rather than creating new ones.
2. **Responsive Design**: Use the responsive variants (`sm:`, `md:`, `lg:`, `xl:`) for different screen sizes.
3. **Grid Layout**: Use the Grid component for layout instead of custom CSS.
4. **Class Merging**: Use the `cn()` utility for merging classes to avoid conflicts.
5. **Dark Mode**: Support dark mode by using the theme variables instead of hardcoded colors.

## Adding New Components

To add more Shadcn/UI components:

1. Create a new file in `src/components/ui/` for the component.
2. Follow the Shadcn/UI pattern of using `cn()` for class merging.
3. Export the component and use it throughout the application.

## Example Page Structure

```jsx
import { Grid, GridItem } from "../components/ui/grid";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

const ExamplePage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Example Page</h1>
      
      <Grid columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" gap="gap-6">
        <GridItem>
          <Card>
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Content for card 1</p>
              <Button className="mt-4">Action</Button>
            </CardContent>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardHeader>
              <CardTitle>Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Content for card 2</p>
              <Button className="mt-4">Action</Button>
            </CardContent>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardHeader>
              <CardTitle>Card 3</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Content for card 3</p>
              <Button className="mt-4">Action</Button>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </div>
  );
};

export default ExamplePage;
``` 