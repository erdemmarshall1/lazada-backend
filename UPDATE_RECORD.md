# Update & Fix Record — 2026-07-13

## Issues Resolved

### 1. Avatar Upload — "Failed to upload avatar"
- **Root Cause:** `frontend/src/views/user/MyAccount.vue:78` called `POST /home/user/uploadAvatar` (non-existent route)
- **Fix:** Changed to use existing `uploadFile()` which posts to `POST /home/upload/file`, then updates user profile via `POST /home/user/edit`
- **Files changed:**
  - `frontend/src/views/user/MyAccount.vue`

### 2. Admin Login — "Network Error"
- **Root Cause:** Backend at `supportive-delight-production-b90c.up.railway.app` was online but admin domain `admin.theoutnet-wholesale.pages.dev` did not resolve (timed out)
- **Verified:** Backend health check (`/health`) returns 200 OK. Admin login endpoint works directly.
- **Action needed:** Configure the `admin.theoutnet-wholesale.pages.dev` custom domain in Cloudflare Pages dashboard under the `theoutnet-wholesale` project → Custom domains → Add `admin.theoutnet-wholesale.pages.dev`

### 3. 404 Errors — "Request failed with status code 404"
- **Root Cause:** 6 frontend API endpoints had no corresponding backend routes
- **Routes added:**
  | Endpoint | Vue File | Backend File |
  |---|---|---|
  | `GET /home/admin/live-chat-settings` | `AdminLiveChatSettings.vue` | `admin.js` |
  | `PUT /home/admin/live-chat-settings` | `AdminLiveChatSettings.vue` | `admin.js` |
  | `GET /home/admin/geo-devices/summary` | `AdminGeoDevices.vue` | `admin.js` |
  | `GET /home/userKefu/admin/conversations` | `AdminLiveChatInbox.vue` | `kefu.js` + `kefuController.js` |
  | `GET /home/userKefu/admin/messages` | `AdminLiveChatInbox.vue` | `kefu.js` + `kefuController.js` |
  | `POST /home/userKefu/admin/sendReply` | `AdminLiveChatInbox.vue` | `kefu.js` + `kefuController.js` |
- **Files changed:**
  - `backend/routes/admin.js`
  - `backend/routes/kefu.js`
  - `backend/controllers/kefuController.js`

### 4. Backend Uptime — 24/7 Server & Database
- **Current state:** Self-ping keep-alive is already implemented in `server.js:115-128` using `RAILWAY_PUBLIC_DOMAIN` env var (already set on Railway)
- **Verified:** Backend uptime was ~5.5 hours at time of check
- **Cloudinary credentials** now set as Railway env vars (previously only existed in `backend/.env`)
- **MongoDB:** Connected to Railway internal MongoDB (online)

## Deployment Instructions

### Backend (Railway)
```bash
cd backend
railway service supportive-delight
railway up --ci
```

### Frontend (Cloudflare Pages)
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=theoutnet-wholesale
```

### Environment Variables (Railway)
All set:
- `CLOUDINARY_CLOUD_NAME` = u7xxu5dq
- `CLOUDINARY_API_KEY` = 726627823236327
- `CLOUDINARY_API_SECRET` = qJmfLkCQ-wvbAhx6RQcf4MCVBUE
- `MONGODB_URI` = Railway internal MongoDB
- `RAILWAY_PUBLIC_DOMAIN` = supportive-delight-production-b90c.up.railway.app
- `JWT_SECRET` = lazada_jwt_secret_key_2025

## Credentials

### Admin Login (Local dev)
- URL: http://localhost:3000/admin/login
- Username: `admin`
- Password: `admin123`

### Admin Login (Production)
- Main site: https://theoutnet-wholesale.pages.dev
- Admin: https://admin.theoutnet-wholesale.pages.dev (needs DNS config)
- API: https://supportive-delight-production-b90c.up.railway.app

### Database
- Railway MongoDB (internal) — online
- Backup available via Railway dashboard
