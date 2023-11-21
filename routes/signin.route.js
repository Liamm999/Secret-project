const express = require("express");
const SignInController = require("../api/controllers/signin.controller");

const signInController = new SignInController();

const router = express.Router();

router.use("/", signInController.index);

module.exports = router;
