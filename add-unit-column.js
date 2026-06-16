const db = require('./db');

// Добавляем поле unit в таблицу products
db.query("ALTER TABLE products ADD COLUMN unit VARCHAR(20) DEFAULT 'шт'", (err) => {
  if (err) {
    if (err.message.includes('Duplicate column')) {
      console.log("✅ Поле unit уже существует");
    } else {
      console.log("❌ Ошибка:", err.message);
    }
  } else {
    console.log("✅ Поле unit добавлено");
  }
  
  // Изменяем тип quantity в cart для поддержки дробных чисел (кг)
  db.query("ALTER TABLE cart MODIFY quantity DECIMAL(10,2) DEFAULT 1", (err) => {
    if (err) console.log("⚠️ Ошибка изменения cart:", err.message);
    else console.log("✅ Таблица cart обновлена (поддержка дробных кг)");
  });
  
  // Обновляем существующие товары
  db.query("UPDATE products SET unit = 'шт' WHERE unit IS NULL", (err) => {
    if (err) console.error("Ошибка обновления:", err);
    else console.log("✅ Товары обновлены");
  });
  
  // Добавляем тестовые товары в кг
  db.query(`INSERT INTO products (title, price, categoryid, description, stock, image, unit) VALUES 
    ('Картофель', 60, 1, 'Свежий картофель, урожай 2024', 100, 'default.jpg', 'кг'),
    ('Помидоры', 120, 1, 'Спелые помидоры', 80, 'default.jpg', 'кг'),
    ('Огурцы', 90, 1, 'Свежие огурцы', 70, 'default.jpg', 'кг'),
    ('Яблоки', 110, 1, 'Сладкие яблоки', 90, 'default.jpg', 'кг')
  ON DUPLICATE KEY UPDATE unit=VALUES(unit)`, (err) => {
    if (err) console.error("Ошибка добавления:", err);
    else console.log("✅ Добавлены товары в килограммах");
  });
  
  setTimeout(() => process.exit(), 2000);
});