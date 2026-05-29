/*
  Purpose: start the Twinsure backend from the src entrypoint while reusing the
  single authoritative runtime in backend/server.js.

  Useful commands:
  node src/server.js
  node --check src/server.js
*/

const { app, connectAndSeed, config } = require('../backend/server');

if (require.main === module) {
  connectAndSeed()
    .then(() => {
      const port = process.env.PORT || Number(config.backendPort) || 8000;
      const host = config.host || '0.0.0.0';
      app.listen(port, host, () => {
        console.log(`Twinsure Node server running at http://${host}:${port}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start Twinsure server:', error);
      process.exit(1);
    });
}

module.exports = { app, connectAndSeed, config };