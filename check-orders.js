const db = require('./db');

db.query("SHOW COLUMNS FROM orders", (err, columns) => {
    if (err) {
        console.error("Ошибка:", err);
    } else {
        console.log("📋 Структура таблицы orders:");
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });
    }
    process.exit();
});