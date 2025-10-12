const { createServer } = require('../dist/server');

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = await createServer();
    await app.ready();
  }

  // Handle the request
  app.server.emit('request', req, res);
};