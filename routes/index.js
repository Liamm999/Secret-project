const signinRouter = require("./signin.route");

function route(app) {
  app.use("/", signinRouter);
}

module.exports = { route };
