// Calls the account management app's custom claims API (see agent-ready-requirements.md
// section 7.3). That API does not exist yet as of this increment, so this deliberately
// throws when unconfigured rather than pretending to succeed.
export async function fetchClaims(userId) {
  const baseUrl = import.meta.env.VITE_CLAIMS_API_URL;
  if (!baseUrl) {
    throw new Error('Claims API is not configured (VITE_CLAIMS_API_URL unset)');
  }

  const response = await fetch(`${baseUrl}/claims/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Claims API request failed with status ${response.status}`);
  }

  return response.json();
}
