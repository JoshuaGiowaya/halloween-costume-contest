import { useState, useEffect } from 'react';
import axios from 'axios';

// Fetches the auth modes the backend is running in. Several components need
// these, so the request lives here rather than being copied into each one.
const useContestModes = () => {
  const [modes, setModes] = useState({
    fixedPasswordMode: false,
    usernameOnlyMode: false,
    allowlistMode: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkModes = async () => {
      const config = {
        headers: { 'x-api-key': process.env.REACT_APP_API_KEY },
      };

      try {
        const [registrationMode, usernameOnly] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/users/registration-mode`, config),
          axios.get(`${process.env.REACT_APP_API_URL}/api/users/username-only-mode`, config),
        ]);

        setModes({
          fixedPasswordMode: registrationMode.data.fixedPasswordMode,
          allowlistMode: registrationMode.data.allowlistMode,
          usernameOnlyMode: usernameOnly.data.usernameOnlyMode,
        });
      } catch (error) {
        console.error('Failed to check modes:', error);
        // Leave the defaults in place if the backend cannot be reached.
      } finally {
        setLoading(false);
      }
    };

    checkModes();
  }, []);

  return { ...modes, modeLoading: loading };
};

export default useContestModes;
