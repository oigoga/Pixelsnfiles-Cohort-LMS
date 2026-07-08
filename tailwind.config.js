/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'soft-butter':    '#ffffff',
        'atlantic-navy':  '#2F4A6B',
        'denim':          '#4F6B8A',
        'whipped-cream':  '#F8EFD8',
        'powder':         '#D7DEE8',
        'classic-navy':   '#1B3559',
        'honeycomb':      '#E8B775',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
