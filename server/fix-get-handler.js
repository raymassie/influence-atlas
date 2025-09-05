const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

const getHandler = `// GET handler for UPC lookup endpoint - shows usage info
app.get('/api/lookup-upc', (req, res) => {
    res.json({
        error: 'This endpoint requires POST method',
        usage: 'Send POST request with JSON body containing upc field',
        example: 'Use the test page at movie-catalog/test-server-api.html',
        method: 'POST',
        contentType: 'application/json',
        bodyExample: { upc: '715515315616' }
    });
});

`;

// Insert before the POST handler
content = content.replace('app.post(\'/api/lookup-upc\',', getHandler + 'app.post(\'/api/lookup-upc\',');

fs.writeFileSync('server.js', content);
console.log('✅ Fixed server with GET handler');
