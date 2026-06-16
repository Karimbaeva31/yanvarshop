const db = require('./db');

const queries = [
  // Добавляем поля в таблицу orders
  `ALTER TABLE orders 
   ADD COLUMN IF NOT EXISTS address TEXT,
   ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
   ADD COLUMN IF NOT EXISTS comment TEXT,
   ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2) DEFAULT 0`,

  // Создаем таблицу order_items
  `CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orderid INT NOT NULL,
    productid INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (orderid) REFERENCES orders(orderid) ON DELETE CASCADE,
    FOREIGN KEY (productid) REFERENCES products(idproducts)
  )`,
  
  // Создаем таблицу уведомлений
  `CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    total DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(orderid) ON DELETE CASCADE
  )`,
  
  // Создаем таблицу профилей пользователей
  `ALTER TABLE users 
   ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
   ADD COLUMN IF NOT EXISTS address TEXT,
   ADD COLUMN IF NOT EXISTS avatar VARCHAR(255)`
];

async function update() {
  for (const query of queries) {
    try {
      await db.promise().query(query);
      console.log("✅ Выполнен запрос");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.error("❌ Ошибка:", err.message);
      }
    }
  }
  console.log("✅ Таблицы обновлены");
  process.exit();
}

update();