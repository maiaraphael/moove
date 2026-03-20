const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    if (!f.endsWith('.tsx') && !f.endsWith('.ts')) continue;
    let content = fs.readFileSync(full, 'utf8');
    // Fix pattern 1: '`${VITE_API_URL}/path' -> `${VITE_API_URL}/path`
    let fixed = content.replace(/'`(\$\{import\.meta\.env\.VITE_API_URL\}[^']*)'/g, '`$1`');
    // Fix pattern 2: ``${VITE_API_URL}...  -> `${VITE_API_URL}...  (remove extra leading backtick)
    fixed = fixed.replace(/``(\$\{import\.meta\.env\.VITE_API_URL\})/g, '`$1');
    if (fixed !== content) {
      fs.writeFileSync(full, fixed, 'utf8');
      console.log('Fixed:', full);
    }
  }
}
walk('client/src');
