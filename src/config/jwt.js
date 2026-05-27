/*
	Purpose: re-export the backend auth helpers from a src-level config path so
	middleware and scripts can use one import location.

	Useful commands:
	node --check src/config/jwt.js
	node -e "console.log(Object.keys(require('./src/config/jwt')))"
*/

const auth = require('../../backend/lib/auth');

module.exports = auth;