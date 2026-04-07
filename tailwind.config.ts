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
        "card-bg": "rgba(12, 12, 12, 0.84)",
        gold: {
          DEFAULT: "#C4A35A",
          muted: "rgba(196, 163, 90, 0.24)",
        },
        // Teal — secondary accent, reserved for hover / transient
        // interaction states. Gold remains the destination/active
        // colour; teal says "you're touching this". Sourced from
        // BRAND.md (OpenClaw product accent #2B8C8C), brightened
        // slightly for legibility on dark backgrounds.
        teal: {
          DEFAULT: "#3CB5B5",
          deep: "#2B8C8C",
        },
        // Status signals — semantic only, never decorative.
        // Green = healthy/live, red = failure/offline.
        signal: {
          live: "#4CAF50",
          error: "#EF4444",
        },
        primary: {
          DEFAULT: "#E8E6E1",
          foreground: "#0A0A0A",
        },
        secondary: "#888888",
        muted: {
          DEFAULT: "#555555",
          foreground: "rgba(255, 255, 255, 0.04)",
        },
        foreground: "#ffffff",
        border: "rgba(255, 255, 255, 0.07)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "0.5rem",
        md: "1.1rem",
        lg: "1.75rem",
        xl: "1.9rem",
      },
      animation: {
        "pulse-gold": "pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-signal": "pulse-signal 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-up": "fade-up 0.8s ease-out forwards",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { opacity: "1", "border-color": "rgba(196, 163, 90, 0.4)" },
          "50%": { opacity: "0.5", "border-color": "rgba(196, 163, 90, 0.1)" },
        },
        "pulse-signal": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.85)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(1.5rem)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
