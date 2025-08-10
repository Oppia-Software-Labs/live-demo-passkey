// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["passkey-kit", "passkey-kit-sdk", "sac-sdk"],
};
export default nextConfig;
