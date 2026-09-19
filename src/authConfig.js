const TENANT_ID = '6255c754-e30b-4758-bad0-d9051e73013b';
const TENANT_SUBDOMAIN = 'joneslye';

// Non-prod app registration client ID by default; each environment
// overrides this at container *runtime* (window.__APP_CONFIG__, set by
// docker-entrypoint.sh from the MSAL_CLIENT_ID env var App Runner injects -
// see terraform/environment). Not build-time, so the same Docker image runs
// unchanged across every environment.
const DEFAULT_CLIENT_ID = '671e9818-dea5-4b0d-ac43-7eaf5470894d';

export const msalConfig = {
  auth: {
    clientId: window.__APP_CONFIG__?.msalClientId || DEFAULT_CLIENT_ID,
    authority: `https://${TENANT_SUBDOMAIN}.ciamlogin.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile'],
};
