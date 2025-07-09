# Accessibility Checklist

## Overview
This checklist helps ensure our application meets accessibility standards, including WCAG 2.1 AA compliance. Use this guide when developing new features or reviewing existing code.

## Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Focus order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps exist
- [ ] Skip links are provided for navigation
- [ ] Custom components handle keyboard events appropriately

## Semantic HTML

- [ ] Proper HTML5 semantic elements are used (`<nav>`, `<main>`, `<section>`, etc.)
- [ ] Headings follow a logical hierarchy (h1, h2, h3, etc.)
- [ ] Lists are properly structured with `<ul>`, `<ol>`, and `<li>` elements
- [ ] Tables include proper headers and captions
- [ ] Forms have proper labels and fieldsets

## ARIA Attributes

- [ ] ARIA landmarks are used appropriately (`role="navigation"`, `role="main"`, etc.)
- [ ] ARIA attributes supplement HTML semantics when needed
- [ ] `aria-label` or `aria-labelledby` is used for elements without visible labels
- [ ] `aria-expanded`, `aria-haspopup`, and `aria-controls` are used for interactive elements
- [ ] `aria-live` regions are used for dynamic content
- [ ] `aria-hidden="true"` is used for decorative elements

## Forms

- [ ] All form controls have associated labels
- [ ] Required fields are clearly indicated
- [ ] Error messages are linked to their respective fields
- [ ] Form validation provides clear feedback
- [ ] Form submission is possible with keyboard only
- [ ] Autocomplete attributes are used where appropriate

## Images and Media

- [ ] All images have appropriate alt text
- [ ] Decorative images have empty alt text (`alt=""`)
- [ ] Complex images have extended descriptions
- [ ] Videos have captions and transcripts
- [ ] Audio content has transcripts
- [ ] No content relies solely on color to convey information

## Color and Contrast

- [ ] Text has sufficient contrast with its background (4.5:1 for normal text, 3:1 for large text)
- [ ] UI components have sufficient contrast (3:1)
- [ ] Information is not conveyed by color alone
- [ ] Focus indicators have sufficient contrast
- [ ] Text on images has sufficient contrast

## Motion and Animation

- [ ] Animations can be paused or disabled
- [ ] No content flashes more than 3 times per second
- [ ] Motion animations respect `prefers-reduced-motion` setting
- [ ] Carousels and slideshows can be controlled by keyboard

## Text and Typography

- [ ] Text can be resized up to 200% without loss of content
- [ ] Line height is at least 1.5 times the font size
- [ ] Paragraph spacing is at least 2 times the font size
- [ ] Letter spacing is at least 0.12 times the font size
- [ ] Text is not justified
- [ ] Font sizes use relative units (rem, em) rather than pixels

## Screen Reader Support

- [ ] All content is accessible to screen readers
- [ ] Custom components have appropriate ARIA roles and states
- [ ] Dynamic content updates are announced to screen readers
- [ ] Modal dialogs trap focus and are properly announced
- [ ] Icons and SVGs have accessible names
- [ ] Complex widgets follow WAI-ARIA Authoring Practices

## Responsive Design

- [ ] Content is accessible at various viewport sizes
- [ ] Touch targets are at least 44×44 pixels
- [ ] Sufficient spacing between interactive elements
- [ ] Content reflows appropriately at zoom levels up to 400%
- [ ] No horizontal scrolling at viewport widths of 320px or greater

## Testing

- [ ] Automated accessibility testing is performed (using tools like axe, WAVE, etc.)
- [ ] Manual keyboard navigation testing is performed
- [ ] Screen reader testing is performed with at least one screen reader
- [ ] High contrast mode testing is performed
- [ ] Testing at various zoom levels is performed
- [ ] Testing with various input devices is performed

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [The A11Y Project](https://www.a11yproject.com/)
- [Axe DevTools](https://www.deque.com/axe/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility) 