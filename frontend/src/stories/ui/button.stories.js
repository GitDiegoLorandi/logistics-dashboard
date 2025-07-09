import React from 'react';
import { Button } from '../../components/UI/button';
import { LucideArrowRight, LucideLoader2 } from 'lucide-react';

export default {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      defaultValue: 'default',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      defaultValue: 'default',
    },
    disabled: {
      control: 'boolean',
      defaultValue: false,
    },
    asChild: {
      control: 'boolean',
      defaultValue: false,
    },
  },
  parameters: {
    layout: 'centered',
  },
};

// Default button
export const Default = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

// Button variants
export const Variants = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
);

// Button sizes
export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-4">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon">
      <LucideArrowRight className="h-4 w-4" />
    </Button>
  </div>
);

// Button with icon
export const WithIcon = () => (
  <div className="flex flex-wrap gap-4">
    <Button>
      <LucideArrowRight className="mr-2 h-4 w-4" /> Continue
    </Button>
    <Button variant="outline">
      Next <LucideArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
);

// Loading button
export const Loading = () => (
  <div className="flex flex-wrap gap-4">
    <Button disabled>
      <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
    </Button>
    <Button disabled variant="secondary">
      <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
    </Button>
  </div>
);

// Disabled button
export const Disabled = () => (
  <div className="flex flex-wrap gap-4">
    <Button disabled>Disabled</Button>
    <Button disabled variant="destructive">Disabled</Button>
    <Button disabled variant="outline">Disabled</Button>
  </div>
); 