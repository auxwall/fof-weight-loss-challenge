/**
 * Masks an Emirates ID for privacy display.
 * Retains only the last 4 characters, masking the rest with bullets.
 * Example: 784-1990-1234567-1 -> •••••••••••••567-1 or ••••••••••••67-1
 */
export function maskEmiratesId(emiratesId: string | null | undefined): string {
  if (!emiratesId) return "—";
  const trimmed = emiratesId.trim();
  if (trimmed.length <= 4) return "••••";
  const visible = trimmed.slice(-4);
  const maskedPrefix = "•".repeat(trimmed.length - 4);
  return `${maskedPrefix}${visible}`;
}
