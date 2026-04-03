/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // Feature card gradients
    "from-blue-100",
    "to-blue-50",
    "from-green-100",
    "to-green-50",
    "from-purple-100",
    "to-purple-50",
    "from-orange-100",
    "to-orange-50",

    // Feature card backgrounds
    "bg-blue-100",
    "bg-green-100",
    "bg-purple-100",
    "bg-orange-100",

    // Feature card text colors
    "text-blue-700",
    "text-green-700",
    "text-purple-700",
    "text-orange-700",

    // Gradient direction
    "bg-gradient-to-br",
    "bg-gradient-to-r",
  ],
};
