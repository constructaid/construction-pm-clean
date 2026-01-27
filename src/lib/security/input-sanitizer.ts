/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user input to prevent
 * injection attacks (XSS, SQL injection, command injection, etc.)
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes dangerous HTML characters
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return input.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char);
}

/**
 * Remove all HTML tags from a string
 * Useful for stripping potentially dangerous content
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Sanitize a filename to prevent path traversal attacks
 * Removes dangerous characters and path separators
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return '';
  }

  return filename
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
    .replace(/[<>:"|?*]/g, '') // Remove Windows forbidden characters
    .trim();
}

/**
 * Sanitize a path to prevent path traversal attacks
 * Normalizes and validates the path
 */
export function sanitizePath(path: string, allowedBaseDir?: string): string {
  if (typeof path !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = path.replace(/\x00/g, '');

  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/');

  // Remove .. sequences
  while (sanitized.includes('..')) {
    sanitized = sanitized.replace(/\.\./g, '');
  }

  // Remove multiple slashes
  sanitized = sanitized.replace(/\/+/g, '/');

  // Remove leading slash if base dir provided
  if (allowedBaseDir) {
    sanitized = sanitized.replace(/^\/+/, '');
  }

  return sanitized;
}

/**
 * Sanitize a string for use in SQL LIKE queries
 * Escapes special characters that have meaning in LIKE patterns
 */
export function sanitizeForLike(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Sanitize string for logging
 * Removes sensitive patterns and truncates long strings
 */
export function sanitizeForLog(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potential sensitive patterns
  let sanitized = input
    .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
    .replace(/secret[=:]\s*\S+/gi, 'secret=[REDACTED]')
    .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
    .replace(/api[-_]?key[=:]\s*\S+/gi, 'apikey=[REDACTED]')
    .replace(/bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/authorization[=:]\s*\S+/gi, 'authorization=[REDACTED]');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '... [truncated]';
  }

  return sanitized;
}

/**
 * Validate and sanitize email address
 * Returns null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  // Basic email format validation
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.includes('@@')) {
    return null;
  }

  // Maximum reasonable email length
  if (sanitized.length > 254) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize a phone number
 * Returns cleaned phone number or null if invalid
 */
export function sanitizePhone(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Basic validation: must have at least 7 digits
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize a URL
 * Returns null if potentially dangerous
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Block javascript: and data: URLs
  const lowerUrl = trimmed.toLowerCase();
  if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:')) {
    return null;
  }

  // Block file: URLs
  if (lowerUrl.startsWith('file:')) {
    return null;
  }

  try {
    // Validate URL format
    const parsed = new URL(trimmed);

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    // If it's not a valid absolute URL, it might be a relative path
    // Only allow relative paths that don't try to escape
    if (trimmed.startsWith('/') && !trimmed.includes('..')) {
      return trimmed;
    }

    return null;
  }
}

/**
 * Sanitize user input for general text fields
 * Removes control characters and normalizes whitespace
 */
export function sanitizeText(input: string, options?: {
  maxLength?: number;
  allowNewlines?: boolean;
  trim?: boolean;
}): string {
  if (typeof input !== 'string') {
    return '';
  }

  const {
    maxLength = 10000,
    allowNewlines = true,
    trim = true,
  } = options || {};

  let sanitized = input;

  // Remove null bytes and other dangerous control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

  // Optionally remove newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Normalize whitespace
  sanitized = sanitized.replace(/[ \t]+/g, ' ');

  // Trim if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate and sanitize a numeric ID
 * Returns a positive integer or null if invalid
 */
export function sanitizeId(id: string | number): number | null {
  const num = typeof id === 'string' ? parseInt(id, 10) : id;

  if (!Number.isFinite(num) || num < 0 || !Number.isInteger(num)) {
    return null;
  }

  // Check for reasonable ID range (up to 2^31 - 1 for PostgreSQL INT)
  if (num > 2147483647) {
    return null;
  }

  return num;
}

/**
 * Check if a string looks like it might contain malicious content
 * Returns true if suspicious patterns are found
 */
export function hasSuspiciousContent(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /<script[\s>]/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /on\w+\s*=/i, // Event handlers (onclick, onload, etc.)
    /\beval\s*\(/i, // eval() calls
    /\bexec\s*\(/i, // exec() calls
    /\.\.\//g, // Path traversal
    /;\s*--/g, // SQL comment injection
    /'\s*or\s*'/i, // SQL OR injection
    /union\s+select/i, // SQL UNION injection
    /\$\{.*\}/g, // Template injection
    /\{\{.*\}\}/g, // Mustache/Handlebars injection
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}
