/**
 * Tailwind configuration
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
  safelist: [
    // Dynamic color classes for charts and indicators
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-500',
    'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-400', 'bg-green-500',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-200', 'bg-purple-400', 'bg-purple-500',
    'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-400', 'bg-red-500',
    'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200', 'bg-yellow-400', 'bg-yellow-500',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-200', 'bg-orange-400', 'bg-orange-500',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-400', 'bg-gray-500',
    'text-blue-600', 'text-blue-700', 'text-blue-800',
    'text-green-600', 'text-green-700', 'text-green-800',
    'text-purple-600', 'text-purple-700', 'text-purple-800',
    'text-red-600', 'text-red-700', 'text-red-800',
    'text-yellow-600', 'text-yellow-700', 'text-yellow-800',
    'text-orange-600', 'text-orange-700', 'text-orange-800',
    'text-gray-600', 'text-gray-700', 'text-gray-800',
    'border-blue-200', 'border-green-200', 'border-purple-200',
    'border-red-200', 'border-yellow-200', 'border-orange-200', 'border-gray-200'
  ]
};