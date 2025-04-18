/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A', // TracSpend green
          dark: '#15803D', // Darker green
          light: '#22C55E', // Lighter green
        },
        tracspendBg: "#F0FDF4", // Very light green background
        tracspendAccent: "#86EFAC", // Light green accent
        offWhite: "#FAFAFA",
        accentTeal: "#2DD4BF",
        accentPurple: "#A78BFA",
        richBlack: "#1A1A1A"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
