/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0b0b0c",
        bgElev: "#151515",
        bgCard: "#171717",
        border: "#302a1d",
        text: "#f1f0eb",
        text2: "#a7a19a",
        amber: "#d7a83f",
        up: "#36c78a",
        down: "#ed6a6a",
      },
    },
  },
  plugins: [],
};
