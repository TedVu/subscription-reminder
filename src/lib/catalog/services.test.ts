import { getService, searchServices, SERVICES } from './services.ts';

describe('subscription-management: service catalog', () => {
  it('includes every service named in the spec', () => {
    const names = SERVICES.map((service) => service.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'Netflix',
        'Spotify',
        'YouTube Premium',
        'LinkedIn Premium',
        'Disney+',
        'Stan',
        'Binge',
        'Amazon Prime',
        'Apple One',
        'iCloud+',
        'Google One',
        'Microsoft 365',
        'ChatGPT Plus',
        'Kayo Sports',
        'Paramount+',
      ]),
    );
  });

  it('has unique keys and valid default cycles', () => {
    expect(new Set(SERVICES.map((service) => service.key)).size).toBe(SERVICES.length);
    for (const service of SERVICES) {
      expect(['week', 'month', 'year']).toContain(service.defaultCycle.unit);
      expect(service.brandColor).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('"spo" finds Spotify first', () => {
    const results = searchServices('spo');
    expect(results[0]?.name).toBe('Spotify');
    expect(results.map((service) => service.name)).toContain('Kayo Sports');
  });

  it('search is case-insensitive and an empty query lists everything', () => {
    expect(searchServices('NETF').map((service) => service.key)).toEqual(['netflix']);
    expect(searchServices('  ')).toHaveLength(SERVICES.length);
    expect(searchServices('zzz')).toEqual([]);
  });

  it('looks services up by key', () => {
    expect(getService('spotify')?.name).toBe('Spotify');
    expect(getService(null)).toBeUndefined();
    expect(getService('unknown')).toBeUndefined();
  });
});
