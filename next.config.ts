/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  eslint: {
    // ビルド時のESLintエラーを警告として扱う
    ignoreDuringBuilds: true,
  },
  webpack: (config: any) => {
    config.externals.push({
      'pg': 'pg',
      'pg-native': 'pg-native',
    });
    return config;
  },
};

export default nextConfig;
