import React, { useContext } from 'react';
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';
import useContestModes from '../hooks/useContestModes';

const HomePage = () => {
    const { user } = useContext(UserAuthContext);
    const { admin } = useContext(AdminAuthContext);
    const { allowlistMode } = useContestModes();

    const getWelcomeMessage = () => {
        if (admin) {
            return `Welcome, ${admin.username}!`;
        } else if (user) {
            return `Welcome, ${user.username}!`;
        } else if (allowlistMode) {
            return 'Log in with your Yardstik email to participate';
        } else {
            return 'Please Register or Login to participate';
        }
    };

    return (
        <div className="text-center">
            <h1>Welcome to the Yardstik Halloween costume contest</h1>
            <p className="lead wrap-anywhere">
                <span className="welcome-text">{getWelcomeMessage()}</span>
            </p>
            <p className="lead page-text">
                Join our 2026 Yardstik Halloween costume contest!
            </p>

            <div className="mt-4">
                <img
                    className="d-block w-100 mx-auto"
                    style={{ maxWidth: '720px' }}
                    src="https://yardstik.com/wp-content/uploads/2024/09/a-1.svg"
                    alt="Yardstik"
                />
            </div>
        </div>
    );
};

export default HomePage;
