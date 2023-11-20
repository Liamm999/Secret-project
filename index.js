/*
=================================================================================================================================

                                    LIRBRARY DECLARATIONS

=================================================================================================================================
*/

"use strict";

const express = require("express");
const app = express();
require("./dbsetup");
const { createMySQLConnection } = require('./dbconn');

app.set("view engine", "ejs");

// stattic files inside public folder
app.use(express.static("public"));

/*
=================================================================================================================================

                                    SHARED FUNCTIONS

=================================================================================================================================
*/

const getUserIdFromReq = (req) => {
  var userId = req.headers['user-id']
  if (userId === undefined) userId = 1
  return userId
}

/*
=================================================================================================================================

                                    INDEX PAGE

=================================================================================================================================
*/

app.get("/", function (req, res) {
  res.render("index", {
    title: "Buddha bless this project",
  });
});

/*
=================================================================================================================================

                                    OUTBOX PAGE

=================================================================================================================================
*/

app.get("/outbox", async (req, res) => {
  const userId = getUserIdFromReq(req)
  if (userId === undefined)
    res.render("err", { errMsg: 'Require user id' })

  var limit = req.query.limit 
  if (limit === undefined) limit = 10

  var offset = req.query.offset
  if (offset === undefined) offset = 0

  const sql = 
    'SELECT  \
    wpr2023.email.id, \
    wpr2023.email.sender_id, \
    wpr2023.email.recipient_id, \
    wpr2023.email.subject, \
    wpr2023.email.body, \
    wpr2023.email.attachment_path, \
    wpr2023.email.sent_at, \
    wpr2023.user.username as "recipient_username" \
    FROM wpr2023.email \
    \
    LEFT JOIN wpr2023.user ON  \
    wpr2023.email.recipient_id=wpr2023.user.id \
    \
    WHERE sender_id= ' + userId + ' \
    \
    LIMIT ' + limit + ' \
    OFFSET ' + offset + ';'

  const conn = await createMySQLConnection()
  const [rows] = await conn.query(sql)

  res.render("outbox", {
    sentEmailList: rows,
    limit,
    offset
  })
})

/*
=================================================================================================================================

                                    EMAIL DETAIL PAGE

=================================================================================================================================
*/

app.get("/email-detail", async (req, res) => {
  const userId = getUserIdFromReq(req)
  if (userId === undefined)
    res.render("err", { errMsg: 'Require user id' })

  var emailId = req.query.emailId 

  if (emailId === undefined) {
    res.render("err", { errMsg: 'Require email id' })
    return
  }

  const sql = 
    'SELECT * FROM wpr2023.email \
    WHERE id=' + emailId + ' \
    AND (sender_id=' + userId + ' OR recipient_id=' + userId + ');'

  const conn = await createMySQLConnection()
  const [rows] = await conn.query(sql)
  if (rows.length === 0) {
    res.render("err", { errMsg: 'Email not exist' })
    return
  }

  res.render("emaildetail", { email: rows[0] })
})

/*
=================================================================================================================================

                                    START SERVER

=================================================================================================================================
*/

app.use(express.static("public"));
app.listen(8000);
