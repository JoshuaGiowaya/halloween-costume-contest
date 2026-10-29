# Photo Upload Fallback

## Why this exists

Every costume photo goes to an image host from the contestant's browser before
our API ever sees it. For a long time that host was imgbb, via a single
hardcoded key — which made imgbb a single point of failure for the entire
contest.

On **29 October 2026, contest morning**, imgbb's upload API went down for
maintenance. The website stayed up (so status checkers reported "imgbb.com is
up" and existing photos kept displaying), but `POST /1/upload` answered every
request with:

```json
{"status_code":400,"error":{"message":"Imgbb is currently down for maintenance.","code":100}}
```

Nobody could enter the contest, and no change to our code could fix it.

`src/utils/uploadPhoto.js` now tries each configured host in order and uses the
first one that accepts the photo. One host being down costs a contestant about a
second instead of their entry.

## Current behaviour

| Hosts configured | What happens |
|---|---|
| imgbb only (the default) | Exactly as before — one attempt, one host |
| imgbb + Cloudinary | imgbb first; if it fails for any reason, Cloudinary is tried |
| Neither | Submission fails immediately with a clear configuration error |

**Nothing breaks if you set none of this up.** With no Cloudinary variables the
app behaves exactly as it always has, so this is safe to deploy before the
account exists.

## Setting up the Cloudinary fallback

Cloudinary was chosen because it is the closest drop-in to imgbb: a single POST
from the browser, no SDK, no backend changes, free tier, and — unlike Firebase
Storage — no billing account required.

1. Create a free account at <https://cloudinary.com/users/register_free>.
2. From the dashboard, note your **Cloud name** (e.g. `yardstik`).
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
4. Set **Signing Mode** to **Unsigned**. This is what lets the browser upload
   directly, the same way it does to imgbb. Name the preset something like
   `costume-contest`.
5. Set these on the **frontend** service (Render → the client static site →
   Environment), then redeploy:

   ```
   REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
   REACT_APP_CLOUDINARY_UPLOAD_PRESET=costume-contest
   ```

CRA reads `REACT_APP_*` variables **at build time**, so a redeploy is required —
setting them without rebuilding has no effect.

### Optional

```
REACT_APP_IMGBB_KEY=...
```

Overrides the imgbb key, which is otherwise the one hardcoded as a default in
`uploadPhoto.js`.

## A note on what is unsigned

An unsigned preset means anyone who reads the built JavaScript can upload to
that preset — the same exposure the imgbb key already has, since both have to
reach the browser. For an internal costume contest that is an acceptable
trade. If it ever matters, the fix is to move uploads behind our API and sign
them server-side, which is a larger change.

Consider setting a **folder** and **max file size** on the preset to limit what
that access is worth.

## Verifying it works

With both hosts configured, the quickest check is to temporarily point
`REACT_APP_IMGBB_KEY` at a junk value and submit a photo. imgbb will reject it,
Cloudinary should take it, and the submission should succeed with a
`res.cloudinary.com` URL. Check the browser console — a fallback logs
`imgbb upload failed` before succeeding.
