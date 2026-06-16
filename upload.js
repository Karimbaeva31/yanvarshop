const multer = require('multer');
const path = require('path');
const fs = require('fs');
const projectRoot = path.resolve(__dirname, '..', '..'); 
const uploadsDir = path.join(projectRoot, 'frontend', 'uploads', 'products');

console.log('='.repeat(70));
console.log('📁 НАСТРОЙКА MULTER ДЛЯ ЗАГРУЗКИ КАРТИНОК');
console.log('📍 __dirname:', __dirname);
console.log('📍 Корень проекта:', projectRoot);
console.log('📍 Папка для картинок:', uploadsDir);
console.log('✅ Папка существует?', fs.existsSync(uploadsDir));

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📂 Создана папка:', uploadsDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('💾 Multer сохранит файл в:', uploadsDir);
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        console.log('📝 Новое имя файла:', uniqueName);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    if (allowedTypes.includes(file.mimetype)) {
        console.log('✅ Файл разрешен:', file.originalname, '(', file.mimetype, ')');
        cb(null, true);
    } else {
        console.log('❌ Файл отклонен:', file.originalname, '(', file.mimetype, ')');
        cb(new Error('Только изображения!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});

console.log('✅ Multer настроен');
console.log('='.repeat(70));

module.exports = upload;