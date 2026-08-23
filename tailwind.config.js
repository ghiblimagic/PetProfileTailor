/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    /*https://www.youtube.com/watch?v=kap8xrWMNDM&ab_channel=simonswiss */
    /*https://tailwindcss.com/docs/guides/nextjs*/
  ],
  theme: {
    extend: {
      fontSize: {
        "3xl": "1.953rem",
        "4xl": "2.441rem",
        "5xl": "3.052rem",
      },
      colors: {
        secondary2: "#140223",
        subtleBackground: "#3154bd", //"rgb(99,64,153)",
        subtleWhite: "oklch(0.88 0.005 260 / <alpha-value>)",
        cardBorder: "oklch(26% 0.015 260)", // faint card/divider border from the design reference
        // GeneralButton palette — see docs/notes/components/reusable-buttons.md
        // Named "buttonAccent" (not "accent") to avoid colliding with the
        // pre-existing shadcn `accent: { DEFAULT: "hsl(var(--accent))", ... }`
        // token below — a same-name key later in this object silently wins,
        // and that shadcn `--accent` CSS var resolves to a near-white gray
        // (styles/globals.css), which is why an earlier "accent" here was
        // rendering hover states as grey/white instead of blue.
        buttonAccent: "oklch(62% 0.16 264 / <alpha-value>)", // hover/active text & outline accent, derived from subtleBackground
        accentFill: "oklch(38% 0.16 264 / <alpha-value>)", // solid hover fill behind light text
        accentFillBorder: "oklch(24% 0.14 264 / <alpha-value>)", // border paired with accentFill
        outlineBorder: "oklch(50% 0.02 260 / <alpha-value>)", // visible neutral border for outline-only buttons
        warningHover: "#6b1717", // darker step for the warning/destructive hover state
        disabledBg: "oklch(20% 0.01 260 / <alpha-value>)",
        disabledText: "oklch(82% 0.01 260 / <alpha-value>)",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        secondaryColor: "rgb(243 232 255 / var(--tw-bg-opacity, 1))",
        errorBackgroundColor: "rgb(30 41 59 / var(--tw-bg-opacity, 1))",
        errorTextColor: "rgb(255 255 255 / var(--tw-bg-opacity, 1))",
        errorBorderColor: "rgb(241 245 249 / var(--tw-bg-opacity, 1))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#050816", //darkest purple //"#0c0516"
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#07083b", //"#1b073b", // slightly lighter
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        shiki: {
          light: "var(--shiki-light)",
          "light-bg": "var(--shiki-light-bg)",
          dark: "var(--shiki-dark)",
          "dark-bg": "var(--shiki-dark-bg)",
        },
      },
      fontFamily: {
        sans: ['"Comfortaa"', "sans-serif"],
        heading: [
          "var(--font-fredoka)",
          "ui-rounded",
          '"Comic Sans MS"',
          "sans-serif",
        ],
      },
      width: {
        "30rem": "40rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "typing-dot-bounce": {
          "0%,40%": {
            transform: "translateY(0)",
          },
          "20%": {
            transform: "translateY(-0.25rem)",
          },
        },
      },
      animation: {
        "typing-dot-bounce": "typing-dot-bounce 1.25s ease-out infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("daisyui"),
    require("@tailwindcss/forms"),
    require("tailwindcss-animate"),
  ],
};
