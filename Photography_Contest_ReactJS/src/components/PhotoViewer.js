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

// Corner badge telling people a thumbnail opens full-size. Place it inside the
// .card next to the thumbnail; taps fall through to the thumbnail underneath.
export const FullSizeHint = () => (
    <span className="photo-thumb-hint" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" focusable="false">
            <path
                fillRule="evenodd"
                d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707m4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707"
            />
        </svg>
    </span>
);

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
