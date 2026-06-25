/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          DEFAULT: "#00C8E0",
          dim: "#008fa0",
          400: "#00C8E0",
          500: "#00b3c8",
        },
        navy: {
          DEFAULT: "#15202e",
          950: "#0d1a2a",
          900: "#15202e",
          800: "#1a2a3a",
          700: "#1e3448",
          600: "#1e3448",
        },
        silver: {
          DEFAULT: "#c8cfd8",
        },
        surface: "#f4f5f7",
      },
      fontFamily: {
        condensed: ["'Barlow Condensed'", "sans-serif"],
        body: ["'Barlow'", "sans-serif"],
      },
    },
  },
  plugins: [],
}