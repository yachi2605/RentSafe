import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RentPilot — Renter-first housing platform',
    short_name: 'RentPilot',
    description:
      'Analyze leases, detect rental scams, know your tenant rights, and find a compatible roommate.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F1B2D',
    theme_color: '#0F1B2D',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
