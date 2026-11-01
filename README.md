# CarePoint backend

Express + MongoDB API for the CarePoint hospital app (patients, doctors, nurses, pharmacy, admin).

```bash
npm install
npm run dev    # http://localhost:5050
```

`.env` needs `MONGODB_URI`, `DB_NAME` (default `carepoint`), `JWT_SECRET`, `PORT`, and the default admin
(`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).

There is no dummy data. On startup the server creates the default admin from `.env` if it doesn't exist.
Log in as that admin and add doctors, nurses and pharmacists from the sidebar. Patients sign up themselves,
or a nurse/admin registers them at the front desk (their first password is their mobile number).

`npm run seed:doctors` adds 15 dummy doctors, one for each department the chatbot routes to (password
`password123`). It only adds them: existing data is kept, and doctors already present are skipped.

The frontend (`../frontend`, `npm run dev`) proxies `/api` to this server.
