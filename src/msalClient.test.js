function mockMsalBrowser(overrides = {}) {
  const instance = {
    initialize: vi.fn().mockResolvedValue(undefined),
    addEventCallback: vi.fn(),
    handleRedirectPromise: vi.fn().mockResolvedValue(null),
    getActiveAccount: vi.fn(() => null),
    getAllAccounts: vi.fn(() => []),
    setActiveAccount: vi.fn(),
    ...overrides,
  };

  vi.doMock('@azure/msal-browser', () => ({
    PublicClientApplication: vi.fn(() => instance),
    EventType: { LOGIN_SUCCESS: 'msal:loginSuccess', ACQUIRE_TOKEN_SUCCESS: 'msal:acquireTokenSuccess' },
  }));

  return instance;
}

describe('initializeMsal', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('initializes msal and processes the redirect promise once', async () => {
    const instance = mockMsalBrowser();
    const { initializeMsal } = await import('./msalClient');

    await initializeMsal();
    await initializeMsal();

    expect(instance.initialize).toHaveBeenCalledTimes(1);
    expect(instance.handleRedirectPromise).toHaveBeenCalledTimes(1);
  });

  it('sets the active account returned by the redirect promise', async () => {
    const account = { localAccountId: 'user-1' };
    const instance = mockMsalBrowser({
      handleRedirectPromise: vi.fn().mockResolvedValue({ account }),
    });
    const { initializeMsal } = await import('./msalClient');

    await initializeMsal();

    expect(instance.setActiveAccount).toHaveBeenCalledWith(account);
  });

  it('falls back to an existing cached account when the redirect promise has none', async () => {
    const account = { localAccountId: 'user-2' };
    const instance = mockMsalBrowser({
      handleRedirectPromise: vi.fn().mockResolvedValue(null),
      getAllAccounts: vi.fn(() => [account]),
    });
    const { initializeMsal } = await import('./msalClient');

    await initializeMsal();

    expect(instance.setActiveAccount).toHaveBeenCalledWith(account);
  });
});
