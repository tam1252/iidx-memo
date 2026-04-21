import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Renderにデプロイするため standalone モード
  output: "standalone",
};

export default nextConfig;
