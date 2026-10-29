import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';
import PhotoViewer, { opensViewer } from './PhotoViewer';

const PastContestPhotos = ({ contestTitle, onBack }) => {
    const [photos, setPhotos] = useState([]);
    const [winner, setWinner] = useState(null);
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

                let winnerPhoto = null;
                const counts = {};

                if (votes.length > 0) {
                    // Count the number of votes each photo received
                    const voteCounts = votes.reduce((acc, vote) => {
                        acc[vote.photo_url] = (acc[vote.photo_url] || 0) + 1;
                        return acc;
                    }, {});
                    setVoteCounts(voteCounts);

                    // Find the photo with the highest votes
                    const winnerPhotoUrl = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);

                    // Fetch all photos for the contest
                    const photosResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/photos/fetch`, {
                        headers: {
                            'x-api-key': process.env.REACT_APP_API_KEY,
                        },
                        withCredentials: true,
                    });
                    const filteredPhotos = photosResponse.data.filter(photo => photo.contest_title === contestTitle);
                    setPhotos(filteredPhotos);

                    // Find the winner's details
                    winnerPhoto = filteredPhotos.find(photo => photo.photo_url === winnerPhotoUrl);
                } else {
                    // Fetch all photos for the contest if no votes
                    const photosResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/photos/fetch`, {
                        headers: {
                            'x-api-key': process.env.REACT_APP_API_KEY,
                        },
                        withCredentials: true,
                    });
                    const filteredPhotos = photosResponse.data.filter(photo => photo.contest_title === contestTitle);
                    setPhotos(filteredPhotos);
                }

                setWinner(winnerPhoto);
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
                    {admin && winner && (
                        <div className="my-4">
                            <h2 className="wrap-anywhere">Winner: {winner.uploaded_by}</h2>
                            {/* The winner is the hero of the page, so it keeps its real
                                aspect ratio instead of being cropped like the thumbnails. */}
                            <img
                                src={winner.photo_url}
                                alt={`Winning costume by ${winner.uploaded_by}`}
                                className="img-fluid rounded"
                                style={{ maxHeight: '60vh', objectFit: 'contain' }}
                            />
                        </div>
                    )}
                    <Row>
                        {photos.map(photo => (
                            <Col xs={12} sm={6} lg={4} key={photo._id} className="mb-4">
                                <Card>
                                    <Card.Img variant="top" className="photo-thumb" src={photo.photo_url} alt={`Costume submitted by ${photo.uploaded_by}`} {...opensViewer(() => setViewing(photo))} />
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
