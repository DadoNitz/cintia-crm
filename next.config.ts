import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // HSTS: depois da primeira visita o navegador vai direto para https, sem passar pelo http
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] }];
  },
};
export default nextConfig;
