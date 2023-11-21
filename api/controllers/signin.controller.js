const { createMySQLConnection } = require("../../dbconn");
const cookieParser = require("cookie-parser");

class signInController {
  index(req, res) {
    const userId = req.cookies.userId;

    if (userId) {
      // need to be redirected to "inbox" page
      return res.redirect("/outbox");
    } else {
      res.render("signin", {
        title: "Sign in page",
      });
    }
  }

  async signIn(req, res) {
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
        return res.status(200).json(user);
      } else {
        return res.status(401).json({ error: "Invalid email or password" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    } finally {
      conn.end();
    }
  }
}

module.exports = signInController;
