import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserAuthContext = createContext();

// The login cookie is set with SameSite=None because the site and the API sit
// on different domains. iOS Safari blocks cross-site cookies outright ("Prevent
// Cross-Site Tracking" is on by default), so /validateToken fails on every
// iPhone reload even though the login itself succeeded. Keeping a copy of who
// logged in means a contestant stays signed in there instead of silently
// turning into a logged-out visitor with a blank name and email.
const STORAGE_KEY = 'costume-contest.user';

const readStoredUser = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        // Private browsing can throw on access rather than returning null.
        return null;
    }
};

const writeStoredUser = (user) => {
    try {
        if (user) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch (error) {
        // Nothing to do - the session simply won't survive a reload.
    }
};

// The login response calls it _id and /validateToken calls it id.
const toSessionUser = (data) => ({
    id: data._id || data.id,
    username: data.username,
    email: data.email,
});

export const UserAuthProvider = ({ children }) => {
    const [user, setUser] = useState(readStoredUser);
    const [isAuth, setIsAuth] = useState(() => !!readStoredUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/validateToken`, {
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });

                const validated = toSessionUser(data.user);
                setUser(validated);
                setIsAuth(true);
                writeStoredUser(validated);
            } catch (error) {
                // Fall back to the stored session rather than clearing it: on a
                // phone that drops the cookie this is the only thing keeping the
                // contestant logged in.
                const stored = readStoredUser();
                setUser(stored);
                setIsAuth(!!stored);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, []);

    const login = (data) => {
        const session = toSessionUser(data);
        setUser(session);
        setIsAuth(true);
        writeStoredUser(session);
    };

    const logout = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/users/logout`, {}, {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            });
        } catch (error) {
            // The cookie may never have reached the phone. Sign out locally anyway.
        }
        setUser(null);
        setIsAuth(false);
        writeStoredUser(null);
    };

    return (
        <UserAuthContext.Provider value={{ user, isAuth, login, logout, loading }}>
            {!loading && children}
        </UserAuthContext.Provider>
    );
};
