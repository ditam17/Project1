/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 8px 30px -12px rgba(6, 182, 212, 0.25)",
        "glow-lg": "0 20px 45px -15px rgba(6, 182, 212, 0.3)",
      },
    },
  },
  plugins: [],
};
