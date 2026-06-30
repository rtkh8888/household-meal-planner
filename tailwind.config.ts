import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        border: 'hsl(var(--border))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        cream: 'hsl(var(--cream))',
        'cream-foreground': 'hsl(var(--cream-foreground))',
        danger: 'hsl(var(--danger))'
      },
      boxShadow: {
        soft: '0 20px 45px rgba(15, 23, 42, 0.08)'
      },
      backgroundImage: {
        'shell-radial':
          'radial-gradient(circle at top left, rgba(244, 175, 192, 0.15), transparent 35%), radial-gradient(circle at bottom right, rgba(191, 220, 203, 0.14), transparent 30%), radial-gradient(circle at center right, rgba(220, 210, 243, 0.12), transparent 28%)'
      }
    }
  },
  plugins: []
};

export default config;
