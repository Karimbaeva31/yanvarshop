const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, isAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");

// GET все товары (с unit)
router.get("/", (req, res) => {
    const sql = "SELECT *, unit FROM products";
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Ошибка загрузки товаров:", err);
            return res.status(500).json({ message: "Ошибка сервера" });
        }
        
        console.log(`📦 Загружено товаров: ${result.length}`);
        
        const productsWithImages = result.map(product => {
            console.log(`  Товар ID ${product.idproducts}: image = "${product.image}", unit = "${product.unit || 'шт'}"`);
            
            if (product.image && product.image.trim() !== '') {
                if (product.image.startsWith('http')) {
                    return product;
                }
                if (product.image.startsWith('/uploads/')) {
                    return product;
                }
                if (product.image && !product.image.includes('/')) {
                    product.image = `/uploads/products/${product.image}`;
                }
            } else {
                product.image = '/uploads/products/default.jpg';
            }
            // Убеждаемся, что unit есть
            if (!product.unit) {
                product.unit = 'шт';
            }
            return product;
        });
        
        res.json(productsWithImages);
    });
});

// POST создание товара (с unit)
router.post("/", verifyToken, isAdmin, upload.single('image'), (req, res) => {
    console.log("=".repeat(60));
    console.log("➕ СОЗДАНИЕ НОВОГО ТОВАРА");
    console.log("📝 Тело запроса:", req.body);
    console.log("📸 Файл получен?", !!req.file);
    console.log("📁 Инфо о файле:", req.file);
    console.log("=".repeat(60));
    
    const { title, price, categoryid, description, stock, unit } = req.body;
    
    let imagePath = null;
    if (req.file) {
        imagePath = req.file.filename;
        console.log("✅ Картинка сохранена как:", imagePath);
        console.log("📍 Полный путь:", req.file.path);
        
        if (fs.existsSync(req.file.path)) {
            const fileStats = fs.statSync(req.file.path);
            console.log(`✅ Файл существует, размер: ${fileStats.size} байт`);
        } else {
            console.log("❌ Файл не найден по пути:", req.file.path);
        }
    } else {
        console.log("⚠️ Файл не загружен");
    }
    
    const sql = `
        INSERT INTO products (title, price, categoryid, description, stock, image, unit) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(
        sql,
        [title, price, categoryid, description || '', stock || 0, imagePath, unit || 'шт'],
        (err, result) => {
            if (err) {
                console.error("❌ Ошибка создания товара:", err);
                
                // Если нет поля unit, добавляем его
                if (err.code === 'ER_BAD_FIELD_ERROR' && err.sqlMessage.includes('unit')) {
                    console.log("⚠️ Поле 'unit' отсутствует в таблице. Добавляем...");
                    
                    const addUnitSql = `ALTER TABLE products ADD COLUMN unit VARCHAR(20) DEFAULT 'шт'`;
                    db.query(addUnitSql, (alterErr) => {
                        if (alterErr) {
                            console.log("⚠️ Не удалось добавить поле unit:", alterErr.message);
                        } else {
                            console.log("✅ Добавлено поле 'unit' в таблицу products");
                        }
                        // Повторяем запрос
                        db.query(
                            sql,
                            [title, price, categoryid, description || '', stock || 0, imagePath, unit || 'шт'],
                            (err2, result2) => {
                                if (err2) {
                                    return res.status(500).json({ message: "Ошибка создания товара", error: err2.message });
                                }
                                console.log("✅ Товар создан, ID:", result2.insertId);
                                res.json({
                                    message: "Товар создан",
                                    id: result2.insertId,
                                    imageUrl: imagePath ? `/uploads/products/${imagePath}` : '/uploads/products/default.jpg'
                                });
                            }
                        );
                    });
                } else if (err.code === 'ER_BAD_FIELD_ERROR' && err.sqlMessage.includes('image')) {
                    console.log("⚠️ Поле 'image' отсутствует в таблице. Пытаемся создать без него...");
                    
                    const sqlWithoutImage = `
                        INSERT INTO products (title, price, categoryid, description, stock, unit) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.query(
                        sqlWithoutImage,
                        [title, price, categoryid, description || '', stock || 0, unit || 'шт'],
                        (err2, result2) => {
                            if (err2) {
                                console.error("❌ Ошибка создания товара без картинки:", err2);
                                return res.status(500).json({ 
                                    message: "Ошибка создания товара",
                                    error: err2.message 
                                });
                            }
                            
                            console.log("✅ Товар создан без картинки, ID:", result2.insertId);
                            
                            const addFieldSql = `ALTER TABLE products ADD COLUMN image VARCHAR(255) DEFAULT NULL`;
                            db.query(addFieldSql, (alterErr) => {
                                if (alterErr) {
                                    console.log("⚠️ Не удалось добавить поле image:", alterErr.message);
                                } else {
                                    console.log("✅ Добавлено поле 'image' в таблицу products");
                                }
                            });
                            
                            res.json({ 
                                message: "Товар создан",
                                id: result2.insertId,
                                imageUrl: '/uploads/products/default.jpg'
                            });
                        }
                    );
                } else {
                    res.status(500).json({ 
                        message: "Ошибка создания товара",
                        error: err.message 
                    });
                }
                return;
            }
            
            console.log("✅ Товар создан, ID:", result.insertId);
            
            const responseData = {
                message: "Товар создан",
                id: result.insertId,
                unit: unit || 'шт',
                imageUrl: imagePath ? `/uploads/products/${imagePath}` : '/uploads/products/default.jpg'
            };
            
            console.log("📦 Ответ сервера:", responseData);
            res.json(responseData);
        }
    );
});

// PUT обновление товара (с unit)
router.put("/:id", verifyToken, isAdmin, upload.single('image'), (req, res) => {
    console.log("=".repeat(60));
    console.log("🔄 ОБНОВЛЕНИЕ ТОВАРА");
    console.log("📝 ID товара:", req.params.id);
    console.log("📦 Тело запроса:", req.body);
    console.log("📸 Текущая картинка из запроса:", req.body.currentImage);
    console.log("📁 Новый файл:", req.file);
    console.log("=".repeat(60));
    
    const productId = req.params.id;
    const { title, price, categoryid, description, stock, currentImage, unit } = req.body;
    
    db.query(
        "SELECT image FROM products WHERE idproducts = ?",
        [productId],
        (err, result) => {
            if (err) {
                console.error("❌ Ошибка получения данных товара:", err);
                return res.status(500).json({ message: "Ошибка получения данных" });
            }
            
            if (result.length === 0) {
                console.log("❌ Товар не найден в БД");
                return res.status(404).json({ message: "Товар не найден" });
            }
            
            const dbImageName = result[0].image;
            console.log("📷 Текущая картинка из БД:", dbImageName);
            console.log("📷 Текущая картинка из запроса:", currentImage);
            
            let newImagePath = dbImageName;
            
            if (req.file) {
                const oldImageName = currentImage || dbImageName;
                console.log("📸 Загружена новая картинка:", req.file.filename);
                console.log("🗑️ Старая картинка для удаления:", oldImageName);
                
                if (oldImageName && oldImageName !== 'default.jpg' && !oldImageName.startsWith('http')) {
                    const oldImagePath = path.join(__dirname, '../../frontend/uploads/products', oldImageName);
                    console.log("📍 Путь к старой картинке:", oldImagePath);
                    
                    if (fs.existsSync(oldImagePath)) {
                        try {
                            fs.unlinkSync(oldImagePath);
                            console.log("✅ Старая картинка удалена:", oldImageName);
                        } catch (unlinkErr) {
                            console.log("⚠️ Не удалось удалить старую картинку:", unlinkErr.message);
                        }
                    } else {
                        console.log("⚠️ Старая картинка не найдена по пути:", oldImagePath);
                    }
                }
                
                newImagePath = req.file.filename;
                console.log("✅ Новая картинка:", newImagePath);
            } else {
                console.log("📸 Новая картинка не загружена, оставляем старую");
            }
            
            const updateSql = `
                UPDATE products 
                SET title = ?, price = ?, categoryid = ?, description = ?, stock = ?, image = ?, unit = ?
                WHERE idproducts = ?
            `;
            
            console.log("📝 SQL запрос:", updateSql);
            console.log("📦 Параметры:", [title, price, categoryid, description || '', stock || 0, newImagePath, unit || 'шт', productId]);
            
            db.query(
                updateSql,
                [title, price, categoryid, description || '', stock || 0, newImagePath, unit || 'шт', productId],
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error("❌ Ошибка обновления товара:", updateErr);
                        return res.status(500).json({ 
                            message: "Ошибка обновления",
                            error: updateErr.message 
                        });
                    }
                    
                    console.log("✅ Товар обновлен, affectedRows:", updateResult.affectedRows);
                    
                    let imageUrl = '/uploads/products/default.jpg';
                    if (newImagePath) {
                        if (newImagePath.startsWith('http') || newImagePath.startsWith('/uploads/')) {
                            imageUrl = newImagePath;
                        } else {
                            imageUrl = `/uploads/products/${newImagePath}`;
                        }
                    }
                    
                    const responseData = {
                        message: "Товар обновлен",
                        affectedRows: updateResult.affectedRows,
                        imageUrl: imageUrl,
                        unit: unit || 'шт'
                    };
                    
                    console.log("📦 Ответ сервера:", responseData);
                    res.json(responseData);
                }
            );
        }
    );
});

// DELETE удаление товара
router.delete("/:id", verifyToken, isAdmin, (req, res) => {
    const productId = req.params.id;
    
    console.log("🗑️ Удаление товара ID:", productId);
    
    db.query(
        "SELECT image FROM products WHERE idproducts = ?",
        [productId],
        (err, result) => {
            if (err) {
                console.error("❌ Ошибка получения данных товара:", err);
                return res.status(500).json({ message: "Ошибка получения данных" });
            }
            
            if (result.length === 0) {
                return res.status(404).json({ message: "Товар не найден" });
            }
            
            const imageName = result[0].image;
            console.log("📷 Картинка товара для удаления:", imageName);
            
            if (imageName && imageName !== 'default.jpg' && !imageName.startsWith('http')) {
                const imagePath = path.join(__dirname, '../../frontend/uploads/products', imageName);
                console.log("📍 Путь к картинке:", imagePath);
                
                if (fs.existsSync(imagePath)) {
                    try {
                        fs.unlinkSync(imagePath);
                        console.log("✅ Картинка удалена:", imageName);
                    } catch (unlinkErr) {
                        console.log("⚠️ Не удалось удалить картинку:", unlinkErr.message);
                    }
                } else {
                    console.log("⚠️ Картинка не найдена по пути:", imagePath);
                }
            } else {
                console.log("ℹ️ Картинка не требует удаления (дефолтная или внешняя)");
            }
            
            db.query(
                "DELETE FROM products WHERE idproducts = ?",
                [productId],
                (deleteErr, deleteResult) => {
                    if (deleteErr) {
                        console.error("❌ Ошибка удаления товара:", deleteErr);
                        return res.status(500).json({ message: "Ошибка удаления" });
                    }
                    
                    console.log("✅ Товар удален, affectedRows:", deleteResult.affectedRows);
                    
                    if (deleteResult.affectedRows === 0) {
                        return res.status(404).json({ message: "Товар не найден" });
                    }
                    
                    res.json({ 
                        message: "Товар удален",
                        affectedRows: deleteResult.affectedRows 
                    });
                }
            );
        }
    );
});

module.exports = router;