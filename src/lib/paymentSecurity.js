/**
 * NESA Payment Security Utilities
 * Prevents duplicate payments, validates amounts, and rate-limits payment attempts.
 */

const ATTEMPT_KEY = 'nesa_pay_attempts';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const USED_REFS_KEY = 'nesa_used_refs';

/**
 * Rate-limit payment button clicks per device.
 * Returns { allowed: boolean, remainingMs: number }
 */
export function checkPaymentRateLimit() {
  const raw = sessionStorage.getItem(ATTEMPT_KEY);
  const data = raw ? JSON.parse(raw) : { count: 0, windowStart: Date.now() };

  const now = Date.now();
  if (now - data.windowStart > WINDOW_MS) {
    // Reset window
    const fresh = { count: 1, windowStart: now };
    sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(fresh));
    return { allowed: true };
  }

  if (data.count >= MAX_ATTEMPTS) {
    return { allowed: false, remainingMs: WINDOW_MS - (now - data.windowStart) };
  }

  data.count += 1;
  sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(data));
  return { allowed: true };
}

/**
 * Prevent a transaction reference from being processed twice
 * (guard against duplicate callback fires).
 */
export function markRefUsed(ref) {
  const refs = JSON.parse(sessionStorage.getItem(USED_REFS_KEY) || '[]');
  refs.push(ref);
  sessionStorage.setItem(USED_REFS_KEY, JSON.stringify(refs));
}

export function isRefAlreadyUsed(ref) {
  const refs = JSON.parse(sessionStorage.getItem(USED_REFS_KEY) || '[]');
  return refs.includes(ref);
}

/**
 * Validate the payment amount on the client side.
 * Returns { valid: boolean, error: string }
 */
export function validatePaymentAmount(amount, type) {
  const n = parseFloat(amount);
  if (isNaN(n) || n <= 0) return { valid: false, error: 'Please enter a valid amount.' };
  if (n < 100) return { valid: false, error: 'Minimum payment is ₦100.' };
  if (type === 'donation' && n > 5000) return { valid: false, error: 'Maximum donation is ₦5,000.' };
  if (type === 'dues' && n > 10000) return { valid: false, error: 'Amount seems too high for dues. Please verify.' };
  return { valid: true };
}

/**
 * Sanitise a string — strip HTML tags and trim whitespace.
 */
export function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '').trim();
}