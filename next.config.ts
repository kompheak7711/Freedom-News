import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Article images come from dozens of publisher hosts; they are served as-is.
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
