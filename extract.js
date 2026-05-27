const fs = require('fs');

function checkPayloads() {
    const html = fs.readFileSync('public/admin.html', 'utf8');
    const lines = html.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('apiPost(') || line.includes('apiPostForm(') || line.includes('apiGet(') || line.includes('apiDelete(')) {
            console.log(`Line ${i+1}: ${line.trim()}`);
        }
    });
}

checkPayloads();
