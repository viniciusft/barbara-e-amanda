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
        foreground: "#F5F0E8",
        gold: {
          DEFAULT: "#C9A84C",
          light:   "#E2C97E",
          dark:    "#A07830",
          muted:   "#C9A84C26",
        },
        surface: {
          DEFAULT: "#111111",
          card:    "#1A1A1A",
          elevated:"#222222",
          border:  "#2A2A2A",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderColor: {
        gold: "#C9A84C",
        "gold-dim": "rgba(201,168,76,0.3)",
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
