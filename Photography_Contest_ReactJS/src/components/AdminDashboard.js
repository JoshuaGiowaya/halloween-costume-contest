import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import AdminContestPhotos from './AdminContestPhotos';
import { AdminAuthContext } from '../context/AdminAuthContext';

const AdminDashboard = () => {
    const [contests, setContests] = useState([]);
    const [newContest, setNewContest] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: ''
    });
    const [editContest, setEditContest] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contestToDelete, setContestToDelete] = useState(null);
    const [viewContest, setViewContest] = useState(null); // State for viewing contest photos
    const [manualControlMode, setManualControlMode] = useState(false);
    const [modeLoading, setModeLoading] = useState(true);

    const { admin } = useContext(AdminAuthContext); // Use admin context for authentication
    const navigate = useNavigate();

    useEffect(() => {
        if (!admin) {
            navigate('/admin-login'); // Redirect to login if not admin
        }
        
        // Check manual control mode
        const checkManualControlMode = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/contests/manual-control-mode`,
                    {
                        headers: {
                            'x-api-key': process.env.REACT_APP_API_KEY,
                        },
                    }
                );
                setManualControlMode(response.data.manualControlMode);
            } catch (error) {
                console.error('Failed to check manual control mode:', error);
                setManualControlMode(false);
            } finally {
                setModeLoading(false);
            }
        };
        
        checkManualControlMode();
        fetchContests();
    }, [admin, navigate]);

    const fetchContests = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/contests/fetch`, {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            });
            setContests(response.data);
        } catch (error) {
            console.error('Error fetching contests:', error);
        }
    };

  const handleStartContest = async (title) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/contests/${encodeURIComponent(title)}/start`, {}, {
        headers: { 'x-api-key': process.env.REACT_APP_API_KEY },
        withCredentials: true,
      });
      await fetchContests();
    } catch (error) {
      console.error('Error starting contest:', error);
      alert('Failed to start contest');
    }
  };

  const handleStopContest = async (title) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/contests/${encodeURIComponent(title)}/stop`, {}, {
        headers: { 'x-api-key': process.env.REACT_APP_API_KEY },
        withCredentials: true,
      });
      await fetchContests();
    } catch (error) {
      console.error('Error stopping contest:', error);
      alert('Failed to stop contest');
    }
  };

  const handleStartVoting = async (title) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/contests/${encodeURIComponent(title)}/voting/start`, {}, {
        headers: { 'x-api-key': process.env.REACT_APP_API_KEY },
        withCredentials: true,
      });
      await fetchContests();
    } catch (error) {
      console.error('Error starting voting:', error);
      alert('Failed to start voting');
    }
  };

  const handleStopVoting = async (title) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/contests/${encodeURIComponent(title)}/voting/stop`, {}, {
        headers: { 'x-api-key': process.env.REACT_APP_API_KEY },
        withCredentials: true,
      });
      await fetchContests();
    } catch (error) {
      console.error('Error stopping voting:', error);
      alert('Failed to stop voting');
    }
  };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewContest({ ...newContest, [name]: value });
    };

    const handleCreateContest = async (e) => {
        e.preventDefault();

        // Check if the contest with the same title already exists
        const existingContest = contests.find(contest => contest.title === newContest.title);
        if (existingContest) {
            alert(`Contest with title "${newContest.title}" already exists.`);
            return;
        }

        try {
            // Prepare contest data based on manual control mode
            const contestData = {
                title: newContest.title,
                description: newContest.description,
                ...(manualControlMode ? {
                    // Manual control mode: no scheduled dates
                    start_date: null,
                    end_date: null,
                    manual_control: true
                } : {
                    // Normal mode: use provided dates
                    start_date: newContest.start_date,
                    end_date: newContest.end_date,
                    manual_control: false
                })
            };

            await axios.post(`${process.env.REACT_APP_API_URL}/api/contests/insert`, contestData, {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            });
            setNewContest({ title: '', description: '', start_date: '', end_date: '' });
            fetchContests(); // Fetch contests again to update the list
            setShowCreateModal(false);
            alert(manualControlMode ? "Manual Contest Created - Use force controls to start/stop" : "Contest Added");
        } catch (error) {
            console.error('Error creating contest:', error);
            alert("Error creating contest. Please try again.");
        }
    };

    const handleDeleteContest = async (contest) => {
        try {
            // Delete contest
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/contests/delete`, {
                    data: { title: contest.title },
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });
            } catch (error) {
                console.error('Error deleting contest:', error);
            }

            // Delete associated votes
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/votes/delete`, {
                    data: { contest_title: contest.title },
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });
            } catch (error) {
                console.error('Error deleting votes:', error);
            }

            // Delete all photos related to the contest
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/photos/deleteall`, {
                    data: { contest_title: contest.title },
                    headers: {
                        'x-api-key': process.env.REACT_APP_API_KEY,
                    },
                    withCredentials: true,
                });
            } catch (error) {
                console.error('Error deleting photos:', error);
            }

            // Refresh contest list
            fetchContests();
            setShowDeleteModal(false);
        } catch (error) {
            console.error('General error during deletion:', error);
        }
    };

    const handleEditContest = (contest) => {
        setEditContest(contest);
        setShowEditModal(true);
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditContest({ ...editContest, [name]: value });
    };

    const handleUpdateContest = async (e) => {
        e.preventDefault();
        try {
            console.log(editContest.title,editContest.description,editContest.start_date,editContest.end_date)
            await axios.put(`${process.env.REACT_APP_API_URL}/api/contests/update`, {
                title: editContest.title,
                description: editContest.description,
                start_date: editContest.start_date,
                end_date: editContest.end_date
            }, {
                headers: {
                    'x-api-key': process.env.REACT_APP_API_KEY,
                },
                withCredentials: true,
            });
            setEditContest(null);
            fetchContests();
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating contest:', error);
        }
    };

    const handleViewContest = (contest) => {
        setViewContest(contest);
    };

    const openDeleteModal = (contest) => {
        setContestToDelete(contest);
        setShowDeleteModal(true);
    };

    // Show loading spinner while checking manual control mode
    if (modeLoading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading admin dashboard...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@100;400;700&display=swap');

                body {
                    font-family: 'Raleway', sans-serif;
                }

                .container {
                    padding-top: 20px;
                }

                .card {
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .card-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .card-text {
                    font-size: 0.9rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .btn {
                    margin-right: 0.5rem;
                }

                .btn-primary {
                    background-color: #007bff;
                    border-color: #007bff;
                }

                .btn-warning {
                    background-color: #ffc107;
                    border-color: #ffc107;
                }

                .btn-danger {
                    background-color: #dc3545;
                    border-color: #dc3545;
                }
                
                .contest-controls {
                    border-top: 1px solid #dee2e6;
                    padding-top: 10px;
                    margin-top: 10px;
                }
                
                .voting-controls {
                    margin-bottom: 8px;
                }
                
                .manual-controls {
                    border-left: 3px solid #17a2b8;
                    padding-left: 10px;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                }
            `}</style>
            <h2 className="text-center mt-4">Admin Dashboard</h2>
            
            {manualControlMode && (
                <div className="alert alert-info mb-3">
                    <strong>Manual Control Mode:</strong> You have enhanced control over contests:
                    <ul className="mb-0 mt-2">
                        <li><strong>Contest Creation:</strong> Create contests without scheduled dates (manual control only)</li>
                        <li><strong>Voting Controls:</strong> Start/Stop voting for contests</li>
                        <li><strong>Force Controls:</strong> Override scheduled dates to start/stop contests immediately</li>
                        <li><strong>Flexible Management:</strong> Manage contests regardless of their scheduled times</li>
                    </ul>
                </div>
            )}

            <h3 className="mt-4">Create Contest</h3>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Contest
            </Button>

            <h3>Manage Contests</h3>
            <div className="row">
                {contests.map(contest => (
                    <div className="col-md-4" key={contest._id}>
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="card-title">{contest.title}</h5>
                                <p className="card-text">{contest.description}</p>
                                {contest.manual_control ? (
                                    <p className="card-text"><small className="text-muted">Type: Manual Control Contest</small></p>
                                ) : (
                                    <>
                                        <p className="card-text"><small className="text-muted">Start: {new Date(contest.start_date).toLocaleString()}</small></p>
                                        <p className="card-text"><small className="text-muted">End: {new Date(contest.end_date).toLocaleString()}</small></p>
                                    </>
                                )}
                                <p className="card-text">
                                    <small className="text-muted">
                                        Contest: {contest.contest_status === 'active' ? 'Active' : contest.contest_status === 'ended' ? 'Ended' : 'Not Started'}
                                    </small>
                                </p>
                                <p className="card-text">
                                    <small className="text-muted">
                                        Voting: {contest.voting_open ? 'Open' : 'Closed'}
                                        {manualControlMode && <span className="ms-2 badge bg-info">Manual Control</span>}
                                    </small>
                                </p>
                                <Button variant="warning" onClick={() => handleEditContest(contest)}>Edit</Button>
                                <Button variant="danger" onClick={() => openDeleteModal(contest)}>Delete</Button>
                                <Button variant="info" onClick={() => handleViewContest(contest)}>View Photos</Button>
                                
                                {/* Contest Controls */}
                                <div className="contest-controls">
                                    {/* Contest Status Controls */}
                                    <div className="voting-controls">
                                        <small className="text-muted d-block mb-2">Contest Controls:</small>
                                        {contest.contest_status === 'active' ? (
                                            <Button className="me-2" variant="danger" onClick={() => handleStopContest(contest.title)}>
                                                Stop Contest
                                            </Button>
                                        ) : (
                                            <Button className="me-2" variant="success" onClick={() => handleStartContest(contest.title)}>
                                                Start Contest
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {/* Voting Controls */}
                                    <div className="voting-controls">
                                        <small className="text-muted d-block mb-2">Voting Controls:</small>
                                        {contest.voting_open ? (
                                            <Button className="me-2" variant="secondary" onClick={() => handleStopVoting(contest.title)}>
                                                Stop Voting
                                            </Button>
                                        ) : (
                                            <Button className="me-2" variant="info" onClick={() => handleStartVoting(contest.title)}>
                                                Start Voting
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Contest Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Contest</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleCreateContest}>
                        <div className="form-group">
                            <label>Title:</label>
                            <input
                                type="text"
                                className="form-control"
                                name="title"
                                value={newContest.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description:</label>
                            <textarea
                                className="form-control"
                                name="description"
                                value={newContest.description}
                                onChange={handleInputChange}
                                required
                            ></textarea>
                        </div>
                        {!manualControlMode && (
                            <>
                                <div className="form-group">
                                    <label>Start Date ({Intl.DateTimeFormat().resolvedOptions().timeZone}):</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        name="start_date"
                                        value={newContest.start_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date ({Intl.DateTimeFormat().resolvedOptions().timeZone}):</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        name="end_date"
                                        value={newContest.end_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </>
                        )}
                        
                        {manualControlMode && (
                            <div className="alert alert-warning">
                                <strong>Manual Control Mode:</strong> Contests will be created without scheduled dates. 
                                You can start and stop them manually using the force controls.
                            </div>
                        )}
                        <Button variant="primary" type="submit">
                            Create Contest
                        </Button>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Edit Contest Modal */}
            {editContest && (
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Contest</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form onSubmit={handleUpdateContest}>
                            <div className="form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="title"
                                    value={editContest.title}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    className="form-control"
                                    name="description"
                                    value={editContest.description}
                                    onChange={handleEditInputChange}
                                    required
                                ></textarea>
                            </div>
                            {!editContest.manual_control && (
                                <>
                                    <div className="form-group">
                                        <label>Start Date ({Intl.DateTimeFormat().resolvedOptions().timeZone}):</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            name="start_date"
                                            value={editContest.start_date}
                                            onChange={handleEditInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date ({Intl.DateTimeFormat().resolvedOptions().timeZone}):</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            name="end_date"
                                            value={editContest.end_date}
                                            onChange={handleEditInputChange}
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            
                            {editContest.manual_control && (
                                <div className="alert alert-info">
                                    <strong>Manual Control Contest:</strong> This contest is controlled manually. 
                                    Use the force controls to start and stop it.
                                </div>
                            )}
                            <Button variant="primary" type="submit">
                                Update Contest
                            </Button>
                        </form>
                    </Modal.Body>
                </Modal>
            )}

            {/* Delete Contest Modal */}
            {contestToDelete && (
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Contest</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>Are you sure you want to delete the contest "{contestToDelete.title}"?</p>
                        <Button variant="danger" onClick={() => handleDeleteContest(contestToDelete)}>
                            Delete
                        </Button>
                    </Modal.Body>
                </Modal>
            )}

            {/* View Contest Photos */}
            {viewContest && (
                <AdminContestPhotos
                    contest={viewContest}
                    show={!!viewContest}
                    onHide={() => setViewContest(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
