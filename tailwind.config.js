/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // WORKB Brand Colors
        primary: '#2563EB',      // Blue-600
        secondary: '#10B981',    // Emerald-500
        background: '#F9FAFB',   // Gray-50
        surface: '#FFFFFF',
        accent: '#8B5CF6',       // Violet-500
        danger: '#DC2626',       // Red-600
        warning: '#F59E0B',      // Amber-500
        success: '#10B981',      // Emerald-500
        textPrimary: '#111827',  // Gray-900
        textSecondary: '#6B7280', // Gray-500
        border: '#E5E7EB',       // Gray-200
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
