/*
	Purpose: expose the Express app instance from the backend runtime so other
	modules, tests, or tools can import it without starting a second server.

	Useful commands:
	node --check src/app.js
	node -e "const app = require('./src/app'); console.log(typeof app.use)"
*/

const { app } = require('../backend/server');

module.exports = app;