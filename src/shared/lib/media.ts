export function isValidMediaUrl(url: unknown): boolean {
  if (typeof url !== 'string') {
    return false;
  }
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === 'null' ||
    trimmed === 'undefined'
  ) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('file://')
  );
}

export function sanitizeImageUrl(raw?: string | null): string {
  if (!raw) {
    return '';
  }
  const trimmed = raw.trim();
  return isValidMediaUrl(trimmed) ? trimmed : '';
}

export function getInitials(text?: string | null, length = 2): string {
  if (!text) {
    return '';
  }
  return text.trim().slice(0, length).toUpperCase();
}

