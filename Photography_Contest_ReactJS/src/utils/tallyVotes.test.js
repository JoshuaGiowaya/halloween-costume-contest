import { tallyVotes } from './tallyVotes';

const photo = (name) => ({ _id: name, photo_url: `https://x/${name}`, uploaded_by: name });
const vote = (name) => ({ photo_url: `https://x/${name}` });

describe('tallyVotes', () => {
    it('counts the votes each entry received', () => {
        const { counts } = tallyVotes(
            [vote('ada'), vote('ada'), vote('grace')],
            [photo('ada'), photo('grace')]
        );

        expect(counts['https://x/ada']).toBe(2);
        expect(counts['https://x/grace']).toBe(1);
    });

    it('names the entry with the most votes as the winner', () => {
        const { winners, tied } = tallyVotes(
            [vote('ada'), vote('ada'), vote('grace')],
            [photo('ada'), photo('grace')]
        );

        expect(winners.map(w => w.uploaded_by)).toEqual(['ada']);
        expect(tied).toBe(false);
    });

    it('reports every entry level on top rather than picking one', () => {
        const { winners, tied } = tallyVotes(
            [vote('ada'), vote('grace')],
            [photo('ada'), photo('grace')]
        );

        expect(winners.map(w => w.uploaded_by)).toEqual(['ada', 'grace']);
        expect(tied).toBe(true);
    });

    it('ignores votes cast for something that is not an entry', () => {
        const { winners } = tallyVotes(
            [vote('deleted'), vote('deleted'), vote('ada')],
            [photo('ada')]
        );

        expect(winners.map(w => w.uploaded_by)).toEqual(['ada']);
    });

    it('has no winner when nobody voted', () => {
        const { winners, tied } = tallyVotes([], [photo('ada'), photo('grace')]);

        expect(winners).toEqual([]);
        expect(tied).toBe(false);
    });

    it('has no winner when there were no entries', () => {
        expect(tallyVotes([], []).winners).toEqual([]);
    });
});
