/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // ConstructAid.net color scheme
        ca: {
          orange: '#FF6600', // Safety orange
          'orange-dark': '#e55a00',
          'orange-light': '#ff8033',
          teal: '#3D9991',
          'teal-dark': '#2d7a73',
          'teal-light': '#52ada5',
          blue: '#4BAAD8',
          'blue-dark': '#3a8fb5',
          'blue-light': '#6dbce2',
          dark: '#030E27',
          'dark-secondary': '#1F1F1F',
        },
        primary: {
          orange: '#FF6600', // Safety orange
          dark: '#030E27',
          light: '#FFFFFF',
        },
        background: {
          light: '#F5F5F5',
          lighter: '#FAFAFA',
          white: '#FFFFFF',
          dark: '#030E27',
          card: '#FFFFFF',
        },
        text: {
          primary: '#030E27',
          secondary: '#6B6B6B',
          light: '#FFFFFF',
          accent: '#FF6600',
          link: '#4BAAD8',
        },
        status: {
          success: '#3D9991', // ConstructAid teal for success
          warning: '#FFB81C',
          error: '#E6332A',
          info: '#4BAAD8', // ConstructAid blue for info
        },
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#2D2D2D',
        },
        overlay: {
          light: 'rgba(0, 0, 0, 0.46)',
          dark: 'rgba(0, 0, 0, 0.91)',
        },
      },
      boxShadow: {
        'ca-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'ca-md': '0 2px 6px rgba(0, 0, 0, 0.08)',
        'ca-lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'ca-xl': '0 8px 20px rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        sans: ['Poppins', 'Arial', 'sans-serif'],
        heading: ['Marcellus', 'Arial', 'sans-serif'],
        body: ['Poppins', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
