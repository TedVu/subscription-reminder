// Leading tile for a subscription row (app-appearance: service icons in lists).
// Catalog services get their monogram on their brand colour; custom ones get
// their first letter on a neutral (Material surfaceVariant) tile.

import { getService } from '../catalog/services.ts';

export interface ServiceTileModel {
  monogram: string;
  /** Brand hex, or 'neutral' for the theme's surfaceVariant. */
  background: string | 'neutral';
  /** Hex for brand tiles; 'neutral' means the theme's onSurfaceVariant. */
  foreground: string | 'neutral';
}

/** Black or white, whichever reads better on `hex`. */
function textOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6 ? '#111114' : '#FFFFFF';
}

export function serviceTile(catalogKey: string | null, name: string): ServiceTileModel {
  const service = getService(catalogKey);
  if (service) return { monogram: service.monogram, background: service.brandColor, foreground: textOn(service.brandColor) };
  return { monogram: name.trim().charAt(0).toUpperCase() || '?', background: 'neutral', foreground: 'neutral' };
}
