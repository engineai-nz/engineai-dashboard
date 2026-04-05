import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#111111",
        gold: {
          DEFAULT: "#C4A35A",
          foreground: "#000000",
        },
        primary: {
          DEFAULT: "#C4A35A",
          foreground: "#000000",
        },
        text: {
          primary: "#E8E6E1",
          highlight: "#F2EFE8",
          secondary: "#888888",
          muted: "#555555",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      animation: {
        "pulse-gold": "pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { opacity: "1", "box-shadow": "0 0 10px #C4A35A" },
          "50%": { opacity: "0.7", "box-shadow": "0 0 20px #C4A35A" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
