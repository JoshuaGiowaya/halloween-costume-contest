import axios from 'axios';

// ViewContest installs request/response interceptors on the default axios
// instance that throw a full-screen spinner over the page for the length of
// every call. A poll running on a timer would make that spinner flash every
// few seconds, so background refreshes go through their own instance -
// interceptors registered on the default export don't apply to one made with
// axios.create().
const backgroundClient = axios.create();

// Every call needs the same two things, and forgetting the api key fails with
// a 401 that looks like a logged-out session.
export const backgroundConfig = {
    headers: { 'x-api-key': process.env.REACT_APP_API_KEY },
    withCredentials: true,
};

// How often a page that is open during the contest re-reads whether voting is
// open. Short enough that "voting is open now, refresh your page" stops being
// something the admin has to announce.
export const POLL_INTERVAL_MS = 10000;

export default backgroundClient;
