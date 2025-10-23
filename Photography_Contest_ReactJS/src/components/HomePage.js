import React, { useContext } from 'react';
import { Carousel } from 'react-bootstrap';
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';

const HomePage = () => {
    const { user } = useContext(UserAuthContext);
    const { admin } = useContext(AdminAuthContext);

    const getWelcomeMessage = () => {
        if (admin) {
            return `Welcome, ${admin.username}!`;
        } else if (user) {
            return `Welcome, ${user.username}!`;
        } else {
            return 'Please Register or Login to participate';
        }
    };

    return (
        <div className="container text-center">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap');

                .welcome-text {
                    font-family: 'Raleway', sans-serif;
                    font-size: 2em;
                    background-image: -webkit-linear-gradient(left, #ff4b2b, #ff416c);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                }

                .page-text {
                    font-family: 'Raleway', sans-serif;
                    font-size: 1.2em;
                    line-height: 1.6;
                }
                
                `}
            </style>

            <h1 className='page-text'>Welcome to the Yardstik Halloween costume contest</h1>
            <p className="lead">
                <span className="welcome-text">{getWelcomeMessage()}</span>
            </p>
            <p className="lead page-text">
                Join our 2025 YardsTik Halloween costume contest!
            </p>

        <div className="carousel slide">
            <img
                className="d-block w-100"
                src="https://yardstik.com/wp-content/uploads/2024/09/a-1.svg"
                alt="First slide"
            />
        </div>
            
        </div>
    );
};

export default HomePage;
