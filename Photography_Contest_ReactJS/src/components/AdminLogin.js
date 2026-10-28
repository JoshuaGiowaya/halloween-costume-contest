import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';
import { AdminAuthContext } from '../context/AdminAuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AdminAuthContext); // Use AdminAuthContext here
  const navigate = useNavigate();

  console.log(process.env.REACT_APP_API_URL);
  console.log(process.env.REACT_APP_API_KEY);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/login`,
        { email, password },
        {
          headers: {
            'x-api-key': process.env.REACT_APP_API_KEY,
          },
          withCredentials: true,
        }
      );
      login(data);  // This should update the auth state immediately
      navigate('/admin-dashboard'); // Redirect to admin dashboard after successful login
    } catch (error) {
      console.error('Admin login error:', error);
      alert('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-center" style={{ color: '#007bff' }}>Admin Login</h2>
      <form onSubmit={handleLogin} className="form-card shadow bg-light">
        <div className="form-group">
          <label htmlFor="admin-email">Email:</label>
          <input
            id="admin-email"
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
        <div className="form-group mt-3">
          <label htmlFor="admin-password">Password:</label>
          <input
            id="admin-password"
            type="password"
            className="form-control"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary mt-4" style={{ fontWeight: 'bold' }}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
