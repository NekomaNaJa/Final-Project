# AGENTS.md

## Project Structure

Monorepo with two independent packages — no shared tooling or workspace config.

```
client/   → React SPA (Create React App)
server/   → Express 5 API + Socket.IO
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
- `PORT` — server port (default: 5000)
- `MONGODB_URI` — MongoDB connection string
- `CLIENT_URL` — allowed CORS origin (e.g. `http://localhost:3000`)
- `JWT_SECRET` — signing key for JWTs

Client uses CRA defaults; API base URL is hardcoded as `http://localhost:5000` in `Login.jsx` and `Register.jsx`. CORS handles cross-origin — no proxy configured.

## Key Conventions

- **Server uses ES modules** (`"type": "module"` in server/package.json). Use `import`/`export`, not `require`.
- **Server uses Express 5** (`^5.2.1`), not Express 4. Note Express 5 breaking changes (e.g. promise-returning route handlers, no `app.del()`).
- **Client uses JSX** via CRA (CommonJS-style `module.exports` in config files like tailwind.config.js).
- **Thai UI text** — error messages, labels, and validation strings are in Thai. Match this convention when adding user-facing text.
- **Password validation is duplicated** — `utils/passwordValidation.js` exists in both `client/src/utils/` and `server/utils/` with identical logic. Keep them in sync if modifying rules.
- **Icons use lucide-react** — All icons come from `lucide-react`. Import named icons (e.g. `<Home className="h-4 w-4" />`). The custom SVG icon file (`components/Dashboard/Icons.jsx`) was removed. Brand/social icons (Instagram, Twitch, Facebook, YouTube, TikTok, X, Google) use inline SVGs.
- **Client has a typo'd directory** — `Histor/` (not `History/`) contains `DonationHistoryTable.jsx`.

## Architecture Notes

### Server

- Auth flow: `/api/auth/register` and `/api/auth/login` — JWT returned on success, 7-day expiry. No `/api/auth/me` or token-verification route exists yet.
- Socket.IO is initialized in `server/index.js` and attached to `req.io` via middleware. Events: `join-stream`, `disconnect`.
- User model (`server/Models/User.js`) is the central schema — includes profile, social links, payment config (PromptPay/bank/TrueMoney), and donation page settings.
- Routes are minimal: only `auth.js` exists in `server/routes/`, mounted at `/api/auth`.
- Database connection: `server/config/db.js` handles Mongoose connection. Note: `connectDB()` is not awaited — server starts listening before DB connection is confirmed.
- No `middleware/` directory — no reusable auth middleware exists. Auth is not enforced on any route.
- No test framework or lint scripts configured.

### Client

- **Routing** (`client/src/App.js`): `/` → MainPage, `/login`, `/register`, `/dashboard`, `/donate-page`, `/history` (and a duplicate `/Histor` alias).
- **Pages** (6): MainPage (landing), Login, Register, Dashboard (stats/charts with placeholder data), DonatePage (donation settings), HistoryPage (donation history with empty data, has TODO: replace with real data from `GET /api/donations/history`).
- **Components**:
  - `Auth/` — AuthLayout, InputField, PasswordChecklist, SocialAuthButtons
  - `Dashboard/` — StatsCard, DonationChart (recharts), TopDonors, RealtimeFeed, PaymentChannels, CardWrapper
  - `DonatePage/` — DonatePageLink, DecorateSection, MessageFilterSection, SocialMediaSection, ImageUploadBox, SettingsCard, RichTextField
  - `Histor/` — DonationHistoryTable (note the typo'd directory name)
  - `MainPage/` — Navbar, Hero, Features, StreamerList, CTASection, Footer
  - Shared: Sidebar.jsx, Topbar.jsx
- **Styling**: Tailwind CSS with custom theme in `tailwind.config.js` — custom colors (`void`, `abyss`, `mana`, `gold`, `crimson`, `border`, `muted`), fonts (`Kanit` for sans, `Nanum Myeongjo` for serif).
- **Key dependencies**: `react-router-dom` (routing), `recharts` (charts), `lucide-react` (icons), `@testing-library/*` (testing).
- **Assets** (`client/src/assets/`): PrimaryLogo.png, HeroLogo.png, hero.png, bg-login.png.
- Client JWT decoding uses `atob` with base64url-safe handling (`.replace(/-/g,"+").replace(/_/g,"/")`).

## Testing

- Client: CRA's Jest setup (`npm test` in `client/`). Includes `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`. No custom test config. Default `App.test.js` is stale (checks for "learn react" text that no longer exists).
- Server: no test framework configured.
- No CI pipeline or lint commands beyond CRA defaults.
