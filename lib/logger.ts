import { randomUUID } from "crypto";

type LogLevel = "info" | "warn" | "error";

const LOG_METHOD: Record<LogLevel, (...args: unknown[]) => void> = {
  info: console.log,
  warn: console.warn,
  error: console.error,
};

const REQUEST_ID_HEADERS = ["x-request-id", "x-correlation-id", "x-amzn-trace-id"];

const normalizeError = (value: unknown) => {
  if (value instanceof Error) {
    return {
      message: value.message,
      stack: value.stack,
      name: value.name,
    };
  }
  return value;
};

const sanitizeData = (data?: Record<string, unknown>) => {
  if (!data) {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = normalizeError(value);
  }
  return sanitized;
};

const extractRequestId = (headers?: Headers): string | null => {
  if (!headers) {
    return null;
  }
  for (const key of REQUEST_ID_HEADERS) {
    const value = headers.get(key);
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};

type LoggerContext = Record<string, unknown>;

export type Logger = {
  reqId: string;
  scope: string;
  info: (message: string, data?: LoggerContext) => void;
  warn: (message: string, data?: LoggerContext) => void;
  error: (message: string, data?: LoggerContext) => void;
  child: (context: LoggerContext) => Logger;
};

const outputLog = (
  level: LogLevel,
  scope: string,
  reqId: string,
  message: string,
  baseContext?: LoggerContext,
  data?: LoggerContext,
) => {
  const combined = { ...(baseContext ?? {}), ...(data ?? {}) };
  const payload = {
    ts: new Date().toISOString(),
    level,
    scope,
    reqId,
    message,
    ...sanitizeData(combined),
  };
  LOG_METHOD[level](JSON.stringify(payload));
};

const createInternalLogger = (
  scope: string,
  reqId: string,
  baseContext?: LoggerContext,
): Logger => ({
  reqId,
  scope,
  info: (message, data) => outputLog("info", scope, reqId, message, baseContext, data),
  warn: (message, data) => outputLog("warn", scope, reqId, message, baseContext, data),
  error: (message, data) => outputLog("error", scope, reqId, message, baseContext, data),
  child: (context) =>
    createInternalLogger(scope, reqId, {
      ...(baseContext ?? {}),
      ...context,
    }),
});

export const createLogger = (
  scope: string,
  options?: { headers?: Headers; requestId?: string },
): Logger => {
  const reqId = options?.requestId ?? extractRequestId(options?.headers) ?? randomUUID();

  return createInternalLogger(scope, reqId);
};
