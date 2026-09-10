export function validNewPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && new TextEncoder().encode(value).length <= 72;
}
