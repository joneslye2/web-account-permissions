#!/bin/sh
set -e

# Injects environment-specific values at container *start*, not build time,
# so the same image runs unchanged across every environment - see
# authConfig.js (reads window.__APP_CONFIG__) and terraform/environment's
# runtime_environment_variables (sets MSAL_CLIENT_ID on the container).
cat > /app/dist/config.js <<EOF
window.__APP_CONFIG__ = {
  msalClientId: "${MSAL_CLIENT_ID:-}"
};
EOF

exec "$@"
