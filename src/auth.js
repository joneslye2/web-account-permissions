export function computeAuthState(user) {
  if (!user) {
    return {
      isAuthenticated: false,
      hasServiceAccess: false,
      status: 'login_required',
      message: 'Please sign in to continue.',
    };
  }

  const hasServiceAccess = Boolean(
    (user.serviceARoles && user.serviceARoles.length > 0) ||
      (user.serviceBRoles && user.serviceBRoles.length > 0) ||
      user.category === 'confidential'
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
