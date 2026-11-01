# CarePoint backend

Express + MongoDB API for the CarePoint hospital app (patients, doctors, nurses, pharmacy).

```bash
npm install
npm run seed   # resets the "carepoint" database with dummy data
npm run dev    # http://localhost:5050
```

`.env` needs `MONGODB_URI`, `DB_NAME` (default `carepoint`), `JWT_SECRET`, `PORT`, and the default admin
(`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). The admin is created on startup if missing; log in as them to
add doctors, nurses and pharmacists under **User management**.

Demo logins from the seed (password `password123`):

| Role | Email |
|---|---|
| Admin | the `ADMIN_EMAIL` from `.env` (password `ADMIN_PASSWORD`) |
| Patient | rahul@example.com (has seen Dr. Mehta before), sneha@example.com, arjun@example.com |
| Doctor | mehta@carepoint.com, rao@carepoint.com, iyer@carepoint.com (on break), khan@carepoint.com (on leave) |
| Nurse | nurse@carepoint.com |
| Pharmacy | pharmacy@carepoint.com |

The frontend (`../frontend`, `npm run dev`) proxies `/api` to this server.
