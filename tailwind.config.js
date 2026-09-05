/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7c3aed",
          dark: "#312e81",
          light: "#a78bfa",
        },
        flip: {
          // Compatibility tokens for existing components. The visual palette
          // is deep-indigo, violet, gold and teal instead of marketplace blue.
          blue: "#1e1b4b",
          yellow: "#fbbf24",
          green: "#0f766e",
        },
      },
    },
  },
  plugins: [],
};
