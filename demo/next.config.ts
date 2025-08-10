// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["passkey-kit", "passkey-kit-sdk", "sac-sdk"],
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Exclude native dependencies from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};
export default nextConfig;
