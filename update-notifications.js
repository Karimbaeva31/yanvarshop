const db = require('./db');

// Добавляем поле admin_id в таблицу notifications
db.query("ALTER TABLE notifications ADD COLUMN admin_id INT", (err) => {
  if (err) {
    if (err.message.includes('Duplicate column')) {
      console.log("✅ Поле admin_id уже существует");
    } else {
      console.log("❌ Ошибка:", err.message);
    }
  } else {
    console.log("✅ Поле admin_id добавлено");
  }
  
  // Очищаем старые уведомления
  db.query("DELETE FROM notifications WHERE admin_id IS NULL", (err) => {
    if (err) console.error("Ошибка очистки:", err);
    else console.log("✅ Старые уведомления очищены");
    process.exit();
  });
});