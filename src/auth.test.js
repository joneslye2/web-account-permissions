import { computeAuthState } from './auth';

describe('computeAuthState', () => {
  it('marks an unauthenticated user as requiring login', () => {
    expect(computeAuthState({ isAuthenticated: false })).toMatchObject({
      isAuthenticated: false,
      hasServiceAccess: false,
      status: 'login_required',
    });
  });

  it('marks an authenticated user with no claims yet as loading', () => {
    expect(computeAuthState({ isAuthenticated: true, claims: null, claimsError: false })).toMatchObject({
      isAuthenticated: true,
      hasServiceAccess: false,
      status: 'claims_loading',
    });
  });

  it('marks an authenticated user whose claims failed to load as claims_unavailable', () => {
    expect(computeAuthState({ isAuthenticated: true, claims: null, claimsError: true })).toMatchObject({
      isAuthenticated: true,
      hasServiceAccess: false,
      status: 'claims_unavailable',
    });
  });

  it('marks an authenticated user with resolved claims but no service access', () => {
    const state = computeAuthState({
      isAuthenticated: true,
      claims: { serviceARoles: [], serviceBRoles: [], category: 'open' },
    });

    expect(state).toMatchObject({
      isAuthenticated: true,
      hasServiceAccess: false,
      status: 'no_service_access',
    });
  });

  it('grants service access when a service role is present', () => {
    const state = computeAuthState({
      isAuthenticated: true,
      claims: { serviceARoles: ['create'], serviceBRoles: [], category: 'open' },
    });

    expect(state).toMatchObject({ isAuthenticated: true, hasServiceAccess: true, status: 'authenticated' });
  });

  it('grants service access when category is confidential', () => {
    const state = computeAuthState({
      isAuthenticated: true,
      claims: { serviceARoles: [], serviceBRoles: [], category: 'confidential' },
    });

    expect(state).toMatchObject({ isAuthenticated: true, hasServiceAccess: true, status: 'authenticated' });
  });
});
