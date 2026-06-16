const db = require('./db');

const createTable = `
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderid INT NOT NULL,
  productid INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderid) REFERENCES orders(idorders) ON DELETE CASCADE,
  FOREIGN KEY (productid) REFERENCES products(idproducts) ON DELETE CASCADE
)`;

db.query(createTable, (err) => {
  if (err) {
    console.error("❌ Ошибка создания таблицы:", err);
  } else {
    console.log("✅ Таблица order_items успешно создана!");
    
    // Проверяем, что таблица создалась
    db.query("SHOW TABLES LIKE 'order_items'", (err, result) => {
      if (err) {
        console.error("Ошибка проверки:", err);
      } else {
        console.log("📋 Таблица order_items:", result.length > 0 ? "существует ✅" : "не найдена ❌");
      }
      process.exit();
    });
  }
});