// Lightweight password obfuscation for client-side sign-in gating.
// NOTE: This is NOT cryptographic security — the Free plan has no backend
// functions, so the password is checked client-side. It prevents casual
// access by someone who only knows a registration number.

const SALT = 'nesa_eco_hub_2024';

export function hashPassword(pw) {
  if (!pw) return '';
  const str = SALT + pw + SALT;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return 'h' + Math.abs(hash).toString(36);
}

export function verifyPassword(pw, storedHash) {
  if (!storedHash) return true; // legacy student with no password — allow
  return hashPassword(pw) === storedHash;
}