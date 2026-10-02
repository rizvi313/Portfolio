/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for GitHub Pages
  output: 'export',

  compiler: {
    styledComponents: true,
  },

  compress: true,

  poweredByHeader: false,

  images: {
    // GitHub Pages cannot run Next.js image optimization
    unoptimized: true,

    formats: ['image/avif', 'image/webp'],

    remotePatterns: [],
  },
};

export default nextConfig;