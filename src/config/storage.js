/*
	Purpose: centralize the public upload and storage paths used by the Node
	runtime and any local scripts.

	Useful commands:
	node --check src/config/storage.js
	node -e "console.log(require('./src/config/storage'))"
*/

const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const publicDir = path.join(rootDir, 'public');

module.exports = {
	rootDir,
	publicDir,
	uploadsDir: path.join(publicDir, 'uploads'),
	claimsUploadDir: path.join(publicDir, 'uploads', 'claims'),
	partnersUploadDir: path.join(publicDir, 'uploads', 'partners')
};