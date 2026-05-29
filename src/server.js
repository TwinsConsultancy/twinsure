/*
  Purpose: start the Twinsure backend from the src entrypoint while reusing the
  single authoritative runtime in backend/server.js.

  Useful commands:
  node src/server.js
  node --check src/server.js
*/

const { app, connectAndSeed, config } = require('../backend/server');

connectAndSeed()
  .then(() => {
    const port = process.env.PORT || Number(config.backendPort) || 8000;
    app.listen(port, () => {
      console.log(`Twinsure Node server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start Twinsure server:', error);
    process.exit(1);
  });

module.exports = { app, connectAndSeed, config };