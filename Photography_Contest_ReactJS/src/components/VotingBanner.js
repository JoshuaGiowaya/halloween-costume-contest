import React from 'react';
import { Alert } from 'react-bootstrap';

const VotingBanner = () => {
  return (
    <Alert variant="info" className="text-center mb-4" style={{ 
      backgroundColor: '#e3f2fd', 
      borderColor: '#007bff', 
      borderWidth: '2px',
      borderRadius: '10px'
    }}>
      <h4 className="mb-3" style={{ color: '#007bff', fontWeight: 'bold' }}>
        🗳️ Photography Contest Voting
      </h4>
      <div className="row">
        <div className="col-md-4">
          <h6 style={{ color: '#007bff', fontWeight: 'bold' }}>📅 Voting Schedule</h6>
          <p className="mb-0">
            <strong>Opens:</strong> Thursday Morning<br/>
            <strong>Closes:</strong> Check contest details
          </p>
        </div>
        <div className="col-md-4">
          <h6 style={{ color: '#007bff', fontWeight: 'bold' }}>🔐 Quick Access</h6>
          <p className="mb-0">
            <strong>Username:</strong> Your choice<br/>
            <strong>Password:</strong> <code>yardstik-halloween-2025</code>
          </p>
        </div>
        <div className="col-md-4">
          <h6 style={{ color: '#007bff', fontWeight: 'bold' }}>📸 How to Vote</h6>
          <p className="mb-0">
            1. Register/Login<br/>
            2. Browse photos<br/>
            3. Click to vote!
          </p>
        </div>
      </div>
    </Alert>
  );
};

export default VotingBanner;
