/**
 * Input Sanitization and Security Utility
 * Defends against XSS, NoSQL injection, prototype pollution, and path traversal.
 */

// Characters considered safe for alphanumeric identifiers, IDs, slugs
const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-\.:@\s]{1,128}$/;

/**
 * Validates whether a given string is a safe document/record ID
 */
export function isSafeIdentifier(id: unknown): boolean {
  if (typeof id !== 'string' && typeof id !== 'number') return false;
  return SAFE_ID_REGEX.test(String(id).trim());
}

/**
 * Sanitizes plain text input by stripping dangerous tags, script injections,
 * and malicious control characters while preserving valid multi-language text.
 */
export function sanitizeText(input: unknown, maxLength: number = 20000): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Allow image base64 data URIs intact if valid
  if (str.startsWith('data:image/')) {
    return str.slice(0, maxLength);
  }

  // Strip NULL bytes and dangerous non-printable ASCII control characters (keep \t, \n, \r)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip script, iframe, object, embed, SVG tags and their contents
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  str = str.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  str = str.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // Strip inline event handlers (e.g. onload=, onclick=, onerror=)
  str = str.replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '');
  str = str.replace(/\bon\w+\s*=\s*[^>\s]+/gi, '');

  // Strip javascript: and vbscript: URIs
  str = str.replace(/javascript:[^\s]*/gi, '');
  str = str.replace(/vbscript:[^\s]*/gi, '');

  // Strip all HTML/XML tags
  str = str.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');

  // Trim and enforce maximum length
  return str.trim().slice(0, maxLength);
}

/**
 * Recursively sanitizes any object or array to:
 * 1. Eliminate NoSQL injection keys (keys beginning with '$' or containing '.')
 * 2. Eliminate Prototype Pollution keys ('__proto__', 'constructor', 'prototype')
 * 3. Sanitize string values
 * 4. Remove undefined values
 */
export function sanitizePayload<T>(input: T, depth: number = 0): T {
  if (depth > 12) {
    // Guard against excessive recursion / circular references
    return null as any;
  }

  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeText(input) as unknown as T;
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    // Numbers and booleans are safe primitives
    if (typeof input === 'number' && !Number.isFinite(input)) {
      return 0 as unknown as T;
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input
      .slice(0, 5000) // Prevent array-based memory blowup
      .map(item => sanitizePayload(item, depth + 1)) as unknown as T;
  }

  if (typeof input === 'object') {
    const cleaned: Record<string, any> = {};

    for (const [key, val] of Object.entries(input as Record<string, any>)) {
      // Prototype pollution defense
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // NoSQL injection defense: Disallow keys starting with '$' or containing '.'
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }

      // Sanitize key name
      const safeKey = key.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 100);
      if (!safeKey) continue;

      cleaned[safeKey] = sanitizePayload(val, depth + 1);
    }

    return cleaned as T;
  }

  return input;
}
