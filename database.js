const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./system.db');

// Tạo bảng lưu trữ người dùng
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      status TEXT DEFAULT 'pending',
      key TEXT UNIQUE,
      downloads INTEGER DEFAULT 0
    )
  `);
});

module.exports = db;