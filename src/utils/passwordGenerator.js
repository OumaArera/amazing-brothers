/**
 * Generates a strong random password.
 *
 * Rules:
 *  - At least 2 uppercase letters
 *  - At least 2 lowercase letters
 *  - At least 2 digits
 *  - At least 2 special characters
 *  - Total length: 14 characters (shuffled)
 */

const UPPER   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // removed I, O (ambiguous)
const LOWER   = 'abcdefghjkmnpqrstuvwxyz';     // removed i, l, o
const DIGITS  = '23456789';                     // removed 0, 1 (ambiguous)
const SPECIAL = '!@#$%^&*+-=?';

const pick = (charset, count) =>
  Array.from({ length: count }, () =>
    charset[Math.floor(Math.random() * charset.length)]
  );

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const generatePassword = () => {
  const chars = [
    ...pick(UPPER,   3),
    ...pick(LOWER,   4),
    ...pick(DIGITS,  4),
    ...pick(SPECIAL, 3),
  ];
  return shuffle(chars).join('');
};

/**
 * Returns a strength label and colour for a given password.
 * Used to display feedback in the UI.
 */
export const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 12)              score++;
  if (pwd.length >= 16)              score++;
  if (/[A-Z]/.test(pwd))            score++;
  if (/[a-z]/.test(pwd))            score++;
  if (/[0-9]/.test(pwd))            score++;
  if (/[^A-Za-z0-9]/.test(pwd))     score++;

  if (score <= 2) return { label: 'Weak',   color: '#ef4444', width: '33%'  };
  if (score <= 4) return { label: 'Fair',   color: '#f59e0b', width: '66%'  };
  return            { label: 'Strong', color: '#10b981', width: '100%' };
};