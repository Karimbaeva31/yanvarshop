const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/auth");

// Получение корзины
router.get("/", verifyToken, (req, res) => {
  console.log("🛒 Запрос корзины для пользователя:", req.user.id);
  
  db.query(
    `SELECT c.*, p.title, p.price, p.stock 
     FROM cart c
     JOIN products p ON c.productid = p.idproducts
     WHERE c.userid = ?`,
    [req.user.id],
    (err, result) => {
      if (err) {
        console.error("❌ Ошибка:", err);
        return res.status(500).json({ message: "Ошибка сервера" });
      }
      res.json(result);
    }
  );
});

// Добавление в корзину с проверкой остатка
router.post("/", verifyToken, (req, res) => {
  const { productid, quantity = 1 } = req.body;
  
  console.log("📥 Добавление в корзину:", { userid: req.user.id, productid, quantity });
  
  // Сначала проверяем остаток товара
  db.query("SELECT title, stock FROM products WHERE idproducts = ?", [productid], (err, product) => {
    if (err || product.length === 0) {
      return res.status(404).json({ message: "Товар не найден" });
    }
    
    const availableStock = product[0].stock;
    
    if (availableStock <= 0) {
      return res.status(400).json({ message: `Товар "${product[0].title}" закончился на складе` });
    }
    
    // Проверяем текущее количество в корзине
    db.query(
      "SELECT quantity FROM cart WHERE userid = ? AND productid = ?",
      [req.user.id, productid],
      (err, existing) => {
        const currentQty = existing.length > 0 ? existing[0].quantity : 0;
        const newQty = currentQty + quantity;
        
        if (newQty > availableStock) {
          return res.status(400).json({ 
            message: `Недостаточно товара. Доступно только ${availableStock} шт.`,
            available: availableStock
          });
        }
        
        if (existing.length > 0) {
          db.query(
            "UPDATE cart SET quantity = ? WHERE userid = ? AND productid = ?",
            [newQty, req.user.id, productid],
            (err) => {
              if (err) return res.status(500).json({ message: "Ошибка обновления" });
              res.json({ message: "Количество обновлено", quantity: newQty, available: availableStock - newQty });
            }
          );
        } else {
          db.query(
            "INSERT INTO cart (userid, productid, quantity) VALUES (?, ?, ?)",
            [req.user.id, productid, quantity],
            (err) => {
              if (err) return res.status(500).json({ message: "Ошибка добавления" });
              res.json({ message: "Товар добавлен в корзину", available: availableStock - quantity });
            }
          );
        }
      }
    );
  });
});

// Обновление количества с проверкой остатка
router.put("/:productid", verifyToken, (req, res) => {
  const { quantity } = req.body;
  const productId = req.params.productid;
  
  if (quantity < 1) {
    return res.status(400).json({ message: "Количество должно быть не менее 1" });
  }
  
  // Проверяем остаток
  db.query("SELECT stock FROM products WHERE idproducts = ?", [productId], (err, product) => {
    if (err || product.length === 0) {
      return res.status(404).json({ message: "Товар не найден" });
    }
    
    if (quantity > product[0].stock) {
      return res.status(400).json({ 
        message: `Недостаточно товара. Доступно только ${product[0].stock} шт.`,
        available: product[0].stock
      });
    }
    
    db.query(
      "UPDATE cart SET quantity = ? WHERE userid = ? AND productid = ?",
      [quantity, req.user.id, productId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Ошибка обновления" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Товар не найден в корзине" });
        }
        res.json({ message: "Количество обновлено", quantity });
      }
    );
  });
});

// Удаление из корзины
router.delete("/:productid", verifyToken, (req, res) => {
  db.query(
    "DELETE FROM cart WHERE userid = ? AND productid = ?",
    [req.user.id, req.params.productid],
    (err) => {
      if (err) return res.status(500).json({ message: "Ошибка удаления" });
      res.json({ message: "Товар удален" });
    }
  );
});

// Очистка корзины
router.delete("/", verifyToken, (req, res) => {
  db.query("DELETE FROM cart WHERE userid = ?", [req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Ошибка очистки" });
    res.json({ message: "Корзина очищена" });
  });
});

module.exports = router;