import { fetchClaims } from './claimsApi';

describe('fetchClaims', () => {
  const originalEnv = { ...import.meta.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
    global.fetch = originalFetch;
  });

  it('throws when the claims API base URL is not configured', async () => {
    delete import.meta.env.VITE_CLAIMS_API_URL;
    await expect(fetchClaims('user-1')).rejects.toThrow(/not configured/i);
  });

  it('throws when the claims API responds with a non-ok status', async () => {
    import.meta.env.VITE_CLAIMS_API_URL = 'https://claims.example.com';
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchClaims('user-1')).rejects.toThrow(/failed with status 500/i);
  });

  it('returns the parsed claims on success', async () => {
    import.meta.env.VITE_CLAIMS_API_URL = 'https://claims.example.com';
    const claims = { serviceARoles: ['create'], serviceBRoles: [], category: 'open' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(claims) });

    await expect(fetchClaims('user-1')).resolves.toEqual(claims);
    expect(global.fetch).toHaveBeenCalledWith('https://claims.example.com/claims/user-1');
  });
});
