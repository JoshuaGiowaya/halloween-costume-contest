import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';
import useContestModes from '../hooks/useContestModes';

const NavbarComponent = () => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
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
            <Navbar expanded={expanded} expand="lg" bg="light" fixed="top">
                <Container fluid="lg">
                    <Navbar.Brand as={Link} to="/" onClick={() => setExpanded(false)}>
                        {/* Dropped to an abbreviation on phones so the toggler keeps its place. */}
                        <span className="d-inline d-sm-none">Yardstik Halloween 2026</span>
                        <span className="d-none d-sm-inline">Yardstik Halloween costume contest 2026</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav" onClick={() => setExpanded(expanded ? false : "expanded")} />
                    <Navbar.Collapse id="responsive-navbar-nav">
                        <Nav className="ms-auto mt-2 mt-lg-0">
                            {(isUserAuth || isAdminAuth) ? (
                                <>
                                    <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>Home</Nav.Link>
                                    <Nav.Link as={Link} to="/contests" onClick={() => setExpanded(false)}>Contests</Nav.Link>
                                    {isAdminAuth && (
                                        <Nav.Link as={Link} to="/admin-dashboard" onClick={() => setExpanded(false)}>Dashboard</Nav.Link>
                                    )}
                                    <Nav.Link as="button" className="btn btn-outline-secondary mt-2 mt-lg-0 ms-lg-2" onClick={() => { handleLogout(); setExpanded(false); }}>Logout</Nav.Link>
                                </>
                            ) : (
                                <>
                                    <Nav.Link as={Link} to="/login" onClick={() => setExpanded(false)}>Login</Nav.Link>
                                    {/* Accounts are pre-made from the employee roster, so there is nothing to register for. */}
                                    {!allowlistMode && (
                                        <Nav.Link as={Link} to="/register" onClick={() => setExpanded(false)}>Register</Nav.Link>
                                    )}
                                    <Nav.Link as={Link} to="/admin-login" onClick={() => setExpanded(false)}>Admin Login</Nav.Link>
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </div>
    );
};

export default NavbarComponent;
