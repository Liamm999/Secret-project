const mysql = require("mysql2");

const createMySQLConnection = () => {
  return mysql
    .createConnection({
      host: "localhost",
      user: "wpr",
      password: "fit2023",
      port: 3306,
    })
    .promise();
}

module.exports = {
  createMySQLConnection
}