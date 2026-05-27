/*
	Purpose: expose the resolved backend configuration values through a small
	src/config entrypoint for scripts and tooling.

	Useful commands:
	node --check src/config/env.js
	node -e "console.log(require('./src/config/env'))"
*/

const { config } = require('../../backend/lib/database');

module.exports = config;