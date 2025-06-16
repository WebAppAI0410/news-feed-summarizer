/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  eslint: {
    // ビルド時のESLintエラーを警告として扱う
    ignoreDuringBuilds: true,
  },
  env: {
    // Edge Runtime で必要な環境変数を確実に読み込む
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  webpack: (config: any) => {
    config.externals.push({
      'pg': 'pg',
      'pg-native': 'pg-native',
      'bcryptjs': 'bcryptjs',
    });
    return config;
  },
};

export default nextConfig;
