/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only for production builds — `next build` emits an `out/`
  // folder you can host anywhere. Left off in `next dev` so the dev server
  // serves the dynamic [route] segment on demand without prerendering.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: false,
};

export default nextConfig;
