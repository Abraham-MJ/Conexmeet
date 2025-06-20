import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        latosans: ['var(--font-lato-sans)'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      keyframes: {
        i6jD7: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' }, 
          '100%': { opacity: '1', transform: 'translateX(0px)' },
        },
        message: {
          '0%': {
            transform: 'translateX(-20px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0px)',
            opacity: '1',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.2)' },
        },
        heartBeat: {
          '0%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.3)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.3)' },
          '70%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float1: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': {
            transform: 'translate(-15px, -40px) scale(0.5)',
            opacity: '0',
          },
        },
        float2: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': {
            transform: 'translate(15px, -50px) scale(0.5)',
            opacity: '0',
          },
        },
        float3: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': {
            transform: 'translate(0px, -60px) scale(0.5)',
            opacity: '0',
          },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        sparkle: 'sparkle 2s ease-in-out infinite',
        heartBeat: 'heartBeat 2s infinite ease-in-out',
        fadeIn: 'fadeIn 1s ease-out forwards',
        float1: 'float1 3s ease-in-out infinite',
        float2: 'float2 3.5s ease-in-out infinite 0.5s',
        float3: 'float3 4s ease-in-out infinite 1s',
        chat_event_animation: 'i6jD7 .35s ease-in-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
