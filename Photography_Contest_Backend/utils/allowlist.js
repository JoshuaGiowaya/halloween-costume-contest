// Employee-only mode. Every employee's account is loaded into the database
// ahead of the contest, so the server only needs to know the mode is on: it
// closes registration and identifies contestants by their Yardstik email.
//
// The variable keeps its original name so existing deployments don't need
// changing - any non-empty value turns the mode on.
const isEnabled = () => !!process.env.EMPLOYEE_ALLOWLIST_FILE;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

module.exports = {
  isEnabled,
  normalizeEmail,
};
