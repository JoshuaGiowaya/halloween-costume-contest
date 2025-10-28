import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';

const ContestPhotos = ({ contestTitle, onBack }) => {
    const [photos, setPhotos] = useState([]);
    const [votedPhoto, setVotedPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contestInfo, setContestInfo] = useState(null);
    const [votingOpen, setVotingOpen] = useState(false);

    const { user } = useContext(UserAuthContext);
    const { admin } = useContext(AdminAuthContext);

    const loggedInEmail = user?.email || admin?.email;

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

                // Fetch user votes
                const votesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/votes/fetch`, {
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });

                const userVote = votesResponse.data.find(vote => 
                    vote.email === loggedInEmail && vote.contest_title === contestTitle
                );

                if (userVote) {
                    setVotedPhoto(userVote.photo_url);
                }

                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        fetchPhotosAndVotes();
    }, [contestTitle, loggedInEmail]);

    const handleVote = async (photoUrl) => {
        if (votedPhoto) {
            alert("You have already voted for this contest.");
            return; // Prevent re-voting
        }

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
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            }
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}><Spinner animation="border" role="status"><span className="sr-only"></span></Spinner></div>;
    if (error) return <div>Error loading photos: {error.message}</div>;

    return (
        <Container>
            <Button variant="secondary" onClick={onBack}>Back to Contests</Button>
            <Row>
                {photos.map(photo => (
                    <Col md={4} key={photo._id} className="mb-4">
                        <Card>
                            <Card.Img variant="top" src={photo.photo_url} />
                            <Card.Body>
                                <Card.Text>Uploaded by: {photo.uploaded_by}</Card.Text>
                                <Button
                                    variant={votedPhoto === photo.photo_url ? "success" : "primary"}
                                    onClick={() => handleVote(photo.photo_url)}
                                    disabled={!!votedPhoto || !votingOpen} // Disable if already voted or voting closed
                                >
                                    {votedPhoto === photo.photo_url ? "Voted" : (votingOpen ? "Vote" : "Voting Closed")}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default ContestPhotos;
