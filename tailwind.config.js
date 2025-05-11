/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        colors: {
          background: 'var(--background)',
          foreground: 'var(--foreground)',
          card: 'var(--card)',
          'card-foreground': 'var(--card-foreground)',
          popover: 'var(--popover)',
          'popover-foreground': 'var(--popover-foreground)',
          primary: 'var(--primary)',
          'primary-foreground': 'var(--primary-foreground)',
          secondary: 'var(--secondary)',
          'secondary-foreground': 'var(--secondary-foreground)',
          muted: 'var(--muted)',
          'muted-foreground': 'var(--muted-foreground)',
          accent: 'var(--accent)',
          'accent-foreground': 'var(--accent-foreground)',
          destructive: 'var(--destructive)',
          input: 'var(--input)',
          ring: 'var(--ring)',
          border: 'var(--border)',
          sidebar: 'var(--sidebar)',
          'sidebar-foreground': 'var(--sidebar-foreground)',
          'sidebar-primary': 'var(--sidebar-primary)',
          'sidebar-primary-foreground': 'var(--sidebar-primary-foreground)',
          'sidebar-accent': 'var(--sidebar-accent)',
          'sidebar-accent-foreground': 'var(--sidebar-accent-foreground)',
        },
        
        borderRadius: {
          sm: 'var(--radius-sm)',
          md: 'var(--radius-md)',
          lg: 'var(--radius-lg)',
          xl: 'var(--radius-xl)',
        },
      },
    },
    plugins: [],
  }
  