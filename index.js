"use strict";
const express = require("express");
const app = express();
const mysql = require("mysql2");

// var con = mysql.createConnection({
//   host: "localhost",
//   user: "wpr",
//   password: "fit2023",
//   database: "wpr2023",
// });

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
