/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn/ui colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Custom semantic colors that map to slate
        'app-surface': {
          primary: 'rgb(var(--color-surface-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-surface-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-surface-tertiary) / <alpha-value>)',
        },
        'app-interactive': {
          primary: 'rgb(var(--color-interactive-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-interactive-primary-hover) / <alpha-value>)',
          secondary: 'rgb(var(--color-interactive-secondary) / <alpha-value>)',
          'secondary-hover': 'rgb(var(--color-interactive-secondary-hover) / <alpha-value>)',
          disabled: 'rgb(var(--color-interactive-disabled) / <alpha-value>)',
        },
        'app-text': {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        },
        'app-border': {
          primary: 'rgb(var(--color-border-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-border-secondary) / <alpha-value>)',
          focus: 'rgb(var(--color-border-focus) / <alpha-value>)',
        },
        'app-semantic': {
          success: 'rgb(var(--color-semantic-success) / <alpha-value>)',
          error: 'rgb(var(--color-semantic-error) / <alpha-value>)',
          warning: 'rgb(var(--color-semantic-warning) / <alpha-value>)',
          info: 'rgb(var(--color-semantic-info) / <alpha-value>)',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
