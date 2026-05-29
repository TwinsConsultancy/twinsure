const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const preconnectTags = `
    <!-- Performance Optimization: Preconnect to Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
`;

for (const file of htmlFiles) {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let modified = false;

    // 1. Add preconnect to Google Fonts if not already there
    if (content.includes('fonts.googleapis.com') && !content.includes('rel="preconnect" href="https://fonts.googleapis.com"')) {
        content = content.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/, match => preconnectTags + match);
        modified = true;
    }

    // 2. Defer scripts
    const scriptRegex = /<script\s+src="([^"]+)">/g;
    content = content.replace(scriptRegex, (match, src) => {
        if (!match.includes('defer')) {
            modified = true;
            return `<script defer src="${src}">`;
        }
        return match;
    });

    // 3. Update CSS links to .min.css
    const cssRegex = /<link\s+rel="stylesheet"\s+href="css\/([^"]+)\.css">/g;
    content = content.replace(cssRegex, (match, name) => {
        if (!name.endsWith('.min')) {
            modified = true;
            return `<link rel="stylesheet" href="css/${name}.min.css">`;
        }
        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Optimized: ${file}`);
    }
}
console.log('Optimization complete.');
