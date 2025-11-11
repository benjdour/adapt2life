import type { NextConfig } from "next";

const buildCsp = () => {
  const connectSrc = [
    "'self'",
    "https://openrouter.ai",
    "https://apis.garmin.com",
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");
};

const allowedOrigin = process.env.CORS_ALLOWED_ORIGIN ?? process.env.APP_URL ?? "*";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildCsp(),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    key: "Access-Control-Allow-Origin",
    value: allowedOrigin,
  },
  {
    key: "Access-Control-Allow-Methods",
    value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "Authorization, Content-Type, X-Requested-With, X-Garmin-Signature",
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
