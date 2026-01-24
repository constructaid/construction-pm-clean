/**
 * Structured Logger for ConstructAid
 *
 * Provides consistent, structured logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Contextual metadata (requestId, userId, endpoint, etc.)
 * - JSON-formatted output for production (log aggregation compatible)
 * - Pretty-printed output for development
 * - Sensitive data redaction
 */

// Log levels in order of severity
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Determine minimum log level from environment
const getMinLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (envLevel && envLevel in LOG_LEVEL_PRIORITY) {
    return envLevel;
  }
  // Default: debug in development, info in production
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const MIN_LOG_LEVEL = getMinLogLevel();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Sensitive fields that should be redacted in logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'ssn',
  'creditCard',
  'credit_card',
  'authorization',
  'cookie',
  'session',
  'refresh_token',
  'access_token',
  'taxId',
  'tax_id',
];

export interface LogContext {
  // Request context
  requestId?: string;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;

  // User context
  userId?: number;
  userEmail?: string;
  userRole?: string;
  companyId?: number;

  // Application context
  module?: string;
  action?: string;
  projectId?: number;

  // Performance
  durationMs?: number;

  // Error context
  errorCode?: string;
  stack?: string;

  // Custom metadata
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Redact sensitive data from an object
 */
function redactSensitiveData(obj: any, depth = 0): any {
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Check if the string looks like a token or key
    if (obj.length > 20 && /^[a-zA-Z0-9_-]+$/.test(obj)) {
      return '[REDACTED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Format a log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (IS_PRODUCTION) {
    // JSON format for production (log aggregation tools like DataDog, Splunk, etc.)
    return JSON.stringify(redactSensitiveData(entry));
  }

  // Pretty format for development
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
  };
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';

  const coloredLevel = `${levelColors[entry.level]}[${entry.level.toUpperCase()}]${reset}`;
  const timestamp = `${dim}${entry.timestamp}${reset}`;

  let output = `${timestamp} ${coloredLevel} ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    const contextStr = Object.entries(redactSensitiveData(entry.context))
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${dim}${k}=${reset}${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' ');
    if (contextStr) {
      output += ` ${contextStr}`;
    }
  }

  if (entry.error) {
    output += `\n${dim}Error: ${entry.error.name}: ${entry.error.message}${reset}`;
    if (entry.error.stack && entry.level === 'error') {
      output += `\n${dim}${entry.error.stack}${reset}`;
    }
  }

  return output;
}

/**
 * Core log function
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  // Skip if below minimum log level
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL]) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const formatted = formatLogEntry(entry);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

/**
 * Logger interface - use this throughout the application
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext, error?: Error) => log('warn', message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => log('error', message, context, error),
};

/**
 * Create a child logger with pre-filled context
 * Useful for request-scoped logging
 */
export function createLogger(baseContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) =>
      log('debug', message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log('info', message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext, error?: Error) =>
      log('warn', message, { ...baseContext, ...context }, error),
    error: (message: string, context?: LogContext, error?: Error) =>
      log('error', message, { ...baseContext, ...context }, error),
  };
}

/**
 * Create a request-scoped logger from Astro context
 */
export function createRequestLogger(
  request: Request,
  user?: { id: number; email: string; role: string; companyId?: number }
) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const url = new URL(request.url);

  return createLogger({
    requestId,
    endpoint: url.pathname,
    method: request.method,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    companyId: user?.companyId,
  });
}

/**
 * Middleware timing helper
 */
export function logTiming(
  log: ReturnType<typeof createLogger>,
  action: string,
  startTime: number
) {
  const durationMs = Date.now() - startTime;
  log.info(`${action} completed`, { durationMs });
}

// Export default logger for quick imports
export default logger;
