/*
	Purpose: provide service-layer database helpers through a short barrel file.
	This keeps imports stable while the real implementation stays in backend/lib.

	Useful commands:
	node --check src/services/index.js
	node -e "console.log(Object.keys(require('./src/services')))"
*/

const database = require('../../backend/lib/database');

module.exports = {
	createCollectionIfNotExists: database.createCollectionIfNotExists,
	deleteOne: database.deleteOne,
	findMany: database.findMany,
	findOne: database.findOne,
	insertOne: database.insertOne,
	updateOne: database.updateOne
};