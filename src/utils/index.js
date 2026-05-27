/*
	Purpose: expose the shared date and serialization helpers from a small utils
	barrel so scripts can import them from src/utils.

	Useful commands:
	node --check src/utils/index.js
	node -e "console.log(Object.keys(require('./src/utils')))"
*/

const { formatDateTime, serializeDocument } = require('../../backend/lib/database');

module.exports = {
	formatDateTime,
	serializeDocument
};