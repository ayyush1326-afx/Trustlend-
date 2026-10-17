/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0F1A",
        surface: {
          DEFAULT: "#111827",
          subtle: "#161F33",
          hover: "#1E293B",
          card: "rgba(17, 24, 39, 0.65)",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          glass: "rgba(255, 255, 255, 0.12)",
          active: "rgba(99, 102, 241, 0.4)",
        },
        tier: {
          newcomer: "#94A3B8", // Slate
          bronze: "#F59E0B",   // Amber
          silver: "#CBD5E1",   // Silver-zinc
          gold: "#FACC15",     // Yellow gold
          platinum: "#22D3EE", // Cyan
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.3)",
        cyanGlow: "0 0 25px -5px rgba(34, 211, 238, 0.3)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
