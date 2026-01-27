/**
 * Centralized Theme Configuration
 * Define all theme colors here for easy customization
 */

export const themeConfig = {
  light: {
    // Backgrounds
    background: {
      primary: 'bg-gray-50',        // Page backgrounds
      secondary: 'bg-white',        // Card backgrounds
      tertiary: 'bg-gray-100',      // Input/dropdown backgrounds
    },
    // Borders
    border: {
      primary: 'border-gray-200',
      secondary: 'border-gray-300',
    },
    // Text
    text: {
      primary: 'text-gray-900',     // Main headings
      secondary: 'text-gray-700',   // Subheadings, labels
      tertiary: 'text-gray-600',    // Descriptions, meta
    },
    // Interactive states
    hover: {
      background: 'hover:bg-gray-200',
      text: 'hover:text-gray-900',
    },
  },
  dark: {
    // Backgrounds
    background: {
      primary: 'dark:bg-gray-950',
      secondary: 'dark:bg-gray-900',
      tertiary: 'dark:bg-gray-800',
    },
    // Borders
    border: {
      primary: 'dark:border-gray-800',
      secondary: 'dark:border-gray-700',
    },
    // Text
    text: {
      primary: 'dark:text-white',
      secondary: 'dark:text-gray-300',
      tertiary: 'dark:text-gray-400',
    },
    // Interactive states
    hover: {
      background: 'dark:hover:bg-gray-700',
      text: 'dark:hover:text-white',
    },
  },
};

/**
 * Helper function to get combined light/dark theme classes
 */
export function getThemeClass(type: 'background' | 'border' | 'text' | 'hover', variant: 'primary' | 'secondary' | 'tertiary' = 'primary'): string {
  if (type === 'background') {
    return `${themeConfig.light.background[variant]} ${themeConfig.dark.background[variant]}`;
  }
  if (type === 'border') {
    return `${themeConfig.light.border[variant]} ${themeConfig.dark.border[variant]}`;
  }
  if (type === 'text') {
    return `${themeConfig.light.text[variant]} ${themeConfig.dark.text[variant]}`;
  }
  if (type === 'hover') {
    return `${themeConfig.light.hover[variant]} ${themeConfig.dark.hover[variant]}`;
  }
  return '';
}

/**
 * Quick access helpers for common patterns
 */
export const theme = {
  // Page background: bg-gray-50 dark:bg-gray-950
  pageBg: getThemeClass('background', 'primary'),

  // Card background: bg-white dark:bg-gray-900
  cardBg: getThemeClass('background', 'secondary'),

  // Input background: bg-gray-100 dark:bg-gray-800
  inputBg: getThemeClass('background', 'tertiary'),

  // Primary border: border-gray-200 dark:border-gray-800
  border: getThemeClass('border', 'primary'),

  // Secondary border: border-gray-300 dark:border-gray-700
  borderSecondary: getThemeClass('border', 'secondary'),

  // Heading text: text-gray-900 dark:text-white
  textHeading: getThemeClass('text', 'primary'),

  // Body text: text-gray-700 dark:text-gray-300
  textBody: getThemeClass('text', 'secondary'),

  // Meta text: text-gray-600 dark:text-gray-400
  textMuted: getThemeClass('text', 'tertiary'),

  // Hover background: hover:bg-gray-200 dark:hover:bg-gray-700
  hoverBg: getThemeClass('hover', 'background'),

  // Hover text: hover:text-gray-900 dark:hover:text-white
  hoverText: getThemeClass('hover', 'text'),
};

/**
 * Brand colors (independent of theme)
 */
export const brandColors = {
  orange: '#FF6600',
  teal: '#3D9991',
  blue: '#4BAAD8',
};
