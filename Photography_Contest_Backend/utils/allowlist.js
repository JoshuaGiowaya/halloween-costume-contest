const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Maps a normalized employee email to the display name shown on their photo.
// Loaded once at startup from the roster file named by EMPLOYEE_ALLOWLIST_FILE.
// The roster is never committed - this repo is public.
let roster = null;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Splits "email,name" while leaving commas inside the name alone.
const parseLine = (line) => {
  const separator = line.indexOf(',');
  if (separator === -1) {
    return null;
  }

  const email = normalizeEmail(line.slice(0, separator));
  const name = line.slice(separator + 1).trim();

  return email && name ? { email, name } : null;
};

const loadRoster = () => {
  const configuredPath = process.env.EMPLOYEE_ALLOWLIST_FILE;
  if (!configuredPath) {
    return null;
  }

  const rosterPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(__dirname, '..', configuredPath);

  // Throw rather than fall back to an open contest. Better to fail at boot,
  // while there is still time to fix it, than to let outsiders register.
  const contents = fs.readFileSync(rosterPath, 'utf8');

  const entries = new Map();
  contents
    .split(/\r?\n/)
    .slice(1) // header: email,name
    .map(parseLine)
    .filter(Boolean)
    .forEach(({ email, name }) => entries.set(email, name));

  if (entries.size === 0) {
    throw new Error(`Employee allowlist at ${rosterPath} is empty`);
  }

  logger.info(`Employee allowlist loaded: ${entries.size} addresses`);
  return entries;
};

const isEnabled = () => !!process.env.EMPLOYEE_ALLOWLIST_FILE;

// Returns the employee's display name, or null when they are not on the roster.
const displayNameFor = (email) => {
  if (!roster) {
    roster = loadRoster();
  }

  return roster ? roster.get(normalizeEmail(email)) || null : null;
};

module.exports = {
  isEnabled,
  displayNameFor,
  normalizeEmail,
  loadRoster,
};
