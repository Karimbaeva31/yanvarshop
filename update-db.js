const db = require('./db');

// Добавляем недостающие колонки
const queries = [
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT",
  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0",
  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Самара'"
];

async function update() {
  for (const query of queries) {
    try {
      await db.promise().query(query);
      console.log("✅ Выполнен запрос:", query.substring(0, 50) + "...");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.log("⚠️ Пропускаем:", err.message.substring(0, 50));
      }
    }
  }
  console.log("✅ База данных обновлена!");
  process.exit();
}

update();