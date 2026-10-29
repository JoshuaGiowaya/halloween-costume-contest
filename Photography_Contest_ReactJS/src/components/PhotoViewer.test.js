import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PhotoViewer, { opensViewer, FullSizeHint } from './PhotoViewer';

const photo = {
    photo_url: 'https://example.test/api/photos/image/abc',
    uploaded_by: 'Morticia',
    description: 'Full-length gown, floor to ceiling',
};

describe('PhotoViewer', () => {
    it('renders nothing when no photo is selected', () => {
        render(<PhotoViewer photo={null} onHide={() => {}} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows the full photo with who uploaded it and their description', () => {
        render(<PhotoViewer photo={photo} onHide={() => {}} />);
        const img = screen.getByAltText('Costume submitted by Morticia');
        expect(img).toHaveAttribute('src', photo.photo_url);
        expect(img).toHaveClass('photo-viewer-img');
        expect(img).not.toHaveClass('photo-thumb');
        expect(screen.getByText('Morticia')).toBeInTheDocument();
        expect(screen.getByText(photo.description)).toBeInTheDocument();
    });

    it('closes from the close button', () => {
        const onHide = jest.fn();
        render(<PhotoViewer photo={photo} onHide={onHide} />);
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onHide).toHaveBeenCalled();
    });

    it('closes when the space around the photo is tapped, but not the photo itself', () => {
        const onHide = jest.fn();
        render(<PhotoViewer photo={photo} onHide={onHide} />);
        fireEvent.click(screen.getByAltText('Costume submitted by Morticia'));
        expect(onHide).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId('photo-viewer-body'));
        expect(onHide).toHaveBeenCalledTimes(1);
    });
});

describe('opensViewer', () => {
    it('opens on click, Enter and Space, but not other keys', () => {
        const open = jest.fn();
        render(<img alt="thumb" {...opensViewer(open)} />);
        const thumb = screen.getByRole('button', { name: 'thumb' });

        fireEvent.click(thumb);
        fireEvent.keyDown(thumb, { key: 'Enter' });
        fireEvent.keyDown(thumb, { key: ' ' });
        fireEvent.keyDown(thumb, { key: 'a' });

        expect(open).toHaveBeenCalledTimes(3);
    });
});

describe('FullSizeHint', () => {
    it('is decoration only, so screen readers still hear the thumbnail itself', () => {
        render(
            <div>
                <img alt="thumb" {...opensViewer(() => {})} />
                <FullSizeHint />
            </div>
        );
        expect(screen.getByRole('button', { name: 'thumb' })).toBeInTheDocument();
        expect(screen.queryAllByRole('img')).toHaveLength(0);
    });
});
