const fs = require('fs');
const path = require('path');
const minify = require('html-minifier').minify;

const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    try {
        const minified = minify(content, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
            removeEmptyAttributes: true,
            removeRedundantAttributes: true
        });
        fs.writeFileSync(filePath, minified, 'utf8');
        console.log(`Minified: ${file}`);
    } catch (err) {
        console.error(`Error minifying ${file}:`, err);
    }
}
console.log('HTML Minification complete.');
