const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir);

console.log("Проверка файлов маршрутов:");
files.forEach(file => {
    if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
        const hasExport = content.includes('module.exports = router');
        console.log(`${file}: ${hasExport ? '✅ OK' : '❌ НЕТ module.exports'}`);
    }
});