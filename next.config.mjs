/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bilder werden aktuell als lokale Platzhalter/Assets ausgeliefert.
  // Sobald echte Fotos z.B. über eine CDN-Domain eingebunden werden,
  // hier unter `images.remotePatterns` die Domain freigeben.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
