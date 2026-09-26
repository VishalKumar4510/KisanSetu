const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'backend', 'src', 'routes');
fs.readdirSync(routesDir).forEach(file => {
  if (!file.endsWith('.ts')) return;
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/);
    if (match) {
      console.log(`${file}:${idx + 1} ${match[1].toUpperCase()} ${match[2]}`);
    }
  });
});
