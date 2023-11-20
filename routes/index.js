function route(app) {
  app.get("/", function (req, res) {
    res.render("index", {
      title: "Hello motherfucker",
    });
  });
}

module.exports = { route };
