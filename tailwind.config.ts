import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        card: { DEFAULT: "hsl(var(--card))" },
        "tahfidz-green": "#1D9E75",
        "tahfidz-green-light": "#E8F8F2",
        "tahfidz-gold": "#B8860B",
        "tahfidz-gold-light": "#FEF9E7",
        "tahfidz-purple": "#5B4FCF",
        "tahfidz-purple-light": "#F0EEFF",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
