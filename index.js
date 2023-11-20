"use strict";
const express = require("express");
const { route } = require("./routes");
const app = express();

app.set("view engine", "ejs");

// stattic files inside public folder
app.use(express.static("public"));

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json());

route(app);
app.listen(8000);
