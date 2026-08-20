import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript still gates the build (types are the real safety net). ESLint
  // shouldn't block a deploy — several v2 tables aren't in the generated
  // Supabase types yet, so those reads are cast loosely on purpose. Run
  // `npm run lint` in dev/CI; regenerate the DB types to drop the casts.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
