# Accessibility Testing & Fixes Guide

## Overview

This guide documents accessibility testing and fixes for the HaMi Code Việt platform to meet WCAG 2.2 Level AA requirements.

## WCAG 2.2 Level AA Requirements

### Perceivable

1.1 Text Alternatives
1.2 Time-based Media
1.3 Adaptable
1.4 Distinguishable
1.5 Keyboard Accessible

### Operable

2.1 Keyboard Accessible
2.2 No Keyboard Trap
2.3 Timing Adjustable
2.4 Seizures and Physical Reactions
2.5 Navigable
2.6 Focus Visible
2.7 Resize Reflow

### Understandable

3.1 Readable
3.2 Predictable
3.3 Input Assistance
3.4 Identification
3.5 Error Identification
3.6 Error Suggestion

### Robust

4.1 Compatible
4.2 Name, Role, Value
4.3 Status Messages
4.4 Labels
4.5 Error Suggestions

## Testing Tools

### Automated Testing

#### Lighthouse (Chrome DevTools)

```bash
# Run Lighthouse accessibility audit
lighthouse https://hamicodeviet.com --only-categories=accessibility --view
```

#### axe DevTools

```bash
# Install axe DevTools extension
# Run in Chrome DevTools
```

#### axe-core (CLI)

```bash
npm install -g @axe-core/cli
axe https://hamicodeviet.com
```

#### Pa11y

```bash
npm install -g pa11y
pa11y https://hamicodeviet.com
```

### Manual Testing

#### Keyboard Navigation

1. Use Tab to navigate through page
2. Verify focus order is logical
3. Verify all interactive elements are keyboard accessible
4. Verify focus indicator is visible
5. Test Skip to content links

#### Screen Reader Testing

1. Install NVDA (Windows) or VoiceOver (Mac)
2. Navigate page using screen reader
3. Verify content is announced correctly
4. Verify form fields are properly labeled
5. Verify images have alt text

#### Contrast Testing

1. Use Chrome DevTools Color Picker
2. Check contrast ratios for all text
3. Verify WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
4. Use WebAIM Contrast Checker

#### Zoom Testing

1. Zoom page to 200%
2. Verify content is readable
3. Verify layout doesn't break
4. Verify no horizontal scrolling

## Current Accessibility Issues

### Common Issues

1. **Missing Alt Text** - Images without descriptions
2. **Missing Form Labels** - Form inputs without labels
3. **Poor Contrast** - Low contrast text
4. **Keyboard Traps** - Cannot navigate with keyboard
5. **Missing Focus Indicators** - No visible focus
6. **Empty Links** - Links with no text
7. **Missing Headings** - No proper heading structure
8. **Missing Skip Links** - No way to skip navigation

## Automated Testing Setup

### Add to CI/CD

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  accessibility:
    name: Accessibility Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @axe-core/cli
      - name: Test public site
        run: axe https://hamicodeviet.com
      - name: Test app
        run: axe https://app.hamicodeviet.com
      - name: Test admin
        run: axe https://admin.hamicodeviet.com
```

## Accessibility Fixes

### 1. Add Alt Text to Images

**Before:**
```html
<img src="/images/logo.png" />
```

**After:**
```html
<img src="/images/logo.png" alt="HaMi Code Việt logo" />
```

### 2. Add Form Labels

**Before:**
```html
<input type="email" placeholder="Email" />
```

**After:**
```html
<label for="email">Email</label>
<input type="email" id="email" placeholder="Email" />
```

### 3. Improve Contrast

**Before:**
```css
.text {
  color: #888;
  background: #fff;
}
```

**After:**
```css
.text {
  color: #333;
  background: #fff;
}
```

### 4. Add Focus Indicators

```css
:focus-visible {
  outline: 2px solid #00A8CC;
  outline-offset: 2px;
}
```

### 5. Add Skip Links

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #00A8CC;
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 6. Add Heading Structure

```html
<h1>Main heading</h1>
<h2>Section heading</h2>
<h3>Subsection heading</h3>
```

### 7. Add ARIA Labels

```html
<button aria-label="Close dialog">✕</button>
```

### 8. Add Live Regions

```html
<div aria-live="polite" id="status-message"></div>
```

## Astro Accessibility Configuration

### Enable Astro Accessibility

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://hamicodeviet.com',
  build: {
    inlineStylesheets: false,
  },
});
```

### Add Accessibility Plugin

```bash
npx astro add @astrojs/accessibility
```

## Testing Checklist

### Public Website

- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Skip links present
- [ ] Heading structure logical
- [ ] Empty links removed
- [ ] ARIA labels where needed
- [ ] Live regions for dynamic content

### Learning App

- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Error messages accessible
- [ ] Success messages accessible
- [ ] Loading indicators accessible
- [ ] Modal dialogs accessible
- [ ] Dropdown menus accessible

### Admin Panel

- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Data tables accessible
- [ ] Charts/graphs accessible
- [ ] Error messages accessible
- [ ] Success messages accessible

## Accessibility Statement

Create accessibility statement page:

```markdown
# Accessibility Statement

Last updated: 2026-06-24

## Commitment

HaMi Code Việt is committed to ensuring digital accessibility for all users, including people with disabilities.

## Conformance Status

We aim to meet WCAG 2.2 Level AA conformance.

## Testing

We test our platform using:
- Automated tools (Lighthouse, axe)
- Manual keyboard navigation
- Screen reader testing
- Contrast testing

## Feedback

If you encounter accessibility issues, please contact us at:
- Email: support@hamicodeviet.com
- Phone: +84-XXX-XXX-XXXX
```

## References

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/)
- [Lighthouse Accessibility](https://developers.google.com/web/tools/lighthouse/)
- [Astro Accessibility](https://docs.astro.build/en/guides/accessibility/)
