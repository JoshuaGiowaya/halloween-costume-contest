// Contest dates are stored as absolute instants but edited through
// <input type="datetime-local">, which only accepts a bare local-time string
// ("2025-10-31T13:00"). An input handed a full ISO instant reports its value as
// "", so the field renders blank and `required` blocks the form.
//
// Converting on both ends is what keeps a save honest: the browser parses a
// bare datetime-local string as local time, so sending one straight to a server
// running UTC would re-read it as UTC and shift the contest by the admin's
// offset on every save.

const pad = (n) => String(n).padStart(2, '0');

// Instant (ISO string or Date) -> "YYYY-MM-DDTHH:mm" in the browser's timezone.
// Manual-control contests have no schedule and store null, which maps to the
// empty string the input uses for "nothing selected".
export const toLocalInputValue = (instant) => {
    if (instant === null || instant === undefined || instant === '') return '';

    const date = new Date(instant);
    if (Number.isNaN(date.getTime())) return '';

    return [
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    ].join('T');
};

// "YYYY-MM-DDTHH:mm" (local wall clock) -> ISO instant for storage. Blank stays
// null so a manual-control contest keeps its "no schedule" state.
export const toInstant = (inputValue) => {
    if (inputValue === null || inputValue === undefined || inputValue === '') return null;

    const date = new Date(inputValue);
    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
};
