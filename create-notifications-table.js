const db = require('./db');

const createTable = `
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  total DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(idorders) ON DELETE CASCADE
)`;

db.query(createTable, (err) => {
  if (err) {
    console.error("❌ Ошибка:", err);
  } else {
    console.log("✅ Таблица notifications создана");
  }
  process.exit();
});