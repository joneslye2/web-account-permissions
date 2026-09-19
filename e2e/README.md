# e2e tests

## Increment 1 acceptance criteria → tests

Acceptance criteria are quoted from `increment-plan.md`'s Increment 1 section.

| Acceptance criterion | Verified by |
|---|---|
| "An unauthenticated user sees only login and the unsupported/denied status area where relevant." | `auth.spec.ts` → *"an unauthenticated user sees only login and a status message"* |
| "An authenticated user sees logout and the app shell." | `auth.spec.ts` → step *"AC: authenticated user sees logout and the app shell"* (after a real, completed Entra login) |
| "A user with no service access still sees a clear home page status, not a blank screen." | **Not covered here.** The account-management app / claims API this depends on doesn't exist yet, so there's no way to produce this state for a real logged-in user. Covered instead at the unit/integration layer: `src/auth.test.js`, `src/App.test.jsx`, `src/AuthenticatedApp.test.jsx`. |

## Everything else in this file

The remaining tests aren't acceptance criteria themselves — they verify the
login/logout *mechanics* the criteria above assume already work end-to-end
against the real deployed environment and real Entra tenant: redirect URI
registration, MFA, real token exchange, the logout round trip. If one of
these fails, the acceptance-criterion test above it will also fail (it can't
reach the state it needs to check), so they act as a diagnostic breadcrumb
trail rather than duplicate coverage.

The last test drives Entra's real hosted sign-in UI rather than mocking
MSAL — accepted trade-off: it breaks if Microsoft changes that page's
markup. Fix the selectors in `helpers/entraAuth.ts`, don't revert to mocks.
Unlike the other tests, it needs the E2E_TEST_EMAIL/PASSWORD/AUTH_SECRET
env vars and skips (doesn't fail) without them.
