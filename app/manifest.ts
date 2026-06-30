import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Household Meal Planner',
    short_name: 'Meal Planner',
    description: 'Plan weekly meals, leftovers, and grocery lists for your household.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f4ef',
    theme_color: '#0f766e',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml'
      }
    ]
  };
}
