const { build } = require('../dist/server');

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = await build({
      logger: {
        level: 'info',
        prettyPrint: false
      }
    });
    await app.ready();
  }

  // Handle the request
  app.server.emit('request', req, res);
};