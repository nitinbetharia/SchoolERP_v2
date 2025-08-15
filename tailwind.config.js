/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/web/views/**/*.ejs", 
    "./src/web/public/js/**/*.js",
    "./src/**/*.ts"
  ],
  theme: { 
    extend: {
      // Multi-tenant theming via CSS custom properties
      colors: {
        'tenant-primary': 'var(--tenant-primary, #3b82f6)',
        'tenant-secondary': 'var(--tenant-secondary, #64748b)', 
        'tenant-accent': 'var(--tenant-accent, #10b981)',
        'tenant-bg': 'var(--tenant-bg, #f8fafc)',
        'tenant-text': 'var(--tenant-text, #1f2937)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    } 
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};