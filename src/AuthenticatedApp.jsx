import { useEffect, useState } from 'react';
import App from './App';
import { computeAuthState } from './auth';
import { msalInstance } from './msalClient';
import { loginRequest } from './authConfig';
import { fetchClaims } from './claimsApi';

export default function AuthenticatedApp() {
  const [account, setAccount] = useState(() => msalInstance.getActiveAccount());
  const [claims, setClaims] = useState(null);
  const [claimsError, setClaimsError] = useState(false);

  useEffect(() => {
    const callbackId = msalInstance.addEventCallback((event) => {
      if (event.eventType === 'msal:loginSuccess' || event.eventType === 'msal:acquireTokenSuccess') {
        setAccount(msalInstance.getActiveAccount());
      }
      if (event.eventType === 'msal:logoutSuccess') {
        setAccount(null);
      }
    });
    return () => {
      if (callbackId) msalInstance.removeEventCallback(callbackId);
    };
  }, []);

  useEffect(() => {
    if (!account) {
      setClaims(null);
      setClaimsError(false);
      return undefined;
    }

    let cancelled = false;
    setClaims(null);
    setClaimsError(false);

    fetchClaims(account.localAccountId || account.homeAccountId)
      .then((result) => {
        if (!cancelled) setClaims(result);
      })
      .catch(() => {
        if (!cancelled) setClaimsError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [account]);

  const authState = computeAuthState({
    isAuthenticated: Boolean(account),
    claims,
    claimsError,
  });

  return (
    <App
      authState={authState}
      onLogin={() => msalInstance.loginRedirect(loginRequest)}
      onLogout={() => msalInstance.logoutRedirect()}
    />
  );
}
