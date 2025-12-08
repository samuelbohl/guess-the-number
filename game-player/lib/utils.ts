import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: Date | string | number | null): string {
  if (!value) return '-';
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  } catch {
    return '-';
  }
}

export function isActiveToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;

    const payloadPart = parts[1];
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLen);

    // Use atob if available (browser/edge), fallback to Buffer (node)
    const jsonStr = typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf-8');
    const payload = JSON.parse(jsonStr);

    const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
    if (!exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return exp > now;
  } catch {
    return false;
  }
}
