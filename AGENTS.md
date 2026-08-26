# AGENTS.md

## Project Structure

Monorepo with two independent packages — no shared tooling or workspace config.

```
client/   → React SPA (Create React App)
server/   → Express API + Socket.IO
```

## Running

```bash
# Server (from server/)
npm run dev      # nodemon, hot-reload
npm start        # production

# Client (from client/)
npm start        # CRA dev server on :3000
npm test         # Jest watch mode
```

No top-level scripts. Each package must be run independently.

## Environment Variables

Server requires a `.env` file (not committed) with:
- `PORT` — server port
- `MONGODB_URI` — MongoDB connection string
- `CLIENT_URL` — allowed CORS origin (e.g. `http://localhost:3000`)
- `JWT_SECRET` — signing key for JWTs

Client uses CRA defaults; proxy to server is not configured — CORS handles it.

## Key Conventions

- **Server uses ES modules** (`"type": "module"` in server/package.json). Use `import`/`export`, not `require`.
- **Client uses JSX** via CRA (CommonJS-style `module.exports` in config files like tailwind.config.js).
- **Thai UI text** — error messages, labels, and validation strings are in Thai. Match this convention when adding user-facing text.
- **Password validation is duplicated** — `utils/passwordValidation.js` exists in both `client/src/utils/` and `server/utils/` with identical logic. Keep them in sync if modifying rules.
- **Icons use lucide-react** — All icons come from `lucide-react`. Import named icons (e.g. `<Home className="h-4 w-4" />`). The custom SVG icon file (`components/Dashboard/Icons.jsx`) was removed.

## Architecture Notes

- Auth flow: `/api/auth/register` and `/api/auth/login` — JWT returned on success, 7-day expiry.
- Socket.IO is initialized in `server/index.js` and attached to `req.io` via middleware. Events: `join-stream`, `disconnect`.
- User model (`server/Models/User.js`) is the central schema — includes profile, social links, payment config (PromptPay/bank/TrueMoney), and donation page settings.
- Routes are minimal: only `auth.js` exists in `server/routes/`.

## Testing

- Client: CRA's Jest setup (`npm test` in `client/`). No custom test config.
- Server: no test framework configured.
- No CI pipeline or lint commands beyond CRA defaults.
