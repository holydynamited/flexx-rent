export const CATALOG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80';

const ALLOWED_PROPERTY_IMAGE_HOSTS = new Set<string>(['images.unsplash.com']);

function normalizeUrl(value: string): string {
  return value.trim();
}

export function isAllowedPropertyImageUrl(value: string): boolean {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    return ALLOWED_PROPERTY_IMAGE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function sanitizePropertyImageUrl(value: string | null | undefined): string {
  if (!value) {
    return CATALOG_FALLBACK_IMAGE;
  }

  const normalized = normalizeUrl(value);
  if (!normalized) {
    return CATALOG_FALLBACK_IMAGE;
  }

  return isAllowedPropertyImageUrl(normalized) ? normalized : CATALOG_FALLBACK_IMAGE;
}
