import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import useContestModes from '../hooks/useContestModes';
import { SHARED_PASSWORD } from '../constants';

const UserInstructions = () => {
  const [showModal, setShowModal] = useState(false);
  const { fixedPasswordMode, usernameOnlyMode, allowlistMode, modeLoading } = useContestModes();

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

      {/* `scrollable` keeps the header and footer pinned while the guide itself
          scrolls, which matters most on a phone where it is full screen. */}
      <Modal show={showModal} onHide={handleClose} size="lg" fullscreen="md-down" scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5" style={{ color: '#007bff', fontWeight: 'bold' }}>
            🎯 Contest Participation Guide
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h5 style={{ color: '#007bff' }}>🔐 Authentication Setup</h5>
            <div className="alert alert-info">
              <strong>Current Configuration:</strong>
              <ul className="mb-0 mt-2">
                {allowlistMode && <li>✅ Accounts are already made for every Yardstik employee</li>}
                {usernameOnlyMode && <li>✅ Username-only authentication (no email required)</li>}
                {fixedPasswordMode && <li>✅ Shared password: <code className="wrap-anywhere">{SHARED_PASSWORD}</code></li>}
                {!usernameOnlyMode && !allowlistMode && <li>📧 Email + Username required</li>}
                {!fixedPasswordMode && <li>🔑 Custom password required</li>}
              </ul>
            </div>
          </div>

          {!allowlistMode && (
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
          )}

          <div className="mb-4">
            <h5 style={{ color: '#007bff' }}>🔑 How to Login</h5>
            <ol>
              {allowlistMode ? (
                <li><strong>Email:</strong> Enter your Yardstik email address</li>
              ) : (
                <>
                  <li><strong>Username:</strong> Enter your registered username</li>
                  {!usernameOnlyMode && <li><strong>Email:</strong> Enter your registered email</li>}
                </>
              )}
              <li><strong>Password:</strong>
                {fixedPasswordMode ? (
                  <> Enter <code className="wrap-anywhere">{SHARED_PASSWORD}</code></>
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
              {!allowlistMode && <li><strong>Register Early:</strong> Create your account before voting begins</li>}
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
                {allowlistMode ? (
                  <li><strong>Can't Login?</strong> Use your full Yardstik email address, exactly as it appears in Slack</li>
                ) : (
                  <>
                    <li><strong>Can't Register?</strong> Try a different username</li>
                    <li><strong>Can't Login?</strong> Check your username and password</li>
                  </>
                )}
                <li><strong>Can't Vote?</strong> Make sure voting is open (Thursday morning)</li>
                <li><strong>Still Stuck?</strong> Contact contest organizers</li>
              </ul>
            </div>
          </div>

          {allowlistMode && (
            <div className="alert alert-success">
              <h6><strong>🎉 Quick Start Summary:</strong></h6>
              <p className="mb-2">
                <strong>1. Login:</strong> Your Yardstik email + <code className="wrap-anywhere">{SHARED_PASSWORD}</code><br/>
                <strong>2. Vote:</strong> Thursday morning onwards
              </p>
            </div>
          )}

          {!allowlistMode && usernameOnlyMode && fixedPasswordMode && (
            <div className="alert alert-success">
              <h6><strong>🎉 Quick Start Summary:</strong></h6>
              <p className="mb-2">
                <strong>1. Register:</strong> Username only<br/>
                <strong>2. Login:</strong> Username + <code className="wrap-anywhere">{SHARED_PASSWORD}</code><br/>
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
