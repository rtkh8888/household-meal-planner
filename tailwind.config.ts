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
        lavender: 'hsl(var(--lavender))',
        'lavender-foreground': 'hsl(var(--lavender-foreground))',
        peach: 'hsl(var(--peach))',
        'peach-foreground': 'hsl(var(--peach-foreground))',
        lime: 'hsl(var(--lime))',
        'lime-foreground': 'hsl(var(--lime-foreground))',
        'rose-soft': 'hsl(var(--rose-soft))',
        'rose-soft-foreground': 'hsl(var(--rose-soft-foreground))',
        danger: 'hsl(var(--danger))'
      },
      boxShadow: {
        soft: '0 20px 45px rgba(15, 23, 42, 0.08)'
      },
      backgroundImage: {
        'shell-radial':
          'radial-gradient(circle at top left, rgba(220, 207, 252, 0.18), transparent 32%), radial-gradient(circle at top right, rgba(217, 241, 216, 0.18), transparent 30%), radial-gradient(circle at bottom left, rgba(255, 221, 191, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(246, 214, 227, 0.16), transparent 28%)'
      }
    }
  },
  plugins: []
};

export default config;
