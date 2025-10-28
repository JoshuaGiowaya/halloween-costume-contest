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
      
      // Only include password if not in fixed password mode
      if (!fixedPasswordMode) {
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
      <div className="container mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
        <p className="text-light mt-2">Loading registration form...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center text-light" style={{ color: '#007bff' }}>Register</h2>
      {error && <div className="alert alert-danger text-center">{error}</div>}
      {fixedPasswordMode && (
        <div className="alert alert-info text-center">
          <strong>Note:</strong> A password will be automatically generated for your account.
        </div>
      )}
      {usernameOnlyMode && (
        <div className="alert alert-info text-center">
          <strong>Note:</strong> You only need to provide a username for registration.
        </div>
      )}
      <form onSubmit={submitHandler} className="mx-auto shadow p-4 rounded bg-light" style={{ maxWidth: '400px', border: '2px solid #007bff' }}>
        <div className="form-group">
          <label style={{ fontWeight: 'bold', color: '#007bff' }}>Username:</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ borderColor: '#007bff', borderWidth: '2px' }}
            required
          />
        </div>
        <br></br>
        {!usernameOnlyMode && (
          <>
            <div className="form-group">
              <label style={{ fontWeight: 'bold', color: '#007bff' }}>Email:</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ borderColor: '#007bff', borderWidth: '2px' }}
                required
              />
            </div>
            <br></br>
          </>
        )}
        {!fixedPasswordMode && (
          <>
            <div className="form-group">
              <label style={{ fontWeight: 'bold', color: '#007bff' }}>Password:</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderColor: '#007bff', borderWidth: '2px' }}
                required
              />
            </div>
            <br></br>
            <div className="form-group">
              <label style={{ fontWeight: 'bold', color: '#007bff' }}>Confirm Password:</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ borderColor: '#007bff', borderWidth: '2px' }}
                required
              />
            </div>
          </>
        )}
        <button type="submit" className="btn btn-primary d-block mx-auto mt-4" style={{ backgroundColor: '#007bff', borderColor: '#007bff', fontWeight: 'bold' }}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
