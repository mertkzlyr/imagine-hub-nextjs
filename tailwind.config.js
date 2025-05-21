module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1fb6ff', // blue
          light: '#67e8f9',   // light blue/turkuaz
          dark: '#009ee0',    // dark blue
        },
        accent: {
          DEFAULT: '#13ce66', // green
          light: '#a7f3d0',   // light green
          dark: '#0f9f4f',    // dark green
        },
        turkuaz: {
          DEFAULT: '#30cfcf',
          light: '#aafafc',
          dark: '#1a8c8c',
        },
        background: '#f9fafb', // minimalist light background
        foreground: '#111827', // minimalist dark text
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}; 