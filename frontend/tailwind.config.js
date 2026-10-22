/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0b0f17",
        bgElev: "#111726",
        bgCard: "#141b2c",
        border: "#232d42",
        text: "#e7ebf3",
        text2: "#93a0ba",
        amber: "#e3a53d",
        up: "#38b775",
        down: "#e2574c",
      },
    },
  },
  plugins: [],
};
