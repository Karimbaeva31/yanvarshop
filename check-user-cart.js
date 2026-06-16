const db = require('./db');

// Получаем всех пользователей
db.query("SELECT idusers, email FROM users", (err, users) => {
    if (err) {
        console.error("Ошибка:", err);
        process.exit();
        return;
    }
    
    console.log("👥 Пользователи:");
    users.forEach(u => {
        console.log(`  ID: ${u.idusers}, Email: ${u.email}`);
    });
    
    // Проверяем корзину для каждого
    users.forEach(user => {
        db.query(
            "SELECT c.*, p.title FROM cart c JOIN products p ON c.productid = p.idproducts WHERE c.userid = ?",
            [user.idusers],
            (err, items) => {
                if (items && items.length > 0) {
                    console.log(`\n🛒 Корзина пользователя ${user.email} (ID: ${user.idusers}):`);
                    items.forEach(item => {
                        console.log(`  - ${item.title}: ${item.quantity} шт.`);
                    });
                }
            }
        );
    });
    
    setTimeout(() => process.exit(), 2000);
});