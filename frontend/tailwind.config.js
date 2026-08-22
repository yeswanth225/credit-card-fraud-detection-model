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
        // Zinc neutrals (primary palette per locked design direction)
        zinc: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1a6',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Risk signals: red-green binary
        risk: {
          fraud: '#ef4444',    // red-500
          clear: '#22c55e',    // green-500
          warning: '#f59e0b',  // amber-500 for pending/review
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Monaco"',
          '"Courier New"',
          'monospace',
        ],
      },
      fontSize: {
        // Type scale per locked design (36px titles down to 12px secondary)
        xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      },
      spacing: {
        // Standard app spacing per awesome-design-md principles
        // 4px baseline grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64...
      },
      borderRadius: {
        // Shape consistency lock: 8px (rounded-lg) throughout
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        // Fintech precision: subtle shadows, tinted to background
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        // No heavy shadows - this is not premium luxury
      },
      zIndex: {
        // Systemic z-index scale per web-design-guidelines
        hide: '-1',
        base: '0',
        sticky: '10',
        dropdown: '20',
        modal: '30',
        tooltip: '40',
        notification: '50',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
