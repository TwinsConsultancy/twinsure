/*
	Purpose: provide a stable src-level database import that forwards to the
	backend MongoDB helper module.

	Useful commands:
	node --check src/config/db.js
	node -e "console.log(Object.keys(require('./src/config/db')))"
*/

const database = require('../../backend/lib/database');

module.exports = database;