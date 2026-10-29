# Photo Uploads

Costume photos are uploaded from the contestant's browser straight to an image
host. Our API only ever stores the resulting URL — the photo itself never passes
through our backend.

**Cloudinary is the image host.** It replaced imgbb on 29 October 2026.

## Why we left imgbb

Every costume photo went through one hardcoded imgbb key, which made imgbb a
single point of failure for the whole contest. On contest morning its upload API
went down for maintenance. The website stayed up — so status checkers reported
"imgbb.com is up" and existing photos kept displaying — but `POST /1/upload`
answered every request with:

```json
{"status_code":400,"error":{"message":"Imgbb is currently down for maintenance.","code":100}}
```

Nobody could enter, and no change to our code could fix it.

## Required configuration

Uploads **will not work at all** without these. There is no fallback host and no
hardcoded default any more — that was deliberate, so a misconfigured deploy
fails loudly during setup instead of silently on contest morning. Contestants
see a message naming the missing variables.

Set these on the **frontend** service (Render → the client static site →
Environment):

```
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=costume-contest
```

CRA reads `REACT_APP_*` variables **at build time**, so a redeploy is required.
Setting them without rebuilding has no effect.

## Setting up Cloudinary

1. Create a free account at <https://cloudinary.com/users/register_free>.
2. From the dashboard, note your **Cloud name** (e.g. `yardstik`).
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
4. Set **Signing Mode** to **Unsigned**. This is what lets the browser upload
   directly, with no backend involvement. Name it `costume-contest`.
5. **Set a folder on the preset** — e.g. `costume-contest-2026`. Do this before
   any photos land, because it cannot be applied retroactively, and it is what
   makes "delete every photo from this year" a single API call later.
6. Consider setting a **max file size** on the preset too, for the reason in
   "A note on what is unsigned" below.
7. Put the two variables above on the Render client service and redeploy.

### Free plan limits

Cloudinary's free plan caps images at **10 MB** and **25 megapixels**. We are
comfortably inside both: `prepareImage.js` resizes every photo to 2048px on its
longest edge and re-encodes it as JPEG before upload, which lands around 1 MB
and 4.2 MP even for a 12MP phone photo.

## Photos uploaded before the switch

Entries submitted before 29 October 2026 have `i.ibb.co` URLs stored in the
database. **They still display normally** — imgbb's CDN is unaffected by this
change, and nothing migrates them. Only new uploads go to Cloudinary.

That also means deleting old photos is still a manual job in imgbb's dashboard:
the API returned a `delete_url` with each upload and our code never kept it.

## Deleting photos

There are two separate layers, and they have never been connected:

| Layer | How to clear it |
|---|---|
| Database records | `DELETE /api/photos/deleteall` with a `contest_title` |
| Hosted images (Cloudinary) | Media Library UI, or the Admin API by folder prefix / tag |

Cloudinary's Admin API needs your API **secret**, so it is a server-side or CLI
job, never something the app does. Bulk deletes are capped at 1000 assets per
call, and you need `invalidate: true` to clear CDN copies — otherwise deleted
images keep serving from cache for a while.

This is the payoff for step 5 above: with a folder set, clearing a year is one
prefix call.

## A note on what is unsigned

An unsigned preset means anyone who reads the built JavaScript can upload to
that preset — the same exposure the imgbb key always had, since both have to
reach the browser. For an internal costume contest that is an acceptable trade,
and a folder plus a max file size limits what the access is worth. If it ever
matters, the fix is to move uploads behind our API and sign them server-side,
which is a larger change.

## Adding a second host later

`src/utils/uploadPhoto.js` tries hosts in order and uses the first that accepts
the photo. Adding a spare means writing one provider object — `endpoint`,
`fields`, `urlFrom`, `reasonFrom` — and pushing it into `configuredProviders()`.
The fall-through behaviour is already there and under test.

## Verifying it works

Submit a photo and confirm the stored URL is on `res.cloudinary.com`. If it
fails, the browser console logs `Cloudinary upload failed` with the reason
Cloudinary gave — most often `Upload preset not found`, which means the preset
name is wrong or still set to **Signed**.
