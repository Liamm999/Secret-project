const express = require("express");
const SignInController = require("../api/controllers/signin.controller");

const signInController = new SignInController();

const router = express.Router();

router.get("/", signInController.index);
router.post("/signin", signInController.signIn);

module.exports = router;
