const db = require('./db');

const addColumn = `
  ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Самара'
`;

db.query(addColumn, (err) => {
  if (err) {
    console.error("❌ Ошибка добавления поля city:", err);
  } else {
    console.log("✅ Поле city добавлено в таблицу orders");
  }
  process.exit();
});