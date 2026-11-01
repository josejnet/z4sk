import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { securityHeaders } from "./app/lib/security-headers";

export default function nextConfig(phase: string): NextConfig {
  return {
    poweredByHeader: false,
    async headers() {
      return [{ source: "/:path*", headers: [...securityHeaders(phase === PHASE_DEVELOPMENT_SERVER)] }];
    },
  };
}
