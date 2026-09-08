import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Beide Pakete lesen Dateien relativ zu __dirname und muessen daher aus dem
  // Server-Bundle herausgehalten werden (sonst schlaegt der Items-Cache fehl).
  serverExternalPackages: ["skyhelper-networth", "prismarine-nbt"],
};

export default nextConfig;
