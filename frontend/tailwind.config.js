/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        success: '#10b981',
        failed: '#ef4444',
        missing: '#f59e0b',
      },
    },
  },
  plugins: [],
}
