const TENANT_ID = '6255c754-e30b-4758-bad0-d9051e73013b';
const TENANT_SUBDOMAIN = 'joneslye';

// Non-prod app registration client ID by default; production builds override
// this via the VITE_MSAL_CLIENT_ID build-time env var (see Dockerfile).
const DEFAULT_CLIENT_ID = '671e9818-dea5-4b0d-ac43-7eaf5470894d';

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || DEFAULT_CLIENT_ID,
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
