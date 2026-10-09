/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          light: '#25D366',
          dark: '#128C7E',
          darker: '#075E54',
          bg: '#ECE5DD',
          chat: '#DCF8C6',
        }
      }
    },
  },
  plugins: [],
}
