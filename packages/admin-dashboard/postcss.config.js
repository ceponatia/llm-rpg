/**
 * PostCSS configuration.
 * @type {import('postcss-load-config').Config | { plugins: Record<string, any> }}
 */
export default {
  plugins: {
    // TailwindCSS processor
    tailwindcss: {},
    // Autoprefixer for vendor prefixes
    autoprefixer: {},
  },
};