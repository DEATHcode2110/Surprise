/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#795465",
        "primary-container": "#f8c8dc",
        "on-primary": "#ffffff",
        "secondary": "#5c5d6e",
        "secondary-container": "#e1e1f5",
        "background": "#fbf9f5",
        "surface": "#fbf9f5",
        "surface-container": "#efeeea",
        "surface-container-low": "#f5f3ef",
        "on-background": "#1b1c1a",
        "on-surface": "#1b1c1a",
        "outline": "#817478",
        "pink-bow": "#f4a6c1",
        "lavender-bow": "#d3c4e3"
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Quicksand"', 'sans-serif']
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem'
      }
    },
  },
  plugins: [],
}
