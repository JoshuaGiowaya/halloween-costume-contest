import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';
import PhotoViewer, { opensViewer, FullSizeHint } from './PhotoViewer';
import { tallyVotes } from '../utils/tallyVotes';

const PastContestPhotos = ({ contestTitle, onBack }) => {
    const [photos, setPhotos] = useState([]);
    const [winners, setWinners] = useState([]);
    const [tied, setTied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [voteCounts, setVoteCounts] = useState({});
    const [viewing, setViewing] = useState(null);

    const { user } = useContext(UserAuthContext);
    const { admin } = useContext(AdminAuthContext);

    const loggedInEmail = user?.email || admin?.email;

    useEffect(() => {
        const fetchVotesAndPhotos = async () => {
            try {
                // Fetch votes related to the contest
                const votesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/votes/fetch`, {
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });
                const votes = votesResponse.data.filter(vote => vote.contest_title === contestTitle);

                // Fetch all photos for the contest
                const photosResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/photos/fetch`, {
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });
                const filteredPhotos = photosResponse.data.filter(photo => photo.contest_title === contestTitle);
                setPhotos(filteredPhotos);

                const tally = tallyVotes(votes, filteredPhotos);
                setVoteCounts(tally.counts);
                setWinners(tally.winners);
                setTied(tally.tied);

                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        fetchVotesAndPhotos();
    }, [contestTitle]);

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}><Spinner animation="border" role="status"><span className="sr-only"></span></Spinner></div>;
    if (error) return <div>Error loading photos: {error.message}</div>;

    return (
        <Container fluid className="px-0">
            <Button variant="secondary" className="sticky-back" onClick={onBack}>Back to Contests</Button>
            {photos.length === 0 ? (
                <div className="my-4">
                    <h2>There were no participants in this contest</h2>
                </div>
            ) : (
                <>
                    {admin && winners.length > 0 && (
                        <div className="my-4">
                            {/* A tie is called rather than broken: with this few
                                voters two costumes finishing level is likely, and
                                picking one of them silently is how the wrong name
                                gets read out. */}
                            <h2 className="wrap-anywhere">
                                {tied
                                    ? `Tied for first: ${winners.map(w => w.uploaded_by).join(', ')}`
                                    : `Winner: ${winners[0].uploaded_by}`}
                            </h2>
                            {/* The winner is the hero of the page, so it keeps its real
                                aspect ratio instead of being cropped like the thumbnails. */}
                            {winners.map(winner => (
                                <img
                                    key={winner._id}
                                    src={winner.photo_url}
                                    alt={`Winning costume by ${winner.uploaded_by}`}
                                    className="img-fluid rounded mb-3"
                                    style={{ maxHeight: '60vh', objectFit: 'contain' }}
                                />
                            ))}
                        </div>
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
                                        <Card.Text>Votes: {voteCounts[photo.photo_url] || 0}</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <PhotoViewer photo={viewing} onHide={() => setViewing(null)} />
                </>
            )}
        </Container>
    );
};

export default PastContestPhotos;
