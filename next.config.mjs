/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["node:sqlite", "bcryptjs"],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
