export const PASSWORD_MIN_LENGTH = 8;

export function validNewPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= PASSWORD_MIN_LENGTH && new TextEncoder().encode(value).length <= 72;
}
