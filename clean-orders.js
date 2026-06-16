const db = require('./db');

// Удаляем все заказы с суммой 0 или без товаров
db.query("DELETE FROM orders WHERE total = 0 OR total IS NULL", (err, result) => {
    if (err) {
        console.error("Ошибка:", err);
    } else {
        console.log(`✅ Удалено ${result.affectedRows} пустых заказов`);
    }
    
    // Также удаляем пустые order_items
    db.query("DELETE FROM order_items WHERE orderid NOT IN (SELECT orderid FROM orders)", (err) => {
        if (err) console.error("Ошибка:", err);
        else console.log("✅ Очищены связанные товары");
        process.exit();
    });
});