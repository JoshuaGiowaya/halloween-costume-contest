import React, { useRef } from 'react';
import { Modal } from 'react-bootstrap';

// Props that make a cropped thumbnail open the viewer on click, Enter or Space.
export const opensViewer = (open) => ({
    role: 'button',
    tabIndex: 0,
    onClick: open,
    onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
        }
    },
});

// Shows one photo uncropped so the whole costume is visible. Thumbnails crop to
// 4:3, which cuts the head or feet off most full-body shots.
const PhotoViewer = ({ photo, onHide }) => {
    // Keep showing the last photo while the modal fades out after `photo` goes null.
    const lastPhoto = useRef(photo);
    if (photo) lastPhoto.current = photo;
    const current = photo || lastPhoto.current;

    return (
        <Modal
            show={Boolean(photo)}
            onHide={onHide}
            size="xl"
            fullscreen="md-down"
            centered
            className="photo-viewer"
            backdropClassName="photo-viewer-backdrop"
        >
            {current && (
                <>
                    <Modal.Header closeButton closeVariant="white">
                        <Modal.Title className="wrap-anywhere fs-5">{current.uploaded_by}</Modal.Title>
                    </Modal.Header>
                    {/* Tapping the dark space around the photo closes it, like the backdrop. */}
                    <Modal.Body data-testid="photo-viewer-body" onClick={(e) => e.target === e.currentTarget && onHide()}>
                        <img
                            src={current.photo_url}
                            alt={`Costume submitted by ${current.uploaded_by}`}
                            className="photo-viewer-img"
                        />
                        {current.description && (
                            <p className="wrap-anywhere mt-3 mb-0">{current.description}</p>
                        )}
                    </Modal.Body>
                </>
            )}
        </Modal>
    );
};

export default PhotoViewer;
