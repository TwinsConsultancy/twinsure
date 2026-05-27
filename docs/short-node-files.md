Short Node wrapper files (what they are and quick CLI checks)

Purpose
- Many `src/` files are small wrappers that re-export the real implementation located under `backend/lib` or `backend/server.js`.
- This pattern keeps `src/` as a clean public API for other tools and a single entry for tests or Docker setups.

Common files and their intent
- `src/app.js`: exports the Express `app` so `src/server.js` or other tools can import the running app.
- `src/config/db.js`: re-exports the database helper (`backend/lib/database`) for easy imports as `require('src/config/db')`.
- `src/config/env.js`: exposes environment configuration from the central `backend/lib/database` config.
- `src/config/jwt.js`: exposes the auth helpers used by middleware.
- `src/middlewares/auth.js`: re-exports the backend auth module so middleware can be required from `src/middlewares`.
- `src/services/index.js`, `src/utils/index.js`, `src/constants/index.js`: small barrel files that aggregate exports for convenience.

Quick command-line checks

- Syntax check a file (detects parse errors):

```bash
node --check src/app.js
node --check src/config/db.js
```

- Inspect what a wrapper exports (run in project root):

```bash
node -e "console.log(require('./src/config/db.js'))"
node -e "console.log(require('./src/app.js'))"
```

- Start the server locally (uses root `.env` or environment variables):

```bash
# from project root
node src/server.js
# or, via backend entry
node backend/server.js
```

Notes
- These wrappers are intentionally thin. If you need to add behavior (logging, test hooks), modify the wrapper to include the extra logic, or update the underlying implementation in `backend/lib`.
- Removing them is safe only if all importers are updated to require the original module paths directly.
