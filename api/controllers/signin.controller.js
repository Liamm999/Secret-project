class signInController {
  index(req, res) {
    res.render("signin", {
      title: "Sign in page",
    });
  }
}

module.exports = signInController;
