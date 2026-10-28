import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, ToggleButtonGroup, ToggleButton, Modal, Form, Spinner } from 'react-bootstrap';
import ReactDOM from 'react-dom';
import ContestPhotos from './ContestPhotos';
import PastContestPhotos from './PastContestPhotos';
import { UserAuthContext } from '../context/UserAuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { prepareImage, validateFile, MAX_UPLOAD_MB } from '../utils/prepareImage';
import { serverMessage } from '../utils/serverMessage';

// Axios configuration with interceptors
let spinnerCounter = 0;

const showSpinner = () => {
    spinnerCounter++;
    if (spinnerCounter === 1) {
        const spinnerElement = document.createElement('div');
        spinnerElement.id = 'spinner-overlay';
        spinnerElement.style.position = 'fixed';
        spinnerElement.style.top = '0';
        spinnerElement.style.left = '0';
        spinnerElement.style.width = '100%';
        spinnerElement.style.height = '100%';
        spinnerElement.style.display = 'flex';
        spinnerElement.style.justifyContent = 'center';
        spinnerElement.style.alignItems = 'center';
        spinnerElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        document.body.appendChild(spinnerElement);

        ReactDOM.render(<Spinner animation="border" role="status"><span className="sr-only"></span></Spinner>, spinnerElement);
    }
};

const hideSpinner = () => {
    spinnerCounter--;
    if (spinnerCounter === 0) {
        const spinnerElement = document.getElementById('spinner-overlay');
        if (spinnerElement) {
            ReactDOM.unmountComponentAtNode(spinnerElement);
            document.body.removeChild(spinnerElement);
        }
    }
};

// Request interceptor
axios.interceptors.request.use(request => {
    showSpinner();
    return request;
}, error => {
    hideSpinner();
    return Promise.reject(error);
});

// Response interceptor
axios.interceptors.response.use(response => {
    hideSpinner();
    return response;
}, error => {
    hideSpinner();
    return Promise.reject(error);
});

const ViewContests = () => {
    const { user } = useContext(UserAuthContext);
    const { admin } = useContext(AdminAuthContext);

    const loggedInUser = user ? user.email : (admin ? admin.email : null);
    const loggedInUsername = user ? user.username : (admin ? admin.username : null);

    const [contests, setContests] = useState([]);
    const [filter, setFilter] = useState("ongoing"); // Default to ongoing contests
    const [selectedContest, setSelectedContest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        contest_title: '',
        uploaded_by: '',
        description: '',
        email: '',
        photo_url: ''
    });
    const [modalMode, setModalMode] = useState('join'); // 'join' for a first entry, 'replace' to swap the photo
    const [userPhotos, setUserPhotos] = useState([]);
    const [viewingPastContest, setViewingPastContest] = useState(false);
    const [loading, setLoading] = useState(true); // Add loading state
    const [disableJoinWhenVotingStarts, setDisableJoinWhenVotingStarts] = useState(false);

    // New state for file upload
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [preparing, setPreparing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        // Fetch the contest data and disable join setting
        Promise.all([
            axios.get(`${process.env.REACT_APP_API_URL}/api/contests/fetch`, {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            }),
            axios.get(`${process.env.REACT_APP_API_URL}/api/contests/disable-join-when-voting-starts`, {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            })
        ])
            .then(([contestsResponse, disableJoinResponse]) => {
                if (contestsResponse.status === 200) {
                    setContests(contestsResponse.data);
                } else {
                    console.error('Error fetching contests: ', contestsResponse.status);
                }
                
                if (disableJoinResponse.status === 200) {
                    setDisableJoinWhenVotingStarts(disableJoinResponse.data.disableJoinWhenVotingStarts);
                } else {
                    console.error('Error fetching disable join setting: ', disableJoinResponse.status);
                }
            })
            .catch(error => {
                console.error('There was an error fetching data!', error);
            })
            .finally(() => setLoading(false)); // Stop loading spinner

        // Fetch the user's photos
        if (loggedInUser) {
            axios.get(`${process.env.REACT_APP_API_URL}/api/photos/fetch`, {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            })
                .then(response => {
                    
                    if (response.status === 200) {
                        console.log("PHOTOS LOADED")
                        setUserPhotos(response.data.filter(photo => photo.email === loggedInUser));
                    } else {
                        console.error('Error fetching photos: ', response.status);
                    }
                })
                .catch(error => {
                    console.error('There was an error fetching the photos!', error);
                });
        }
    }, [loggedInUser]);

    const today = new Date();

    
    // Log each contest's dates
    contests.forEach(contest => {
        console.log(`Contest: ${contest.title}`);
        console.log('Start date: ', new Date(contest.start_date));
        console.log('End date: ', new Date(contest.end_date));
        console.log('Today: ', today);
        console.log('---');
    });

    contests.forEach(contest => {
        console.log(`Contest: ${contest.title}`);
        
        // Brazil timezone (America/Sao_Paulo)
        console.log('Brazil Timezone:');
        console.log('Start date (Brazil): ', new Date(contest.start_date).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        console.log('End date (Brazil): ', new Date(contest.end_date).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        
        // Colorado timezone (America/Denver)
        console.log('Colorado Timezone:');
        console.log('Start date (Colorado): ', new Date(contest.start_date).toLocaleString('en-US', { timeZone: 'America/Denver' }));
        console.log('End date (Colorado): ', new Date(contest.end_date).toLocaleString('en-US', { timeZone: 'America/Denver' }));
        
        console.log('Today: ', today);
        console.log('---');
    });

    // Filter contests based on contest status and voting status
    const ongoingContests = contests.filter(contest => {
        if (contest.manual_control) {
            // Manual control contests are ongoing if contest is active
            return contest.contest_status === 'active';
        } else {
            // Scheduled contests are ongoing if within date range
            return new Date(contest.start_date) <= today && new Date(contest.end_date) >= today;
        }
    });

    const pastContests = contests.filter(contest => {
        if (contest.manual_control) {
            // Manual control contests are past if contest is ended
            return contest.contest_status === 'ended';
        } else {
            // Scheduled contests are past if end date has passed
            return new Date(contest.end_date) < today;
        }
    });
    
    const upcomingContests = contests.filter(contest => {
        if (contest.manual_control) {
            // Manual control contests are upcoming if not started
            return contest.contest_status === 'not_started';
        } else {
            // Scheduled contests are upcoming if start date is in the future
            return new Date(contest.start_date) > today;
        }
    });
    
    console.log('ongoingContests: ', ongoingContests);
    console.log('pastContests: ', pastContests);
    console.log('upcomingContests: ', upcomingContests);

    const handleViewClick = (contestTitle, isPast) => {
        setSelectedContest(contestTitle);
        setViewingPastContest(isPast);
    };

    // The entry this user already has in a contest, if any.
    const entryFor = (contestTitle) => (
        userPhotos.find(photo => photo.contest_title === contestTitle && photo.email === loggedInUser)
    );

    const openModal = (mode, contest, photoUrl = '') => {
        setModalMode(mode);
        setModalData({
            contest_title: contest.title,
            // Prefilled from the account but editable, so someone can enter the
            // name they want on the board - and so a phone that lost its session
            // still lets them type one instead of showing a blank locked field.
            uploaded_by: loggedInUsername || '',
            description: '',
            email: loggedInUser || '',
            photo_url: photoUrl
        });
        setFile(null);
        setFileError('');
        // Say so up front rather than after they have picked a photo and waited
        // for it to upload.
        setSubmitError(loggedInUser ? '' : 'Your session has expired. Please log in again before submitting.');
        setShowModal(true);
    };

    const handleJoinClick = (contest) => {
        // Ensure userPhotos is updated and contains the current user's photos
        const existingPhoto = entryFor(contest.title);
        if (existingPhoto) {
            alert("You have already participated in this contest.");
            return;
        }
        openModal('join', contest);
    };

    const handleReplaceClick = (contest) => {
        const existingPhoto = entryFor(contest.title);
        if (!existingPhoto) {
            alert("You haven't entered this contest yet.");
            return;
        }
        // Carry the current photo in so the modal can show what's being replaced.
        openModal('replace', contest, existingPhoto.photo_url);
    };

    const handleModalChange = (e) => {
        const { name, value } = e.target;
        setModalData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) {
            setFile(null);
            setFileError('');
            return;
        }

        const check = validateFile(selectedFile);
        if (check.ok) {
            setFile(selectedFile);
            setFileError('');
        } else {
            setFile(null);
            setFileError(check.error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        const replacing = modalMode === 'replace';

        // Replace only swaps the photo, so it has no name field to check.
        if (!replacing && !modalData.uploaded_by.trim()) {
            setSubmitError('Please enter the name to show on your submission.');
            return;
        }

        if (!modalData.email) {
            setSubmitError('Your session has expired. Please log in again, then resubmit.');
            return;
        }

        if (!file) {
            setSubmitError('Please choose a photo of your costume.');
            return;
        }

        // Convert HEIC, apply EXIF rotation and resize before upload, so the
        // stored photo displays correctly in every browser.
        let upload;
        setPreparing(true);
        try {
            upload = await prepareImage(file);
        } catch (error) {
            console.error('There was an error preparing the photo!', error);
            setFileError(error.message || 'We could not read that photo. Please try another one.');
            setPreparing(false);
            return;
        }
        setPreparing(false);

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('image', upload);
            formData.append('key', '10fc3bdb39131e1d5f242cbb5d183090'); // Replace with your imgbb API key

            const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData);
            const imgUrl = imgbbResponse.data
                && imgbbResponse.data.data
                && imgbbResponse.data.data.url;

            if (!imgUrl) {
                setSubmitError('The photo service did not accept that image. Please try another photo.');
                return;
            }

            const requestOptions = {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            };

            if (replacing) {
                // The entry already exists, so swap its photo in place.
                await axios.put(`${process.env.REACT_APP_API_URL}/api/photos/update`, {
                    contest_title: modalData.contest_title,
                    email: modalData.email,
                    photo_url: imgUrl
                }, requestOptions);

                setUserPhotos(userPhotos.map(photo => (
                    photo.contest_title === modalData.contest_title && photo.email === modalData.email
                        ? { ...photo, photo_url: imgUrl }
                        : photo
                )));
                setShowModal(false);
                alert('Your photo has been replaced.');
                return;
            }

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/photos/insert`, {
                ...modalData,
                uploaded_by: modalData.uploaded_by.trim(),
                description: modalData.description.trim(),
                photo_url: imgUrl
            }, requestOptions);

            setUserPhotos([...userPhotos, response.data]);
            setShowModal(false);
            alert('Your costume has been submitted. Good luck!');
        } catch (error) {
            console.error('There was an error submitting the photo!', error);
            setSubmitError(serverMessage(error, replacing
                ? 'We could not replace your photo. Please check your connection and try again.'
                : 'We could not submit your costume. Please check your connection and try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        setSelectedContest(null);
        setViewingPastContest(false);
        setFilter("ongoing"); // Reset filter to show ongoing contests
    };

    // Join for a first entry, Replace once this user already has a photo in.
    const renderEntryButton = (contest) => {
        if (contest.voting_open && disableJoinWhenVotingStarts) {
            return <Button variant="secondary" disabled>Submissions Closed - Voting Started</Button>;
        }

        if (!entryFor(contest.title)) {
            return <Button variant="success" onClick={() => handleJoinClick(contest)}>Join</Button>;
        }

        // Votes are recorded against a photo_url, so swapping the photo once
        // voting is open would strand the votes already cast on the old one.
        if (contest.voting_open) {
            return <Button variant="secondary" disabled>Voting Started - Photo Locked</Button>;
        }

        return <Button variant="warning" onClick={() => handleReplaceClick(contest)}>Replace Photo</Button>;
    };

    const renderContests = (contests, isPast) => (
        contests.map((contest, index) => (
            <Col xs={12} sm={6} lg={4} key={index} className="mb-4">
                <Card>
                    <Card.Body>
                        <Card.Title className="wrap-anywhere">{contest.title}</Card.Title>
                        <Card.Text className="wrap-anywhere">{contest.description}</Card.Text>
                        <Card.Text>
                            <small className="text-muted">
                                Contest: {contest.contest_status === 'active' ? 'Active' : contest.contest_status === 'ended' ? 'Ended' : 'Not Started'}
                            </small>
                        </Card.Text>
                        <Card.Text>
                            <small className="text-muted">
                                Voting: {contest.voting_open ? 'Open' : 'Closed'}
                                {contest.manual_control && <span className="ms-2 badge bg-info">Manual Control</span>}
                            </small>
                        </Card.Text>
                        {contest.manual_control ? (
                            <Card.Text>
                                <small className="text-muted">
                                    Type: Manual Control Contest
                                </small>
                            </Card.Text>
                        ) : (
                            <>
                                <Card.Text>
                                    <small className="text-muted">
                                        Start Date: {new Date(contest.start_date).toLocaleString(undefined, { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                    </small>
                                </Card.Text>
                                <Card.Text>
                                    <small className="text-muted">
                                        End Date: {new Date(contest.end_date).toLocaleString(undefined, { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                    </small>
                                </Card.Text>
                            </>
                        )}
                        <div className="action-row">
                            {isPast ? (
                                admin ? (
                                    <Button variant="info" onClick={() => handleViewClick(contest.title, true)}>View Winner</Button>
                                ) : null
                            ) : contest.manual_control ? (
                                // Manual control contests - show based on contest status
                                contest.contest_status === 'active' ? (
                                    <>
                                        <Button variant="primary" onClick={() => handleViewClick(contest.title, false)}>View</Button>
                                        {renderEntryButton(contest)}
                                    </>
                                ) : (
                                    <Button variant="secondary" disabled>Contest Not Started</Button>
                                )
                            ) : new Date(contest.start_date) > today ? (
                                // Scheduled contests - future
                                <Button variant="secondary" disabled>Wait</Button>
                            ) : (
                                // Scheduled contests - ongoing
                                <>
                                    <Button variant="primary" onClick={() => handleViewClick(contest.title, false)}>View</Button>
                                    {renderEntryButton(contest)}
                                </>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        ))
    );

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}><Spinner animation="border" role="status"><span className="sr-only"></span></Spinner></div>;

    return (
        <Container fluid className="px-0">
            {selectedContest ? (
                viewingPastContest ? (
                    <PastContestPhotos contestTitle={selectedContest} onBack={handleBack} />
                ) : (
                    <ContestPhotos contestTitle={selectedContest} onBack={handleBack} />
                )
            ) : (
                <>
                    <Row className="mb-4">
                        <Col className="d-flex justify-content-center">
                            {/* .filter-toggle stacks these full width on a phone and lays
                                them out as a normal button group from 576px up. */}
                            <ToggleButtonGroup
                                className="filter-toggle"
                                type="radio"
                                name="options"
                                value={filter}
                                onChange={setFilter}
                            >
                                <ToggleButton id="ongoing-contests" type="radio" variant="outline-primary" value="ongoing">
                                    Ongoing
                                </ToggleButton>
                                <ToggleButton id="past-contests" type="radio" variant="outline-secondary" value="past">
                                    Past
                                </ToggleButton>
                                <ToggleButton id="upcoming-contests" type="radio" variant="outline-success" value="upcoming">
                                    Upcoming
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Col>
                    </Row>
                    <Row>
                        {filter === "ongoing" && renderContests(ongoingContests, false)}
                        {filter === "past" && renderContests(pastContests, true)}
                        {filter === "upcoming" && renderContests(upcomingContests, false)}
                    </Row>
                </>
            )}

            {/* Edge-to-edge on a phone, a centred dialog from 576px up. */}
            <Modal show={showModal} onHide={() => setShowModal(false)} fullscreen="sm-down" centered>
                {/* The contest name goes in the body, not the title: a long one
                    runs into the close button up here. */}
                <Modal.Header closeButton>
                    <Modal.Title>{modalMode === 'replace' ? 'Replace your photo' : 'Submit your costume'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* .submit-form keeps every control at least a thumb tall and
                        at 16px, the size below which iOS Safari zooms the page in
                        the moment a field takes focus. */}
                    <Form onSubmit={handleSubmit} className="submit-form" noValidate>
                        <p className="text-muted wrap-anywhere mb-3">{modalData.contest_title}</p>
                        {/* /photos/update only swaps photo_url, so Replace leaves the
                            name and description off rather than offering edits it
                            would silently drop. */}
                        {modalMode !== 'replace' && (
                            <>
                                <Form.Group controlId="formUploadedBy">
                                    <Form.Label>Your name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="uploaded_by"
                                        value={modalData.uploaded_by}
                                        onChange={handleModalChange}
                                        placeholder="The name to show on your costume"
                                        autoComplete="name"
                                        autoCapitalize="words"
                                        enterKeyHint="next"
                                        maxLength={80}
                                        disabled={preparing || submitting}
                                    />
                                </Form.Group>
                                <Form.Group controlId="formDescription" className="mt-3">
                                    <Form.Label>Describe your costume</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="description"
                                        value={modalData.description}
                                        onChange={handleModalChange}
                                        placeholder="Who or what are you dressed as?"
                                        autoCapitalize="sentences"
                                        enterKeyHint="done"
                                        maxLength={500}
                                        disabled={preparing || submitting}
                                    />
                                    <Form.Text className="text-muted d-block">
                                        Optional &middot; up to 500 characters.
                                    </Form.Text>
                                </Form.Group>
                            </>
                        )}
                        {modalMode === 'replace' && modalData.photo_url && (
                            <Form.Group>
                                <Form.Label>Current Photo</Form.Label>
                                <img
                                    src={modalData.photo_url}
                                    alt="Your current entry"
                                    className="d-block w-100 photo-thumb"
                                />
                            </Form.Group>
                        )}
                        <Form.Group controlId="formPhotoFile" className="mt-3">
                            <Form.Label>{modalMode === 'replace' ? 'New costume photo' : 'Costume photo'}</Form.Label>
                            {/* image/* is what makes iOS offer both Take Photo and Photo Library;
                                the explicit extensions cover browsers that don't match HEIC to it. */}
                            <Form.Control
                                type="file"
                                accept="image/*,.heic,.heif"
                                onChange={handleFileChange}
                                disabled={preparing || submitting}
                            />
                            <Form.Text className="text-muted d-block">
                                JPG, PNG, WEBP, AVIF, HEIC or HEIF &middot; up to {MAX_UPLOAD_MB} MB.
                                Large photos are resized automatically.
                            </Form.Text>
                            {fileError && <Form.Text className="text-danger d-block">{fileError}</Form.Text>}
                        </Form.Group>
                        {submitError && (
                            <div className="alert alert-danger mt-3 mb-0" role="alert">{submitError}</div>
                        )}
                        <Button
                            variant="primary"
                            type="submit"
                            className="mt-4 w-100"
                            disabled={preparing || submitting}
                        >
                            {preparing
                                ? 'Preparing photo…'
                                : submitting
                                    ? 'Submitting…'
                                    : (modalMode === 'replace' ? 'Replace photo' : 'Submit costume')}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default ViewContests;
