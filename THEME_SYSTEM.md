# Theme System Documentation 🎨

## Overview

TaskFlow now includes a comprehensive theme system with support for light, dark, and auto themes. The system automatically detects user preferences and provides smooth transitions between themes.

## ✨ Features

### 🌓 Theme Modes
- **Light Theme**: Clean, bright interface for daytime use
- **Dark Theme**: Easy on the eyes for low-light environments
- **Auto Theme**: Automatically follows system preferences

### 🎯 Key Features
- **Automatic detection** of system theme preference
- **Smooth transitions** between themes
- **Persistent storage** of user preference
- **Mobile-friendly** theme switching
- **Accessible** with proper contrast ratios

## 🏗️ Architecture

### File Structure
```
src/
├── themes/
│   └── index.ts              # Theme definitions and utilities
├── contexts/
│   ├── ThemeContext.ts       # Context type definitions
│   └── ThemeProvider.tsx     # Theme provider component
├── hooks/
│   └── useTheme.ts           # Theme hook
└── components/
    └── ui/
        └── ThemeToggle.tsx   # Theme toggle components
```

### Core Components

#### 1. Theme Definitions (`src/themes/index.ts`)
```typescript
export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  primary: string;
  // ... more color definitions
}

export const themes: Record<Theme, ThemeColors> = {
  light: { /* light theme colors */ },
  dark: { /* dark theme colors */ },
  auto: { /* auto theme fallback */ }
};
```

#### 2. Theme Context (`src/contexts/ThemeContext.ts`)
```typescript
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
}
```

#### 3. Theme Provider (`src/contexts/ThemeProvider.tsx`)
- Manages theme state
- Applies CSS custom properties
- Handles system theme changes
- Persists theme preference

#### 4. Theme Hook (`src/hooks/useTheme.ts`)
```typescript
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## 🎨 Theme Components

### ThemeToggle Component
Two variants available:

#### 1. Full Theme Toggle
```tsx
<ThemeToggle showLabels={true} />
```
Shows all three theme options (Light, Dark, Auto) with labels.

#### 2. Simple Theme Toggle
```tsx
<SimpleThemeToggle />
```
Simple toggle between light and dark themes.

### Usage Examples
```tsx
import { ThemeToggle, SimpleThemeToggle } from './components/ui/ThemeToggle';

// In your component
function Header() {
  return (
    <header>
      <h1>TaskFlow</h1>
      <SimpleThemeToggle />
    </header>
  );
}
```

## 🎯 Implementation Details

### CSS Custom Properties
The theme system uses CSS custom properties for dynamic theming:

```css
:root {
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-text: #111827;
  --color-primary: #3b82f6;
  /* ... more properties */
}

.dark {
  --color-background: #111827;
  --color-surface: #1f2937;
  --color-text: #f9fafb;
  --color-primary: #60a5fa;
  /* ... more properties */
}
```

### Tailwind Integration
Tailwind CSS is configured to use the `class` strategy for dark mode:

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'theme': {
          'background': 'var(--color-background)',
          'surface': 'var(--color-surface)',
          'text': 'var(--color-text)',
          'primary': 'var(--color-primary)',
        }
      }
    },
  },
}
```

### System Theme Detection
```typescript
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
```

## 🚀 Usage Guide

### 1. Setup Theme Provider
```tsx
// App.tsx
import { ThemeProvider } from './contexts/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. Use Theme in Components
```tsx
import { useTheme } from '../hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, toggleTheme, isDark, colors } = useTheme();
  
  return (
    <div style={{ backgroundColor: colors.background }}>
      <button onClick={toggleTheme}>
        Switch to {isDark ? 'light' : 'dark'} mode
      </button>
    </div>
  );
}
```

### 3. Apply Theme Classes
```tsx
// Use Tailwind dark mode classes
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content
</div>

// Or use custom theme colors
<div className="bg-theme-background text-theme-text">
  Content
</div>
```

## 🎨 Color Palette

### Light Theme
- **Background**: `#ffffff` (Pure white)
- **Surface**: `#f9fafb` (Light gray)
- **Text**: `#111827` (Dark gray)
- **Primary**: `#3b82f6` (Blue)
- **Border**: `#e5e7eb` (Light gray)

### Dark Theme
- **Background**: `#111827` (Dark gray)
- **Surface**: `#1f2937` (Medium gray)
- **Text**: `#f9fafb` (Light gray)
- **Primary**: `#60a5fa` (Light blue)
- **Border**: `#374151` (Medium gray)

### Status Colors
- **Success**: `#10b981` / `#34d399`
- **Warning**: `#f59e0b` / `#fbbf24`
- **Error**: `#ef4444` / `#f87171`
- **Info**: `#3b82f6` / `#60a5fa`

## 🔧 Customization

### Adding New Colors
1. Update `ThemeColors` interface in `src/themes/index.ts`
2. Add color values to each theme object
3. Apply CSS custom properties in `ThemeProvider`
4. Use in components with Tailwind classes

### Creating Custom Themes
```typescript
// Add new theme
export const themes = {
  light: { /* ... */ },
  dark: { /* ... */ },
  auto: { /* ... */ },
  custom: {
    background: '#your-color',
    surface: '#your-color',
    // ... more colors
  }
};
```

### Theme Transitions
All theme changes include smooth transitions:

```css
/* Applied automatically by ThemeProvider */
* {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

## 📱 Mobile Considerations

### Touch Targets
- Theme toggle buttons are minimum 44px for touch accessibility
- Proper hover and active states for mobile interaction

### Performance
- Theme changes are optimized for smooth 60fps transitions
- CSS custom properties provide efficient theme switching
- No layout shifts during theme changes

## ♿ Accessibility

### Contrast Ratios
- All color combinations meet WCAG 2.1 AA standards
- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text

### Screen Reader Support
- Proper ARIA labels on theme toggle buttons
- Semantic HTML structure
- Keyboard navigation support

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

## 🧪 Testing

### Manual Testing
1. **Theme Switching**: Test all three theme modes
2. **System Theme**: Change system theme with auto mode enabled
3. **Persistence**: Refresh page and verify theme preference
4. **Transitions**: Verify smooth theme transitions
5. **Mobile**: Test on mobile devices

### Automated Testing
```typescript
// Example test
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeProvider';
import { SimpleThemeToggle } from '../components/ui/ThemeToggle';

test('theme toggle switches between light and dark', () => {
  render(
    <ThemeProvider>
      <SimpleThemeToggle />
    </ThemeProvider>
  );
  
  const toggle = screen.getByRole('button');
  fireEvent.click(toggle);
  
  expect(document.documentElement).toHaveClass('dark');
});
```

## 🔮 Future Enhancements

### Planned Features
- **Custom theme creation** - User-defined themes
- **Theme scheduling** - Automatic theme switching by time
- **Theme presets** - Quick theme switching
- **Color customization** - Adjust individual colors

### Possible Improvements
- **Theme animations** - More sophisticated transitions
- **Theme sharing** - Export/import theme preferences
- **Theme analytics** - Track theme usage patterns
- **Advanced theming** - Component-level theme overrides

## 📚 Resources

### Related Documentation
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Browser Support
- **Chrome**: 49+ (Full support)
- **Firefox**: 31+ (Full support)
- **Safari**: 9.1+ (Full support)
- **Edge**: 15+ (Full support)

The theme system provides a solid foundation for creating beautiful, accessible, and user-friendly interfaces! 🎨✨ 