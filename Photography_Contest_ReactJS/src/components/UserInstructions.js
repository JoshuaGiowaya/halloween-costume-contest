import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';

const UserInstructions = () => {
  const [showModal, setShowModal] = useState(false);
  const [fixedPasswordMode, setFixedPasswordMode] = useState(false);
  const [usernameOnlyMode, setUsernameOnlyMode] = useState(false);
  const [modeLoading, setModeLoading] = useState(true);

  // Check authentication modes on component mount
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
        setFixedPasswordMode(false);
        setUsernameOnlyMode(false);
      } finally {
        setModeLoading(false);
      }
    };

    checkModes();
  }, []);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  if (modeLoading) {
    return (
      <Button variant="outline-info" disabled>
        <Spinner animation="border" size="sm" className="me-2" />
        Loading...
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="outline-info" 
        onClick={handleShow}
        className="mb-3"
        style={{ borderColor: '#007bff', color: '#007bff' }}
      >
        📖 How to Participate
      </Button>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: '#007bff', fontWeight: 'bold' }}>
            🎯 Contest Participation Guide
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="mb-4">
            <h5 style={{ color: '#007bff' }}>🔐 Authentication Setup</h5>
            <div className="alert alert-info">
              <strong>Current Configuration:</strong>
              <ul className="mb-0 mt-2">
                {usernameOnlyMode && <li>✅ Username-only authentication (no email required)</li>}
                {fixedPasswordMode && <li>✅ Fixed password: <code>yardstik-halloween-2025</code></li>}
                {!usernameOnlyMode && <li>📧 Email + Username required</li>}
                {!fixedPasswordMode && <li>🔑 Custom password required</li>}
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h5 style={{ color: '#007bff' }}>📝 How to Register</h5>
            <ol>
              <li><strong>Username:</strong> Choose a unique username</li>
              {!usernameOnlyMode && <li><strong>Email:</strong> Enter your email address</li>}
              {!fixedPasswordMode && <li><strong>Password:</strong> Create a secure password</li>}
              {fixedPasswordMode && <li><strong>Password:</strong> Will be automatically generated</li>}
              <li>Click <strong>"Register"</strong> to create your account</li>
            </ol>
          </div>

          <div className="mb-4">
            <h5 style={{ color: '#007bff' }}>🔑 How to Login</h5>
            <ol>
              <li><strong>Username:</strong> Enter your registered username</li>
              {!usernameOnlyMode && <li><strong>Email:</strong> Enter your registered email</li>}
              <li><strong>Password:</strong> 
                {fixedPasswordMode ? (
                  <> Enter <code>yardstik-halloween-2025</code></>
                ) : (
                  <> Enter your custom password</>
                )}
              </li>
              <li>Click <strong>"Login"</strong> to access the contest</li>
            </ol>
          </div>

          <div className="mb-4">
            <h5 style={{ color: '#007bff' }}>🗳️ How to Vote</h5>
            <div className="alert alert-warning">
              <strong>⏰ Voting Schedule:</strong> Opens Thursday Morning
            </div>
            <ol>
              <li><strong>Browse Photos:</strong> View all contest submissions</li>
              <li><strong>Select Favorite:</strong> Click on the photo you want to vote for</li>
              <li><strong>Confirm Vote:</strong> Confirm your selection</li>
              <li><strong>View Results:</strong> See real-time vote counts</li>
            </ol>
          </div>

          <div className="mb-4">
            <h5 style={{ color: '#007bff' }}>💡 Tips for Success</h5>
            <ul>
              <li><strong>Register Early:</strong> Create your account before voting begins</li>
              <li><strong>Test Login:</strong> Make sure you can log in successfully</li>
              <li><strong>Bookmark Site:</strong> Save the contest URL for easy access</li>
              <li><strong>Vote Responsibly:</strong> You may have limited votes</li>
              <li><strong>Share Contest:</strong> Help spread the word!</li>
            </ul>
          </div>

          <div className="mb-4">
            <h5 style={{ color: '#007bff' }}>❓ Need Help?</h5>
            <div className="alert alert-light">
              <ul className="mb-0">
                <li><strong>Can't Register?</strong> Try a different username</li>
                <li><strong>Can't Login?</strong> Check your username and password</li>
                <li><strong>Can't Vote?</strong> Make sure voting is open (Thursday morning)</li>
                <li><strong>Still Stuck?</strong> Contact contest organizers</li>
              </ul>
            </div>
          </div>

          {usernameOnlyMode && fixedPasswordMode && (
            <div className="alert alert-success">
              <h6><strong>🎉 Quick Start Summary:</strong></h6>
              <p className="mb-2">
                <strong>1. Register:</strong> Username only<br/>
                <strong>2. Login:</strong> Username + <code>yardstik-halloween-2025</code><br/>
                <strong>3. Vote:</strong> Thursday morning onwards
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleClose} style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}>
            Got It!
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserInstructions;
