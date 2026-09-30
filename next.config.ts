import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Let phones on the same Wi-Fi load dev assets (home/office LAN ranges).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // Psychologist research survey: a static page in public/survey/.
  rewrites() {
    return [{ source: "/survey", destination: "/survey/index.html" }];
  },
};

export default nextConfig;
