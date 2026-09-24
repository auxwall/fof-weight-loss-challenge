/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-lib', 'bcryptjs', 'node-schedule'],
    instrumentationHook: true,
  },
};

export default nextConfig;
