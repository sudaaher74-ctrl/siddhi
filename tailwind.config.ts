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
        background: "#08090c",
        surface: "#0a0c10",
        panel: "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.08)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          hover: "rgba(229, 57, 53, 0.14)",
          subtle: "rgba(229, 57, 53, 0.12)",
        },
        target: {
          gold: "var(--target-gold)",
          red: "var(--target-red)",
          blue: "var(--target-blue)",
          black: "var(--target-black)",
          white: "var(--target-white)",
        },
        gold: "var(--gold)",
        green: "#7ee2a8",
        blue: "var(--blue)",
        text: {
          DEFAULT: "#f2f3f5",
          mid: "#eceded",
          dim: "rgba(255, 255, 255, 0.45)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        dashin: {
          "0%": { strokeDashoffset: "900" },
          "100%": { strokeDashoffset: "0" },
        },
        fadeup: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        pulseCustom: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        dashin: "dashin 1.8s ease-out both",
        fadeup: "fadeup 0.5s both",
        pulseCustom: "pulseCustom 1.6s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
