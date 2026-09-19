export function computeAuthState({ isAuthenticated, claims, claimsError } = {}) {
  if (!isAuthenticated) {
    return {
      isAuthenticated: false,
      hasServiceAccess: false,
      status: 'login_required',
      message: 'Please sign in to continue.',
    };
  }

  if (claimsError) {
    return {
      isAuthenticated: true,
      hasServiceAccess: false,
      status: 'claims_unavailable',
      message: 'You are signed in, but your authorization data could not be loaded.',
    };
  }

  if (!claims) {
    return {
      isAuthenticated: true,
      hasServiceAccess: false,
      status: 'claims_loading',
      message: 'Loading your access...',
    };
  }

  const hasServiceAccess = Boolean(
    (claims.serviceARoles && claims.serviceARoles.length > 0) ||
      (claims.serviceBRoles && claims.serviceBRoles.length > 0) ||
      claims.category === 'confidential'
  );

  return {
    isAuthenticated: true,
    hasServiceAccess,
    status: hasServiceAccess ? 'authenticated' : 'no_service_access',
    message: hasServiceAccess
      ? 'Authenticated and ready.'
      : 'You are signed in, but no service access is currently available.',
  };
}
