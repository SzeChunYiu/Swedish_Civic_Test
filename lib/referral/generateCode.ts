export const REFERRAL_CODE_LENGTH = 8;
export const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{8}$/;

export function normalizeReferralCode(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export function isReferralCode(value: unknown): value is string {
  return REFERRAL_CODE_PATTERN.test(normalizeReferralCode(value));
}

export function generateReferralCode(random: () => number = Math.random): string {
  let code = '';

  for (let index = 0; index < REFERRAL_CODE_LENGTH; index += 1) {
    const randomValue = random();
    const normalizedRandomValue =
      Number.isFinite(randomValue) && randomValue >= 0 && randomValue < 1 ? randomValue : 0;
    const alphabetIndex = Math.floor(normalizedRandomValue * REFERRAL_CODE_ALPHABET.length);
    code += REFERRAL_CODE_ALPHABET[alphabetIndex] ?? REFERRAL_CODE_ALPHABET[0];
  }

  return code;
}
