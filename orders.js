const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// Создание заказа (админы не могут заказывать)
router.post("/", verifyToken, (req, res) => {
  const { address, payment_method, comment } = req.body;
  const userid = req.user.id;
  const roleid = req.user.roleid;
  
  // === ЗАПРЕТ ДЛЯ АДМИНОВ ===
  if (roleid === 1) {
    return res.status(403).json({ 
      message: "Администраторы не могут оформлять заказы. Пожалуйста, войдите как обычный пользователь.",
      error: "admin_cannot_order"
    });
  }
  
  if (!address) {
    return res.status(400).json({ message: "Укажите адрес доставки" });
  }
  
  if (!address.toLowerCase().includes('самара')) {
    return res.status(400).json({ message: "Доставка только по городу Самара" });
  }
  
  if (!payment_method) {
    return res.status(400).json({ message: "Выберите способ оплаты" });
  }
  
  db.query(
    `SELECT c.*, p.price FROM cart c JOIN products p ON c.productid = p.idproducts WHERE c.userid = ?`,
    [userid],
    (err, cartItems) => {
      if (err || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Корзина пуста" });
      }
      
      const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      
      db.query(
        `INSERT INTO orders (userid, status, address, payment_method, comment, total_price, created_at) 
         VALUES (?, 'new', ?, ?, ?, ?, NOW())`,
        [userid, address, payment_method, comment || '', total],
        (err, result) => {
          if (err) {
            console.error("Ошибка:", err);
            return res.status(500).json({ message: "Ошибка создания заказа" });
          }
          
          const orderId = result.insertId;
          
          const values = cartItems.map(item => [orderId, item.productid, item.quantity, item.price]);
          db.query(`INSERT INTO order_items (orderid, productid, quantity, price) VALUES ?`, [values]);
          
          db.query("DELETE FROM cart WHERE userid = ?", [userid]);
          
          // === ОТПРАВЛЯЕМ УВЕДОМЛЕНИЯ ВСЕМ АДМИНАМ ===
          sendNotificationToAllAdmins(orderId, userid, total);
          
          res.json({ message: "Заказ оформлен!", orderId: orderId, total: total });
        }
      );
    }
  );
});

// Функция отправки уведомлений всем админам
function sendNotificationToAllAdmins(orderId, userId, total) {
  // Получаем информацию о покупателе
  db.query("SELECT fullname, email FROM users WHERE idusers = ?", [userId], (err, user) => {
    if (err || !user || user.length === 0) return;
    
    const customerName = user[0].fullname;
    const customerEmail = user[0].email;
    
    // Получаем всех админов
    db.query("SELECT idusers, email FROM users WHERE roleid = 1", (err, admins) => {
      if (err || !admins || admins.length === 0) {
        console.log("⚠️ Нет администраторов для уведомления");
        return;
      }
      
      console.log(`📢 Отправка уведомления ${admins.length} администраторам о заказе #${orderId}`);
      
      // Создаем уведомление для каждого админа
      admins.forEach(admin => {
        db.query(
          `INSERT INTO notifications (order_id, user_name, user_email, total, admin_id, status) 
           VALUES (?, ?, ?, ?, ?, 'unread')`,
          [orderId, customerName, customerEmail, total, admin.idusers],
          (err) => {
            if (err) {
              console.error(`❌ Ошибка уведомления для админа ${admin.idusers}:`, err);
            } else {
              console.log(`✅ Уведомление отправлено админу ${admin.email}`);
            }
          }
        );
      });
    });
  });
}

// Получение заказов пользователя
router.get("/", verifyToken, (req, res) => {
  // Админы не видят заказы как обычные пользователи
  if (req.user.roleid === 1) {
    return res.json([]);
  }
  
  db.query(
    `SELECT idorders as orderid, userid, status, address, payment_method, comment, total_price as total,
     DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
     FROM orders WHERE userid = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, orders) => {
      if (err) return res.status(500).json({ message: "Ошибка" });
      res.json(orders || []);
    }
  );
});

// Детали заказа
router.get("/:orderId", verifyToken, (req, res) => {
  const orderId = req.params.orderId;
  const userid = req.user.id;
  const roleid = req.user.roleid;
  
  let query = roleid === 1 
    ? `SELECT idorders as orderid, userid, status, address, payment_method, comment, total_price as total,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
       FROM orders WHERE idorders = ?`
    : `SELECT idorders as orderid, userid, status, address, payment_method, comment, total_price as total,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
       FROM orders WHERE idorders = ? AND userid = ?`;
  
  const params = roleid === 1 ? [orderId] : [orderId, userid];
  
  db.query(query, params, (err, orders) => {
    if (err || !orders || orders.length === 0) {
      return res.status(404).json({ message: "Заказ не найден" });
    }
    
    db.query(
      `SELECT oi.*, p.title FROM order_items oi JOIN products p ON oi.productid = p.idproducts WHERE oi.orderid = ?`,
      [orderId],
      (err2, items) => {
        res.json({ order: orders[0], items: items || [] });
      }
    );
  });
});

// Получение уведомлений для админа (только свои)
router.get("/admin/notifications", verifyToken, (req, res) => {
  if (req.user.roleid !== 1) {
    return res.status(403).json({ message: "Доступ запрещен" });
  }
  
  db.query(
    `SELECT n.*, 
     (SELECT COUNT(*) FROM notifications WHERE admin_id = ? AND status = 'unread') as unread_count
     FROM notifications n 
     WHERE n.admin_id = ? 
     ORDER BY n.created_at DESC LIMIT 50`,
    [req.user.id, req.user.id],
    (err, notifications) => {
      if (err) {
        console.error("Ошибка:", err);
        return res.status(500).json({ message: "Ошибка" });
      }
      res.json(notifications);
    }
  );
});

// Получение всех заказов для админа
router.get("/admin/all", verifyToken, (req, res) => {
  if (req.user.roleid !== 1) {
    return res.status(403).json({ message: "Доступ запрещен" });
  }
  
  db.query(
    `SELECT o.*, u.fullname, u.email,
     DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') as created_at
     FROM orders o 
     LEFT JOIN users u ON o.userid = u.idusers 
     ORDER BY o.created_at DESC`,
    (err, orders) => {
      if (err) return res.status(500).json({ message: "Ошибка" });
      res.json(orders);
    }
  );
});

// Обновление статуса заказа
router.put("/:orderId/status", verifyToken, (req, res) => {
  if (req.user.roleid !== 1) {
    return res.status(403).json({ message: "Доступ запрещен" });
  }
  
  const { status } = req.body;
  const orderId = req.params.orderId;
  
  db.query(
    "UPDATE orders SET status = ? WHERE idorders = ?",
    [status, orderId],
    (err) => {
      if (err) return res.status(500).json({ message: "Ошибка" });
      res.json({ message: "Статус обновлен", status });
    }
  );
});

// Отметить уведомление как прочитанное
router.put("/admin/notifications/:id/read", verifyToken, (req, res) => {
  if (req.user.roleid !== 1) return res.status(403).json({ message: "Доступ запрещен" });
  
  db.query(
    "UPDATE notifications SET status = 'read' WHERE id = ? AND admin_id = ?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Ошибка" });
      res.json({ message: "Уведомление прочитано" });
    }
  );
});

// ========== ОТЧЕТЫ ДЛЯ АДМИНА ==========

// Получение статистики продаж
router.get("/admin/reports/stats", verifyToken, (req, res) => {
    if (req.user.roleid !== 1) {
        return res.status(403).json({ message: "Доступ запрещен" });
    }
    
    db.query(`
        SELECT 
            SUM(total_price) as total_revenue,
            COUNT(*) as total_orders,
            COUNT(DISTINCT userid) as total_customers
        FROM orders 
        WHERE status != 'cancelled'
    `, (err, stats) => {
        if (err) return res.status(500).json({ message: "Ошибка" });
        
        db.query(`
            SELECT SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN orders o ON oi.orderid = o.orderid
            WHERE o.status != 'cancelled'
        `, (err2, sold) => {
            if (err2) return res.status(500).json({ message: "Ошибка" });
            
            res.json({
                total_revenue: stats[0]?.total_revenue || 0,
                total_orders: stats[0]?.total_orders || 0,
                total_customers: stats[0]?.total_customers || 0,
                total_products_sold: parseInt(sold[0]?.total_sold) || 0
            });
        });
    });
});

// Топ продаваемых товаров
router.get("/admin/reports/top-products", verifyToken, (req, res) => {
    if (req.user.roleid !== 1) {
        return res.status(403).json({ message: "Доступ запрещен" });
    }
    
    db.query(`
        SELECT 
            p.title,
            p.unit,
            SUM(oi.quantity) as total_sold,
            SUM(oi.quantity * oi.price) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.orderid = o.orderid
        JOIN products p ON oi.productid = p.idproducts
        WHERE o.status != 'cancelled'
        GROUP BY p.idproducts
        ORDER BY total_sold DESC
        LIMIT 10
    `, (err, products) => {
        if (err) return res.status(500).json({ message: "Ошибка" });
        res.json(products || []);
    });
});

// Продажи по месяцам
router.get("/admin/reports/sales-by-month", verifyToken, (req, res) => {
    if (req.user.roleid !== 1) {
        return res.status(403).json({ message: "Доступ запрещен" });
    }
    
    db.query(`
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            SUM(total_price) as revenue,
            COUNT(*) as orders
        FROM orders
        WHERE status != 'cancelled'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
    `, (err, sales) => {
        if (err) return res.status(500).json({ message: "Ошибка" });
        res.json(sales || []);
    });
});

module.exports = router;