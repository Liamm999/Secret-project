"use strict";
const express = require("express");
const app = express();
const createTables = require("./dbsetup");

app.set("view engine", "ejs");

// stattic files inside public folder
app.use(express.static("public"));

// Example:
app.get("/", function (req, res) {
  res.render("index", {
    title: "Hello motherfucker",
  });
});

app.use(express.static("public"));
app.listen(8000);
