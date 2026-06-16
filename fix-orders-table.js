const db = require('./db');

const queries = [
    "ALTER TABLE orders ADD COLUMN address TEXT",
    "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(100)",
    "ALTER TABLE orders ADD COLUMN comment TEXT",
    "ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0"
];

function runQueries(index) {
    if (index >= queries.length) {
        console.log("✅ Все колонки добавлены!");
        process.exit();
        return;
    }
    
    const query = queries[index];
    console.log(`Выполняется: ${query.substring(0, 50)}...`);
    
    db.query(query, (err) => {
        if (err) {
            if (err.message.includes('Duplicate column')) {
                console.log("   ⚠️ Колонка уже существует");
            } else {
                console.log("   ❌ Ошибка:", err.message);
            }
        } else {
            console.log("   ✅ Добавлено!");
        }
        runQueries(index + 1);
    });
}

runQueries(0);