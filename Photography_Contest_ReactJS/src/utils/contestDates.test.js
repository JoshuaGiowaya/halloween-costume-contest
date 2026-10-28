import { toLocalInputValue, toInstant } from './contestDates';

// These assert relationships rather than literal clock strings, so they hold in
// whatever timezone the machine running them happens to be in.
const INPUT_SHAPE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

describe('toLocalInputValue', () => {
    it('renders an instant in a shape the input will actually accept', () => {
        expect(toLocalInputValue('2025-10-31T18:00:00.000Z')).toMatch(INPUT_SHAPE);
    });

    it('shows the local wall clock, not the UTC one', () => {
        const instant = '2025-10-31T18:00:00.000Z';
        const local = new Date(instant);
        const expected = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}T${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`;

        expect(toLocalInputValue(instant)).toBe(expected);
    });

    it('accepts a Date as readily as an ISO string', () => {
        const instant = '2025-10-31T18:00:00.000Z';
        expect(toLocalInputValue(new Date(instant))).toBe(toLocalInputValue(instant));
    });

    // A manual-control contest stores null dates; the field should come up blank
    // rather than blocking the form with an unparseable value.
    it.each([[null], [undefined], ['']])('treats %p as no schedule', (empty) => {
        expect(toLocalInputValue(empty)).toBe('');
    });

    it('blanks a value it cannot parse instead of emitting garbage', () => {
        expect(toLocalInputValue('whenever')).toBe('');
    });
});

describe('toInstant', () => {
    it('reads the input as local time', () => {
        const local = '2025-10-31T13:00';
        expect(toInstant(local)).toBe(new Date(local).toISOString());
    });

    it.each([[null], [undefined], ['']])('keeps %p as null so manual contests stay unscheduled', (empty) => {
        expect(toInstant(empty)).toBeNull();
    });

    it('returns null for a value it cannot parse', () => {
        expect(toInstant('whenever')).toBeNull();
    });
});

describe('round trip', () => {
    // The regression that matters: opening the edit modal and saving without
    // touching the dates must leave the stored instant exactly as it was.
    it.each([
        ['an evening start', '2025-10-31T18:00:00.000Z'],
        ['midnight UTC', '2025-11-01T00:00:00.000Z'],
        ['a date that crosses the US DST boundary', '2025-11-02T09:00:00.000Z'],
        ['a leap day', '2024-02-29T12:30:00.000Z'],
    ])('preserves %s', (_label, instant) => {
        expect(toInstant(toLocalInputValue(instant))).toBe(instant);
    });
});
