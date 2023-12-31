/*
=================================================================================================================================

                                    LIRBRARY DECLARATIONS

=================================================================================================================================
*/

"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage: storage });
const app = express();
const { createMySQLConnection } = require("./dbconn");

app.set("view engine", "ejs");

// stattic files inside public folder
app.use('*/uploads',express.static('uploads'));

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(cookieParser());

/*
=================================================================================================================================

                                    SHARED FUNCTIONS

=================================================================================================================================
*/

const getUserIdFromReq = (req) => {
  const userId = req.cookies.userId;
  return userId;
};

const getUsernameFromReq = (req) => {
  const username = req.cookies.username;
  return username;
};

const formatDate = (date) => {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const formattedDate = formatter.format(date);

  const [datePart, timePart] = formattedDate.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");

  return `${month}/${day}/${year} - ${hour}:${minute}`;
};

/*
=================================================================================================================================

                                    SINGIN PAGE

=================================================================================================================================
*/

app.get("/", (req, res) => {
  const userId = getUserIdFromReq(req);

  if (userId) {
    return res.redirect("/inbox");
  } else {
    res.render("signin", {
      title: "Sign in page",
    });
  }
});

// Sign in API endpoint
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM wpr2023.user WHERE email = ? AND password = ?`;

  const conn = await createMySQLConnection();

  try {
    const [results] = await conn.execute(sql, [email, password]);

    if (results.length > 0) {
      const user = results[0];
      res.cookie("userId", user.id, {
        httpOnly: true,
      });
      res.cookie("username", user.username, {
        httpOnly: true,
      });
      return res.status(200).json(user);
    } else {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.end();
  }
});

/*
=================================================================================================================================

                                    SignUp PAGE

=================================================================================================================================
*/

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Sign up to use our service",
  });
});

// Sign up API endpoint
app.post("/signup", async (req, res) => {
  const { fullname, email, password } = req.body;

  const searchEmailSql = `SELECT * FROM wpr2023.user WHERE email = ?`;
  const signupSql = `
    INSERT INTO wpr2023.user (username, email, password)
    VALUES (?, ?, ?)
    `;

  const conn = await createMySQLConnection();

  try {
    const [results] = await conn.query(searchEmailSql, [email]);

    if (results.length > 0) {
      return res.status(401).json({ error: "Email has existed" });
    }

    await conn.query(signupSql, [fullname, email, password]);
    return res.status(200).json("Sucess");
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.end();
  }
});

/*
=================================================================================================================================

                                    SIGNOUT FEATURE

=================================================================================================================================
*/

app.post("/signout", (req, res) => {
  res.clearCookie("userId");
  res.clearCookie("username");
  return res.status(200).json({ message: "success" });
});

/*
=================================================================================================================================

                                    OUTBOX PAGE

=================================================================================================================================
*/

app.get("/outbox", async (req, res) => {
  const userId = getUserIdFromReq(req);
  const username = getUsernameFromReq(req);
  const page = req.query.page || 1;

  if (userId === undefined) {
    res.render("err", { errMsg: "Require user id" });
    return;
  }

  var limit = req.query.limit;
  if (limit === undefined) limit = 5;

  var offset = req.query.offset;
  if (offset === undefined) offset = page - 1;

  const getAllOutboxSql =
    "SELECT  \
  wpr2023.email.id, \
  wpr2023.email.sender_id, \
  wpr2023.email.recipient_id, \
  wpr2023.email.subject, \
  wpr2023.email.body, \
  wpr2023.email.attachment_path, \
  wpr2023.email.sent_at, \
  wpr2023.email.receiver_deleted, \
  wpr2023.user.username as recipient_fullname \
  FROM wpr2023.email \
  \
  LEFT JOIN wpr2023.user ON  \
  wpr2023.email.recipient_id=wpr2023.user.id \
  \
  WHERE receiver_deleted = 0 AND \
  sender_id= " +
    userId +
    " \
";

  const sql =
    "SELECT  \
  wpr2023.email.id, \
  wpr2023.email.sender_id, \
  wpr2023.email.recipient_id, \
  wpr2023.email.subject, \
  wpr2023.email.body, \
  wpr2023.email.attachment_path, \
  wpr2023.email.sent_at, \
  wpr2023.email.receiver_deleted, \
  wpr2023.user.username as recipient_fullname \
  FROM wpr2023.email \
  \
  LEFT JOIN wpr2023.user ON  \
  wpr2023.email.recipient_id=wpr2023.user.id \
  \
  WHERE receiver_deleted = 0 AND \
  sender_id= " +
    userId +
    " \
  \
  ORDER BY sent_at DESC \
  \
  LIMIT " +
    limit +
    " \
  OFFSET " +
    offset +
    ";";

  const conn = await createMySQLConnection();

  const [allOutbox] = await conn.query(getAllOutboxSql);
  const totalPages = Math.ceil(allOutbox.length / limit);

  const [rows] = await conn.query(sql);

  res.render("outbox", {
    sentEmailList: rows,
    limit,
    offset,
    username,
    totalPages: totalPages,
    currentPage: page,
    formatDate: formatDate,
  });
});

// DELETE OUTBOX
app.post("/delete-outbox", async (req, res) => {
  const userId = getUserIdFromReq(req);
  const { ids: emailIds } = req.body;

  if (userId === undefined) res.render("err", { errMsg: "Require user id" });

  const sql = `UPDATE wpr2023.email SET receiver_deleted = 1 WHERE id IN (?)`;

  const conn = await createMySQLConnection();

  try {
    await conn.query(sql, [emailIds]);
    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.end();
  }
});

/*
=================================================================================================================================

                                    INBOX PAGE

=================================================================================================================================
*/
app.get("/inbox", async (req, res) => {
  const userId = getUserIdFromReq(req);
  const username = getUsernameFromReq(req);
  const page = req.query.page || 1;

  if (userId === undefined) {
    res.render("err", { errMsg: "Require user id" });
    return;
  }

  var limit = req.query.limit;
  if (limit === undefined) limit = 5;

  var offset = req.query.offset;
  if (offset === undefined) offset = page - 1;

  const getAllInboxSql =
    "SELECT  \
  wpr2023.email.id, \
  wpr2023.email.sender_id, \
  wpr2023.email.recipient_id, \
  wpr2023.email.subject, \
  wpr2023.email.body, \
  wpr2023.email.attachment_path, \
  wpr2023.email.sent_at, \
  wpr2023.email.sender_deleted, \
  wpr2023.user.username as sender_fullname \
  FROM wpr2023.email \
  \
  LEFT JOIN wpr2023.user ON  \
  wpr2023.email.sender_id=wpr2023.user.id \
  \
  WHERE sender_deleted = 0 AND \
  recipient_id= " +
    userId +
    " \
  ";

  const sql =
    "SELECT  \
    wpr2023.email.id, \
    wpr2023.email.sender_id, \
    wpr2023.email.recipient_id, \
    wpr2023.email.subject, \
    wpr2023.email.body, \
    wpr2023.email.attachment_path, \
    wpr2023.email.sent_at, \
    wpr2023.email.sender_deleted, \
    wpr2023.user.username as sender_fullname \
    FROM wpr2023.email \
    \
    LEFT JOIN wpr2023.user ON  \
    wpr2023.email.sender_id=wpr2023.user.id \
    \
    WHERE sender_deleted = 0 AND \
    recipient_id= " +
    userId +
     " \
    \
    ORDER BY sent_at DESC \
    \
    LIMIT " +
    limit +
    " \
    OFFSET " +
    offset +
    ";";

  const conn = await createMySQLConnection();

  const [allInbox] = await conn.query(getAllInboxSql);
  const totalPages = Math.ceil(allInbox.length / limit);

  const [rows] = await conn.query(sql);

  return res.render("inbox", {
    receivedEmailList: rows,
    limit,
    offset,
    username,
    totalPages: totalPages,
    currentPage: page,
    formatDate: formatDate,
  });
});

// DELETE INBOX
app.post("/delete-inbox", async (req, res) => {
  const userId = getUserIdFromReq(req);
  const { ids: emailIds } = req.body;

  if (userId === undefined) res.render("err", { errMsg: "Require user id" });

  const sql = `UPDATE wpr2023.email SET sender_deleted = 1 WHERE id IN (?)`;

  const conn = await createMySQLConnection();

  try {
    await conn.query(sql, [emailIds]);
    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.end();
  }
});

/*
=================================================================================================================================

                                    COMPOSE PAGE

=================================================================================================================================
*/

app.get("/compose", async (req, res) => {
  const username = getUsernameFromReq(req);
  const userId = getUserIdFromReq(req);
  const recipientListSQL = `SELECT * FROM wpr2023.user WHERE NOT id=` + userId;
  const conn = await createMySQLConnection();
  const [rows] = await conn.query(recipientListSQL);
  res.render("compose", {
    title: "Send new email",
    username,
    recipientList: rows
  });
});

// Compose API endpoint
app.post("/send-email", upload.single("attachment"), async (req, res) => {
  try {
    const attachment = req.file;

    const { recipientId, subject, body } = req.body;

    const userId = getUserIdFromReq(req);
    if (userId === undefined)
      return res.status(400).json({ error: "Require user id in cookie" });

    if (recipientId === undefined)
      return res.status(400).json({ error: "Require recipient" });    

    const sentAt = new Date();
    let attachmentPath = attachment === undefined ? null : attachment.path;

    const composeSql = `
      INSERT INTO wpr2023.email
      (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES 
      (?, ?, ?, ?, ?, ?)
    `;

    let finalSubject = subject
    if (subject === undefined || subject.trim() === '')
      finalSubject =  '(no subject)'

    const conn = await createMySQLConnection();
    await conn.query(composeSql, [
      userId,
      recipientId,
      finalSubject,
      body,
      attachmentPath,
      sentAt,
    ]);
    return res.status(200).json("Sucess");
  } catch (error) {
    console.log("Error uploading file" + error);
    return res.status(500).json({ error: "Internal server error" + error });
  }
});

/*
=================================================================================================================================

                                    EMAIL DETAIL PAGE

=================================================================================================================================
*/

app.get("/email-detail", async (req, res) => {
  const userId = getUserIdFromReq(req);
  const username = getUsernameFromReq(req);

  if (userId === undefined) res.render("err", { errMsg: "Require user id" });

  var emailId = req.query.emailId;

  if (emailId === undefined) {
    res.render("err", { errMsg: "Require email id" });
    return;
  }

  const sql =
    "SELECT * FROM wpr2023.email \
    WHERE id=" +
    emailId +
    " \
    AND (sender_id=" +
    userId +
    " OR recipient_id=" +
    userId +
    ");";

  const conn = await createMySQLConnection();
  const [rows] = await conn.query(sql);

  if (rows.length === 0) {
    res.render("err", { errMsg: "Email not exist" });
    return;
  }

  res.render("emaildetail", { email: rows[0], username });
});

/*
=================================================================================================================================

                                    START SERVER

=================================================================================================================================
*/

app.use(express.static("public"));
app.listen(8000);
