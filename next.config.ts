import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fnurghpimfnnxvipkutz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "sbppmjbsgydeoucrqyvu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'sha256-HASH1' 'sha256-HASH2' 'sha256-HASH3'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
