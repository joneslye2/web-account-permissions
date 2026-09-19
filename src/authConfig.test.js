describe('msalConfig.auth.clientId', () => {
  const originalConfig = window.__APP_CONFIG__;

  afterEach(() => {
    window.__APP_CONFIG__ = originalConfig;
    vi.resetModules();
  });

  it('falls back to the non-prod default when no runtime config is present', async () => {
    delete window.__APP_CONFIG__;
    const { msalConfig } = await import('./authConfig');
    expect(msalConfig.auth.clientId).toBe('671e9818-dea5-4b0d-ac43-7eaf5470894d');
  });

  it('uses the runtime-injected client ID when present', async () => {
    window.__APP_CONFIG__ = { msalClientId: 'a4c33926-3866-4824-a980-1b5c6faea83d' };
    vi.resetModules();
    const { msalConfig } = await import('./authConfig');
    expect(msalConfig.auth.clientId).toBe('a4c33926-3866-4824-a980-1b5c6faea83d');
  });
});
