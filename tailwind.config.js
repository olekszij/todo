/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom theme colors
        'theme': {
          'background': 'var(--color-background)',
          'surface': 'var(--color-surface)',
          'text': 'var(--color-text)',
          'primary': 'var(--color-primary)',
        }
      }
    },
  },
  plugins: [],
}
