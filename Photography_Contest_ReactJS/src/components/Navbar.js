import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';
import useContestModes from '../hooks/useContestModes';

const NavbarComponent = () => {
    const navigate = useNavigate();
    const { allowlistMode } = useContestModes();

    const { isAuth: isUserAuth, user, logout: userLogout } = useContext(UserAuthContext);
    const { isAdminAuth, admin, logout: adminLogout } = useContext(AdminAuthContext);

    const handleLogout = () => {
        if (isAdminAuth) {
            adminLogout();
        } else {
            userLogout();
        }
        navigate('/');
    };

    useEffect(() => {
        // Trigger re-render if isAdminAuth changes
    }, [isAdminAuth]);

    return (
        <div>
            {/* `expand` with no breakpoint keeps the links inline at every width.
                Now that accounts are pre-made there are only two of them for a
                signed-out visitor, which is fewer than a toggle button was worth:
                it cost a tap and hid the only two things a new arrival wants. */}
            <Navbar expand bg="light" fixed="top">
                <Container fluid="lg">
                    <Navbar.Brand as={Link} to="/">
                        {/* Shortened on phones so the links keep their place. */}
                        <span className="d-inline d-sm-none">Halloween 2026</span>
                        <span className="d-none d-sm-inline">Yardstik Halloween costume contest 2026</span>
                    </Navbar.Brand>
                    <Nav className="ms-auto">
                        {(isUserAuth || isAdminAuth) ? (
                            <>
                                {/* Icon-only on phones: "Home" is the longest word here
                                    for the least information, and dropping it to a glyph
                                    is what keeps an admin's four links on a small screen. */}
                                <Nav.Link as={Link} to="/" aria-label="Home">
                                    <svg
                                        className="d-sm-none nav-icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 16 16"
                                        fill="currentColor"
                                        aria-hidden="true"
                                        focusable="false"
                                    >
                                        <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4h3v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 4.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v.293z" />
                                    </svg>
                                    <span className="d-none d-sm-inline">Home</span>
                                </Nav.Link>
                                <Nav.Link as={Link} to="/contests">Contests</Nav.Link>
                                {isAdminAuth && (
                                    <Nav.Link as={Link} to="/admin-dashboard">Dashboard</Nav.Link>
                                )}
                                <Nav.Link as="button" className="btn btn-outline-secondary ms-2" onClick={handleLogout}>Logout</Nav.Link>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                {/* Accounts are pre-made from the employee roster, so there is nothing to register for. */}
                                {!allowlistMode && (
                                    <Nav.Link as={Link} to="/register">Register</Nav.Link>
                                )}
                                <Nav.Link as={Link} to="/admin-login">Admin Login</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Container>
            </Navbar>
        </div>
    );
};

export default NavbarComponent;
