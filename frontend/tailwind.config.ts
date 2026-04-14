import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            background: "#0a0a0a",
            foreground: "#ffffff",
            primary: {
              DEFAULT: "#C9A84C",
              foreground: "#0a0a0a",
            },
            focus: "#C9A84C",
          },
        },
      },
    }),
  ],
};

export default config;
