/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Kanit"', "sans-serif"],
        serif: ['"Nanum Myeongjo"', "serif"],
      },
      colors: {
        void: "#0a0b12",
        abyss: "#111320",
        mana: "#7c3aed",
        "mana-dark": "#4c1d95",
        gold: "#f59e0b",
        crimson: "#dc2626",
        border: "rgba(255, 255, 255, 0.08)",
        muted: "#9ca3af",
      },
      opacity: {
        8: "0.08",
      },
    },
  },
  plugins: [],
};
