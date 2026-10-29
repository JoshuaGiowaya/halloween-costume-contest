// Counts the votes in a contest and works out who won.
//
// Two things the old inline version got wrong. It picked the winner with
// `Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)`, which
// on a tie silently returns whichever url Mongo happened to return last - a
// real possibility in a contest this size, and nothing on the page said a tie
// had happened. And it then looked the winning url up among the photos, so a
// vote pointing at anything that isn't an entry any more won the count and
// matched no photo, which rendered no winner at all.

// votes: [{ photo_url }], photos: [{ photo_url, uploaded_by }]
// -> { counts, winners, tied }
export const tallyVotes = (votes, photos) => {
    const counts = votes.reduce((acc, vote) => {
        acc[vote.photo_url] = (acc[vote.photo_url] || 0) + 1;
        return acc;
    }, {});

    // Only an entry that is still in the contest can win it.
    const scored = photos.map(photo => counts[photo.photo_url] || 0);
    const top = scored.length ? Math.max(...scored) : 0;

    const winners = top > 0
        ? photos.filter(photo => (counts[photo.photo_url] || 0) === top)
        : [];

    return { counts, winners, tied: winners.length > 1 };
};

export default tallyVotes;
