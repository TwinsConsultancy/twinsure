/*
	Purpose: expose the backend auth middleware from a src-level path for routes
	and tests that expect middleware under src/middlewares.

	Useful commands:
	node --check src/middlewares/auth.js
	node -e "console.log(Object.keys(require('./src/middlewares/auth')))"
*/

const auth = require('../../backend/lib/auth');

module.exports = auth;