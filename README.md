# Node-Mongo Demo

A fully modernized Node.js + MongoDB demo application showcasing:

- **REST API** with Express 5, session auth via Passport.js
- **MongoDB geospatial queries** — `$near` and `$geoWithin` via a 2dsphere index
- **Leaflet.js** maps with drawing tools (no API key required)
- **Docker Compose** for one-command startup
- **Zero-build frontend** — Bootstrap 5 + vanilla ES modules

Originally created in 2014 as a server-rendered Express 3 app; fully rewritten in 2026.

---

## Quick start (Docker / Podman — recommended)

Both `docker compose` and `podman compose` work with the same commands, check
the [Podman Cheat Sheet](https://github.com/rodrigopolo/cheatsheets/blob/master/podman.md).

```bash
git clone https://github.com/rodrigopolo/node-mongo-demo.git
cd node-mongo-demo
cp .env.example .env        # edit if you want custom credentials
```

### Start (detached)

```bash
podman compose up -d --build
```

Open `http://localhost:3000` and sign in with the default admin account
defined in `.env` (`admin@example.com` / `changeme` by default).

### View logs

```bash
podman compose logs -f
```

### Restart

```bash
podman compose restart
```

### Stop

```bash
podman compose down
```

To also delete the MongoDB data and image volumes:

```bash
podman compose down -v
```

---

## Quick start (local)

Requirements: **Node.js 20+** and a running **MongoDB 6+** instance.

```bash
git clone https://github.com/rodrigopolo/node-mongo-demo.git
cd node-mongo-demo
npm install
cp .env.example .env        # set MONGODB_URI if MongoDB is not on localhost
npm run dev                 # starts with nodemon for hot-reload
```

---

## Configuration

All settings live in `.env` (created from `.env.example`):

| Variable                  | Default                          | Description                            |
| ------------------------- | -------------------------------- | -------------------------------------- |
| `PORT`                    | `3000`                           | HTTP port                              |
| `MONGODB_URI`             | `mongodb://localhost:27017/demo` | MongoDB connection string              |
| `SESSION_SECRET`          | —                                | Long random string for session signing |
| `DEFAULT_ADMIN_EMAIL`     | `admin@example.com`              | First-run admin account                |
| `DEFAULT_ADMIN_PASSWORD`  | `changeme`                       | First-run admin password               |
| `SMTP_HOST`               | —                                | SMTP server for password-reset emails  |
| `SMTP_PORT`               | `587`                            | SMTP port                              |
| `SMTP_USER` / `SMTP_PASS` | —                                | SMTP credentials                       |

When `SMTP_HOST` is not set, password reset URLs are printed to the console instead of being emailed — useful for local development.

---

## API reference

### Auth — `/api/auth`

| Method | Path                     | Auth | Description                                        |
| ------ | ------------------------ | ---- | -------------------------------------------------- |
| `GET`  | `/api/auth/me`           | ✓    | Returns current user                               |
| `POST` | `/api/auth/signin`       | —    | `{ email, password }` → user JSON + session cookie |
| `POST` | `/api/auth/signout`      | ✓    | Clears session                                     |
| `POST` | `/api/auth/reset`        | —    | `{ email }` → sends reset link                     |
| `GET`  | `/api/auth/reset/:token` | —    | Validates reset token                              |
| `POST` | `/api/auth/reset/:token` | —    | `{ password }` → updates password                  |

### Users — `/api/users`

| Method   | Path             | Min role     | Description                       |
| -------- | ---------------- | ------------ | --------------------------------- |
| `GET`    | `/api/users`     | Author       | List with `?search=` and `?page=` |
| `GET`    | `/api/users/:id` | Contributor  | Get one                           |
| `POST`   | `/api/users`     | Author       | Create                            |
| `PUT`    | `/api/users/:id` | Contributor* | Update                            |
| `DELETE` | `/api/users/:id` | Author       | Delete                            |

_*Users can edit their own account; Admins can edit anyone._

### Places — `/api/places`

| Method   | Path                 | Auth | Description                                                                                                      |
| -------- | -------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/places`        | ✓    | List with `?search=` and `?page=`                                                                                |
| `GET`    | `/api/places/:id`    | ✓    | Get one                                                                                                          |
| `POST`   | `/api/places`        | ✓    | Create — `multipart/form-data` with `name`, `description`, `type`, `coordinates` (JSON string), optional `image` |
| `PUT`    | `/api/places/:id`    | ✓    | Update — same fields as create, all optional                                                                     |
| `DELETE` | `/api/places/:id`    | ✓    | Delete                                                                                                           |
| `GET`    | `/api/places/near`   | ✓    | `?lat=&lng=&maxDistance=` (meters) — `$near` query                                                               |
| `POST`   | `/api/places/within` | ✓    | `{ coordinates: [[[lng,lat],...]] }` — `$geoWithin` polygon query                                                |

---

## Geospatial demo

Places store a GeoJSON `location` field (Point or Polygon) backed by a
MongoDB **2dsphere** index. The `near` and `within` endpoints expose this
directly:

```bash
# Find places within 10 km of Guatemala City
curl -s "http://localhost:3000/api/places/near?lat=14.6349&lng=-90.5069&maxDistance=10000" \
  -H "Cookie: connect.sid=<your-session>"

# Find places inside a bounding polygon
curl -s -X POST "http://localhost:3000/api/places/within" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=<your-session>" \
  -d '{"coordinates":[[[-91,15],[-90,15],[-90,14],[-91,14],[-91,15]]]}'
```

The **Places → Geo Search** page in the UI demonstrates both queries with an
interactive Leaflet map — no API key required.

---

## User roles

| Role        | Value | Can do                                         |
| ----------- | ----- | ---------------------------------------------- |
| Admin       | 1     | Everything                                     |
| Author      | 2     | Manage contributors; create/edit/delete places |
| Contributor | 3     | Create/edit/delete places                      |

---

## Project structure

```
├── app.js               — Express 5 entry point
├── lib/
│   ├── db.js            — Mongoose 8 connection
│   ├── auth.js          — Passport.js local strategy
│   └── models/
│       ├── User.js      — User schema + bcrypt hooks
│       └── Place.js     — Place schema + 2dsphere index
├── middleware/
│   └── auth.js          — ensureAuthenticated / requireRole
├── routes/
│   ├── auth.js          — Auth endpoints
│   ├── users.js         — User CRUD
│   └── places.js        — Place CRUD + geo queries
└── public/              — Static frontend (no build step)
    ├── index.html
    ├── signin.html
    ├── reset.html
    ├── users.html
    ├── places.html
    └── js/
        ├── api.js       — fetch wrapper + nav helpers
        ├── users.js     — Users page (ES module)
        └── places.js    — Places page with Leaflet (ES module)
```

---

## License

MIT — Copyright © Rodrigo Polo <http://RodrigoPolo.com>
