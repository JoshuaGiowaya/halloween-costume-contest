// The one password everyone uses. Defined here so the login page, the
// registration notice and the instructions modal cannot drift apart.
export const SHARED_PASSWORD =
  process.env.REACT_APP_FIXED_USER_PASSWORD || 'yardstik-halloween-2026';
