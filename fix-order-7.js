const db = require('./db');

// Сначала посмотрим, какие товары были в корзине у пользователя
db.query(`
  SELECT c.*, p.title, p.price 
  FROM cart c 
  JOIN products p ON c.productid = p.idproducts 
  WHERE c.userid = 8
`, (err, cartItems) => {
  if (err) {
    console.error("Ошибка:", err);
    process.exit();
    return;
  }
  
  console.log("📦 Товары в корзине пользователя:", cartItems);
  
  // Добавляем товары в order_items для заказа #7
  const orderId = 7;
  
  // Если есть товары в корзине, добавляем их
  if (cartItems.length > 0) {
    const values = cartItems.map(item => [orderId, item.productid, item.quantity, item.price]);
    
    db.query(
      `INSERT INTO order_items (orderid, productid, quantity, price) VALUES ?`,
      [values],
      (err) => {
        if (err) {
          console.error("❌ Ошибка добавления:", err);
        } else {
          console.log(`✅ Добавлено ${cartItems.length} товаров в заказ #${orderId}`);
        }
        process.exit();
      }
    );
  } else {
    console.log("⚠️ Нет товаров в корзине");
    process.exit();
  }
});