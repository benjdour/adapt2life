import type { NextConfig } from "next";

const sanitize = (value?: string | null) => (typeof value === "string" ? value.trim() : undefined);

const sanitizeList = (value?: string | null) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((entry) => sanitize(entry))
        .filter((entry): entry is string => Boolean(entry))
    : [];

const normalizeOrigin = (value?: string | null) => {
  const sanitized = sanitize(value);
  if (!sanitized) return undefined;
  try {
    const parsed = new URL(sanitized);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return sanitized.replace(/\/+$/, "");
  }
};

const allowedOrigins = Array.from(
  new Set(
    [
      ...sanitizeList(process.env.CORS_ALLOWED_ORIGINS).map(normalizeOrigin),
      normalizeOrigin(process.env.CORS_ALLOWED_ORIGIN),
      normalizeOrigin(process.env.APP_URL),
      normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    ].filter((origin): origin is string => Boolean(origin) && origin !== "*"),
  ),
);

const buildCsp = () => {
  const connectSrc = [
    "'self'",
    "https://openrouter.ai",
    "https://apis.garmin.com",
    "https://api.stack-auth.com",
    "https://app.stack-auth.com",
    "https://1.1.1.1",
    sanitize(process.env.APP_URL),
    sanitize(process.env.NEXT_PUBLIC_SITE_URL),
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");
};

const corsAllowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const corsAllowedHeaders = "Authorization, Content-Type, X-Requested-With, X-Garmin-Signature";

const escapeForHas = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildCorsHeaders = () =>
  allowedOrigins.map((origin) => ({
    source: "/api/:path*",
    has: [
      {
        type: "header" as const,
        key: "origin",
        value: escapeForHas(origin),
      },
    ],
    headers: [
      { key: "Access-Control-Allow-Origin", value: origin },
      { key: "Access-Control-Allow-Methods", value: corsAllowedMethods },
      { key: "Access-Control-Allow-Headers", value: corsAllowedHeaders },
      { key: "Access-Control-Allow-Credentials", value: "true" },
      { key: "Vary", value: "Origin" },
    ],
  }));

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
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
    ...buildCorsHeaders(),
  ],
};

export default nextConfig;
