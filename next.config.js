/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // Enable standalone output
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig

