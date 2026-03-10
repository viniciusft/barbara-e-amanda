import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "var(--text-primary)",
        gold: {
          DEFAULT: "var(--gold)",
          light:   "var(--gold-light)",
          dark:    "var(--gold-dark)",
          muted:   "var(--gold-muted)",
        },
        surface: {
          DEFAULT:  "var(--surface)",
          card:     "var(--surface-card)",
          elevated: "var(--surface-elevated)",
          border:   "var(--surface-border)",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderColor: {
        gold: "var(--gold)",
        "gold-dim": "var(--gold-muted)",
      },
      borderRadius: {
        card:  "16px",
        btn:   "8px",
        badge: "6px",
      },
      boxShadow: {
        card:  "0 2px 12px rgba(0,0,0,0.4)",
        modal: "0 8px 32px rgba(0,0,0,0.6)",
        gold:  "0 0 0 2px rgba(201,168,76,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
