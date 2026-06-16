const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  console.log("📊 Запрос категорий...");
  
  if (!db) {
    console.error("❌ Нет соединения с БД");
    return res.status(500).json({ message: "Нет соединения с базой данных" });
  }
  
  const sql = `
    SELECT 
      c.*,
      COUNT(p.idproducts) as product_count
    FROM categories c
    LEFT JOIN products p ON c.idcategories = p.categoryid
    GROUP BY c.idcategories
    ORDER BY c.idcategories
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Ошибка SQL:", err);
      return res.status(500).json({ message: "Ошибка сервера", error: err.message });
    }
    
    console.log(`✅ Найдено ${result.length} категорий`);
    
    const formattedResult = result.map(category => {
      return {
        idcategories: category.idcategories,
        title: category.name || `Категория ${category.idcategories}`,
        image: category.image || null,
        product_count: category.product_count || 0
      };
    });
    
    res.json(formattedResult);
  });
});

module.exports = router;