import crypto from 'crypto';

/**
 * Hash a password using PBKDF2 with SHA512 and a random salt
 * @param {string} password 
 * @returns {{ salt: string, hash: string }}
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * Verify a password against a salt and hash
 * @param {string} password 
 * @param {string} salt 
 * @param {string} hash 
 * @returns {boolean}
 */
export function verifyPassword(password, salt, hash) {
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}
