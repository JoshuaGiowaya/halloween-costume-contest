import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';
import PhotoViewer, { opensViewer, FullSizeHint } from './PhotoViewer';
import { serverMessage } from '../utils/serverMessage';
import backgroundClient, { backgroundConfig, POLL_INTERVAL_MS } from '../utils/backgroundClient';

const ContestPhotos = ({ contestTitle, onBack }) => {
    const [photos, setPhotos] = useState([]);
    const [votedPhoto, setVotedPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contestInfo, setContestInfo] = useState(null);
    const [votingOpen, setVotingOpen] = useState(false);
    const [viewing, setViewing] = useState(null);
    // One vote in flight at a time. Two taps on Vote used to put two requests
    // on the wire before either came back and set votedPhoto, and both counted.
    const [submitting, setSubmitting] = useState(false);
    const [voteError, setVoteError] = useState('');
    // The same guard as `submitting`, but readable the instant it is set. Two
    // clicks inside one tick both see the old value of a piece of state, so
    // state alone doesn't stop a fast double-click - only a slower double-tap.
    const voteInFlight = useRef(false);

    const { user } = useContext(UserAuthContext);
    const { admin } = useContext(AdminAuthContext);

    const loggedInEmail = user?.email || admin?.email;

    // Whether voting is open is the admin's to change while this page is open,
    // so it is re-read on a timer instead of only once on mount. Without it a
    // contestant sat looking at a greyed-out "Voting Closed" until they
    // thought to reload.
    const refreshVotingState = useCallback(async () => {
        try {
            const { data } = await backgroundClient.get(
                `${process.env.REACT_APP_API_URL}/api/contests/fetch`,
                backgroundConfig
            );
            const contest = data.find(c => c.title === contestTitle);
            setContestInfo(contest);
            setVotingOpen(Boolean(contest?.voting_open));
        } catch (error) {
            // A dropped poll just means the buttons stay as they are until the
            // next one.
            console.error('Could not refresh the voting state:', error);
        }
    }, [contestTitle]);

    useEffect(() => {
        const fetchPhotosAndVotes = async () => {
            try {
                // Fetch contest details to determine voting state
                const contestsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/contests/fetch`, {
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });

                const contest = contestsResponse.data.find(c => c.title === contestTitle);
                setContestInfo(contest);
                setVotingOpen(Boolean(contest?.voting_open));

                // Fetch photos related to the contest
                const photosResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/photos/fetch`, {
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });

                const filteredPhotos = photosResponse.data.filter(photo => photo.contest_title === contestTitle);
                setPhotos(filteredPhotos);

                // Ask only for this voter's own vote. The full list no longer
                // carries emails - who voted for whom isn't public.
                if (loggedInEmail) {
                    const voteResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/votes/mine`, {
                        headers: {
                            'x-api-key': process.env.REACT_APP_API_KEY,
                        },
                        params: { email: loggedInEmail, contest_title: contestTitle },
                        withCredentials: true,
                    });

                    if (voteResponse.data.voted) {
                        setVotedPhoto(voteResponse.data.photo_url);
                    }
                }

                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        fetchPhotosAndVotes();
    }, [contestTitle, loggedInEmail]);

    useEffect(() => {
        const timer = setInterval(refreshVotingState, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [refreshVotingState]);

    const handleVote = async (photoUrl) => {
        // The button is disabled in both these cases; this is the guard against
        // two taps landing before React has re-rendered it.
        if (voteInFlight.current || votedPhoto) return;

        if (!loggedInEmail) {
            setVoteError('Your session has expired. Please log in again before voting.');
            return;
        }

        voteInFlight.current = true;
        setSubmitting(true);
        setVoteError('');

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/votes/insert`, {
                photo_url: photoUrl,
                email: loggedInEmail,
                contest_title: contestTitle
            }, {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            });

            setVotedPhoto(photoUrl);
            console.log('Vote submitted successfully', response.data);
        } catch (error) {
            console.error('There was an error submitting the vote!', error);
            // serverMessage reads the validator shape too. Checking only for
            // data.error meant a rejected vote - an expired session sending no
            // email, say - looked like nothing happening at all.
            setVoteError(serverMessage(error, 'We could not record your vote. Please check your connection and try again.'));
            // Most likely voting closed while this page was open, so take the
            // buttons with it rather than waiting for the next poll.
            refreshVotingState();
        } finally {
            voteInFlight.current = false;
            setSubmitting(false);
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}><Spinner animation="border" role="status"><span className="sr-only"></span></Spinner></div>;
    if (error) return <div>Error loading photos: {error.message}</div>;

    return (
        <Container fluid className="px-0">
            <Button variant="secondary" className="sticky-back" onClick={onBack}>Back to Contests</Button>
            {voteError && (
                <div className="alert alert-danger my-3" role="alert">{voteError}</div>
            )}
            <Row>
                {photos.map(photo => (
                    <Col xs={12} sm={6} lg={4} key={photo._id} className="mb-4">
                        <Card>
                            <Card.Img variant="top" className="photo-thumb" src={photo.photo_url} alt={`Costume submitted by ${photo.uploaded_by}`} {...opensViewer(() => setViewing(photo))} />
                            <FullSizeHint />
                            <Card.Body>
                                <Card.Text className="wrap-anywhere">Uploaded by: {photo.uploaded_by}</Card.Text>
                                {photo.description && (
                                    <Card.Text className="wrap-anywhere text-muted">{photo.description}</Card.Text>
                                )}
                                <Button
                                    className="w-100"
                                    variant={votedPhoto === photo.photo_url ? "success" : "primary"}
                                    onClick={() => handleVote(photo.photo_url)}
                                    // Disabled while a vote is in flight too, so a
                                    // second tap can't start a second vote.
                                    disabled={!!votedPhoto || !votingOpen || submitting}
                                >
                                    {votedPhoto === photo.photo_url
                                        ? "Voted"
                                        : submitting
                                            ? "Voting…"
                                            : (votingOpen ? "Vote" : "Voting Closed")}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
            <PhotoViewer photo={viewing} onHide={() => setViewing(null)} />
        </Container>
    );
};

export default ContestPhotos;
