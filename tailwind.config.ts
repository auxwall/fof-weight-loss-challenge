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
        background: "#0A0A0A",
        surface: {
          DEFAULT: "#141414",
          card: "#181818",
          hover: "#222222",
          border: "#2A2A2A",
        },
        gymRed: {
          DEFAULT: "#EC1C23",
          hover: "#D6151B",
          dark: "#8F0D12",
          light: "#FF4D53",
          glow: "rgba(236, 28, 35, 0.25)",
        },
        muted: "#9CA3AF",
      },
      boxShadow: {
        "red-glow": "0 0 25px rgba(236, 28, 35, 0.35)",
        "red-glow-lg": "0 0 45px rgba(236, 28, 35, 0.5)",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
