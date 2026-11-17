/**
 * Sanitizes user input to prevent XSS attacks
 * Removes or escapes potentially dangerous HTML/script content
 */

// Characters that need to be escaped in HTML context
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Removes all HTML tags from a string
 */
export function stripHtmlTags(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes message content for chat
 * - Strips HTML tags
 * - Escapes special characters
 * - Removes javascript: URLs
 * - Limits length
 */
export function sanitizeMessage(content: string, maxLength = 5000): string {
  if (!content || typeof content !== 'string') return '';
  
  // Trim and limit length
  let sanitized = content.trim().slice(0, maxLength);
  
  // Remove HTML tags
  sanitized = stripHtmlTags(sanitized);
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Remove vbscript: protocol
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized;
}

/**
 * Sanitizes user name input
 * - Removes HTML tags
 * - Limits to alphanumeric, spaces, and common punctuation
 */
export function sanitizeName(name: string, maxLength = 100): string {
  if (!name || typeof name !== 'string') return '';
  
  let sanitized = stripHtmlTags(name.trim()).slice(0, maxLength);
  
  // Remove any suspicious characters, keep only safe ones
  sanitized = sanitized.replace(/[<>{}[\]\\]/g, '');
  
  return sanitized;
}

/**
 * Sanitizes email input
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  // Basic email sanitization - lowercase, trim, remove spaces
  return email.toLowerCase().trim().replace(/\s/g, '');
}

/**
 * Validates and sanitizes URLs
 * Only allows http, https, mailto, tel protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  
  // Block dangerous protocols first (before any "https://" is prepended)
  if (/^(javascript:|data:|vbscript:|file:)/i.test(trimmed)) {
    return '';
  }
  
  // Only allow safe protocols
  const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  const hasValidProtocol = safeProtocols.some(protocol => 
    trimmed.toLowerCase().startsWith(protocol)
  );
  
  if (!hasValidProtocol && !trimmed.startsWith('/')) {
    // If no protocol and not a relative URL, add https://
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Sanitizes search query input
 */
export function sanitizeSearchQuery(query: string, maxLength = 200): string {
  if (!query || typeof query !== 'string') return '';
  
  return stripHtmlTags(query.trim())
    .slice(0, maxLength)
    .replace(/[<>]/g, '');
}
