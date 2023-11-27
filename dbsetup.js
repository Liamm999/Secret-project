const { createMySQLConnection } = require("./dbconn");
const connection = createMySQLConnection();

const createDatabase = async () => {
  try {
    // Connect to MySQL server
    await connection.connect();

    // Create the database if not exists
    await connection.query("CREATE DATABASE IF NOT EXISTS wpr2023");

    // Switch to the database
    await connection.query("USE wpr2023");

    // Create the users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    // Create the emails table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sender_id INT,
        recipient_id INT,
        subject VARCHAR(255),
        body TEXT,
        attachment_path VARCHAR(255),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sender_deleted INT NOT NULL DEFAULT(0),
        receiver_deleted INT NOT NULL DEFAULT(0),
        FOREIGN KEY (sender_id) REFERENCES user(id),
        FOREIGN KEY (recipient_id) REFERENCES user(id)
      )
    `);

    initData();
  } catch (error) {
    throw new Error(error.message);
  }
};

const initData = async () => {
  try {
    await connection.connect();

    // users
    await connection.query(`
      INSERT IGNORE INTO user (username, email, password)
      VALUES ('AAAAAA', 'a@a.com', 'A123')
    `);

    await connection.query(`
      INSERT IGNORE INTO user (username, email, password)
      VALUES ('John Wick', 'dontkillmydog@gmail.com', 'John12345')
    `);

    await connection.query(`
      INSERT IGNORE INTO user (username, email, password)
      VALUES ('test user', 'user@test.com', 'Test12345')
    `);

    // email
    await connection.query(`
      INSERT INTO email (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES (1, 2, 'Test email 1', 'Hello my friends', 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D', '2023-11-16 00:41')
    `);

    await connection.query(`
      INSERT INTO email (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES (1, 3, 'Test email again', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet neque eu mi dignissim dictum sit amet eu nisi. Praesent blandit felis eu nibh imperdiet, et molestie velit dictum. Sed et sodales est. Praesent a congue felis. Nullam auctor imperdiet augue sed vestibulum. Aliquam suscipit sed nisi quis pretium. Pellentesque et ornare nulla, mollis imperdiet nibh. Aenean ac dui semper, ornare mi eget, dignissim nunc.', '', '2023-11-16 00:41')
  `);

    await connection.query(`
      INSERT INTO email (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES (3, 1, 'Test email again', 'Hello my friends', '', '2023-11-16 00:41')
  `);

    await connection.query(`
      INSERT INTO email (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES (2, 1, 'Test email again', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet neque eu mi dignissim dictum sit amet eu nisi. Praesent blandit felis eu nibh imperdiet', '', '2023-11-16 00:41')
  `);

    await connection.query(`
      INSERT INTO email (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES (1, 2, 'Test email 1', 'Hello my friends', 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&    ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D', '2023-11-16 00:41')
  `);

    await connection.query(`
      INSERT INTO email (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES (1, 3, 'Test email again', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet neque eu mi dignissim dictum sit amet eu nisi. Praesent blandit felis eu nibh imperdiet, et molestie velit dictum. Sed et sodales est. Praesent a congue felis. Nullam auctor imperdiet augue sed vestibulum. Aliquam suscipit sed nisi quis pretium. Pellentesque et ornare nulla, mollis imperdiet nibh. Aenean ac dui semper, ornare mi eget, dignissim nunc.', '', '2023-11-16 00:41')
  `);

    await connection.query(`
      INSERT INTO email (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES (3, 1, 'Test email again', 'Hello my friends', '', '2023-11-16 00:41')
  `);

    await connection.query(`
      INSERT INTO email (sender_id, recipient_id, subject, body, attachment_path, sent_at)
      VALUES (2, 1, 'Test email again', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet neque eu mi dignissim dictum sit amet eu nisi. Praesent blandit felis eu nibh imperdiet', '', '2023-11-16 00:41')
  `);

    await connection.end();
  } catch (error) {
    throw new Error(error.message);
  }
};

createDatabase();
