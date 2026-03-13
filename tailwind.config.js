/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: '#FFFFFF',
        app: '#F3F4F6',
        primary: '#111827',
        border: '#E5E7EB',
        muted: '#9CA3AF',
        subtle: '#6B7280',
        accent: '#FAFAFA',
      },
    },
  },
  plugins: [],
}
