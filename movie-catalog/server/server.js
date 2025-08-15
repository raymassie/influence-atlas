const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        service: 'Movie UPC Scanner',
        version: '1.0',
        status: 'running',
        database: 'UPCitemdb API',
        releaseDate: '2025-01-27'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/lookup-upc', (req, res) => {
    res.json({ error: 'Use POST method', usage: 'Send POST with {"upc": "your_upc"}' });
});

app.post('/api/lookup-upc', async (req, res) => {
    const { upc } = req.body;
    if (!upc) return res.status(400).json({ success: false, error: 'UPC required' });
    
    console.log('Looking up UPC:', upc);
    
    try {
        const response = await axios.get('https://api.upcitemdb.com/prod/trial/lookup?upc=' + upc, {
            headers: { 'User-Agent': 'Movie-Catalog-Scanner/1.0' },
            timeout: 10000
        });
        
        if (response.data && response.data.items && response.data.items.length > 0) {
            const item = response.data.items[0];
            console.log('Found:', item.title);
            
            return res.json({
                success: true,
                upc: upc,
                title: item.title,
                year: extractYear(item.title),
                director: '',
                genre: item.category || '',
                runtime: '',
                studio: item.brand || '',
                format: extractFormat(item.title),
                source: 'UPCitemdb'
            });
        } else {
            console.log('No data found for UPC:', upc);
            return res.json({
                success: false,
                upc: upc,
                error: 'UPC not found in database'
            });
        }
    } catch (error) {
        console.error('API Error:', error.message);
        return res.status(500).json({
            success: false,
            upc: upc,
            error: 'Database lookup failed',
            details: error.message
        });
    }
});

function extractYear(title) {
    const match = title.match(/\(?([0-9]{4})\)?/);
    return match ? parseInt(match[1]) : '';
}

function extractFormat(title) {
    const lower = title.toLowerCase();
    if (lower.includes('4k') || lower.includes('ultra hd')) return '4K Ultra HD';
    if (lower.includes('blu-ray') || lower.includes('bluray')) return 'Blu-ray';
    if (lower.includes('dvd')) return 'DVD';
    return '';
}

app.listen(PORT, () => {
    console.log('Movie UPC Scanner running on http://localhost:' + PORT);
    console.log('Using UPCitemdb API for lookups');
});
