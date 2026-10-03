// Built-in catalog of popular services. It prefills the name and billing cycle;
// prices vary by plan and change over time, so the user always enters the price.
// Icons are brand-colour monogram tiles rather than trademarked logos.

import type { CycleUnit } from '../schedule/index.ts';

export interface CatalogService {
  key: string;
  name: string;
  defaultCycle: { unit: CycleUnit; count: number };
  brandColor: string;
  monogram: string;
}

const monthly = { unit: 'month', count: 1 } as const;

export const SERVICES: readonly CatalogService[] = [
  { key: 'netflix', name: 'Netflix', defaultCycle: monthly, brandColor: '#E50914', monogram: 'N' },
  { key: 'spotify', name: 'Spotify', defaultCycle: monthly, brandColor: '#1DB954', monogram: 'S' },
  { key: 'youtube-premium', name: 'YouTube Premium', defaultCycle: monthly, brandColor: '#FF0000', monogram: 'Y' },
  { key: 'linkedin-premium', name: 'LinkedIn Premium', defaultCycle: monthly, brandColor: '#0A66C2', monogram: 'in' },
  { key: 'disney-plus', name: 'Disney+', defaultCycle: monthly, brandColor: '#113CCF', monogram: 'D+' },
  { key: 'stan', name: 'Stan', defaultCycle: monthly, brandColor: '#0072CE', monogram: 'S' },
  { key: 'binge', name: 'Binge', defaultCycle: monthly, brandColor: '#E5007D', monogram: 'B' },
  { key: 'amazon-prime', name: 'Amazon Prime', defaultCycle: monthly, brandColor: '#00A8E1', monogram: 'a' },
  { key: 'apple-one', name: 'Apple One', defaultCycle: monthly, brandColor: '#1D1D1F', monogram: '1' },
  { key: 'icloud-plus', name: 'iCloud+', defaultCycle: monthly, brandColor: '#3693F3', monogram: 'i+' },
  { key: 'google-one', name: 'Google One', defaultCycle: monthly, brandColor: '#4285F4', monogram: 'G1' },
  { key: 'microsoft-365', name: 'Microsoft 365', defaultCycle: { unit: 'year', count: 1 }, brandColor: '#D83B01', monogram: 'M' },
  { key: 'chatgpt-plus', name: 'ChatGPT Plus', defaultCycle: monthly, brandColor: '#10A37F', monogram: 'AI' },
  { key: 'kayo-sports', name: 'Kayo Sports', defaultCycle: monthly, brandColor: '#00C46A', monogram: 'K' },
  { key: 'paramount-plus', name: 'Paramount+', defaultCycle: monthly, brandColor: '#0064FF', monogram: 'P+' },
];

export function getService(key: string | null | undefined): CatalogService | undefined {
  return key ? SERVICES.find((service) => service.key === key) : undefined;
}

/** Case-insensitive search; names starting with the query come first. */
export function searchServices(query: string): CatalogService[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...SERVICES];
  const startsWith: CatalogService[] = [];
  const contains: CatalogService[] = [];
  for (const service of SERVICES) {
    const name = service.name.toLowerCase();
    if (name.startsWith(q)) startsWith.push(service);
    else if (name.includes(q)) contains.push(service);
  }
  return [...startsWith, ...contains];
}
