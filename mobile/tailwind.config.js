/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#141414",
        card: "#1A1A1A",
        border: "#2A2A2A",
        primary: "#C8FF00",
        "primary-dim": "#9ABF00",
        accent: "#FF3CAC",
        "accent-blue": "#784BA0",
        text: {
          primary: "#FFFFFF",
          secondary: "#A0A0A0",
          muted: "#606060",
        },
        success: "#00FF87",
        warning: "#FFB800",
        error: "#FF4444",
      },
      fontFamily: {
        sans: ["Inter", "System"],
        bold: ["Inter-Bold", "System"],
        mono: ["SpaceMono", "System"],
      },
    },
  },
  plugins: [],
};
