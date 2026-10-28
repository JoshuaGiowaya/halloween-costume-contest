import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fixedPasswordMode, setFixedPasswordMode] = useState(false);
  const [usernameOnlyMode, setUsernameOnlyMode] = useState(false);
  const [modeLoading, setModeLoading] = useState(true);
  const navigate = useNavigate();

  // Check registration modes on component mount
  useEffect(() => {
    const checkModes = async () => {
      try {
        const [registrationModeResponse, usernameOnlyModeResponse] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/users/registration-mode`,
            {
              headers: {
                'x-api-key': process.env.REACT_APP_API_KEY,
              },
            }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/users/username-only-mode`,
            {
              headers: {
                'x-api-key': process.env.REACT_APP_API_KEY,
              },
            }
          )
        ]);
        setFixedPasswordMode(registrationModeResponse.data.fixedPasswordMode);
        setUsernameOnlyMode(usernameOnlyModeResponse.data.usernameOnlyMode);
      } catch (error) {
        console.error('Failed to check modes:', error);
        // Default to normal modes if check fails
        setFixedPasswordMode(false);
        setUsernameOnlyMode(false);
      } finally {
        setModeLoading(false);
      }
    };

    checkModes();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    // Reset error state
    setError(null);

    // Only validate passwords if not in fixed password mode
    if (!fixedPasswordMode && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    console.log(process.env.REACT_APP_API_URL);
    try {
      // Prepare registration data based on mode
      const registrationData = { username };
      
      // Only include email if not in username-only mode
      if (!usernameOnlyMode) {
        registrationData.email = email;
      }
      
      // Include password based on mode
      if (fixedPasswordMode) {
        // Send the fixed password from environment
        registrationData.password = process.env.REACT_APP_FIXED_USER_PASSWORD;
      } else {
        // Send the user-provided password
        registrationData.password = password;
      }

      // Make the registration API call
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users/register`,
        registrationData,
        {
          headers: {
            'x-api-key': process.env.REACT_APP_API_KEY,  // Include API key in the request
          },
          withCredentials: true,  // Ensure cookies are sent/received with the request
        }
      );

      // Redirect to login after successful registration
      navigate('/login');
    } catch (error) {
      // Handle errors and set error messages
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Registration failed. Please try again.'
      );
    } finally {
      // Stop loading spinner
      setLoading(false);
    }
  };

  // Show loading spinner while checking registration mode
  if (modeLoading) {
    return (
      <div className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading registration form...</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h2 className="text-center" style={{ color: '#007bff' }}>Register</h2>
      {error && <div className="alert alert-danger text-center">{error}</div>}
      {fixedPasswordMode && (
        <div className="alert alert-info text-center">
          <strong>Note:</strong> A password will be automatically generated for your account.
        </div>
      )}
      {usernameOnlyMode && (
        <div className="alert alert-info text-center">
          <strong>Note:</strong> You only need to provide a username for registration. <br></br>Please do not use spaces in your username. You can use underscores or hyphens instead. 
          <br></br>If you want your username to explain your costume you can format it as play-on-words, or play_on_words.
        </div>
      )}
      <form onSubmit={submitHandler} className="form-card shadow bg-light">
        <div className="form-group">
          <label htmlFor="register-username">Username:</label>
          <input
            id="register-username"
            type="text"
            className="form-control"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        {!usernameOnlyMode && (
          <div className="form-group mt-3">
            <label htmlFor="register-email">Email:</label>
            <input
              id="register-email"
              type="email"
              className="form-control"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}
        {!fixedPasswordMode && (
          <>
            <div className="form-group mt-3">
              <label htmlFor="register-password">Password:</label>
              <input
                id="register-password"
                type="password"
                className="form-control"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group mt-3">
              <label htmlFor="register-confirm-password">Confirm Password:</label>
              <input
                id="register-confirm-password"
                type="password"
                className="form-control"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}
        <button type="submit" className="btn btn-primary mt-4" style={{ fontWeight: 'bold' }}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
