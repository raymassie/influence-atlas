/**
 * Movie UPC Scanner Server - Real UPC Database Solution
 * Uses UPCitemdb API for actual product lookups
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Movie UPC Scanner',
        status: 'running',
        database: 'UPCitemdb API',
        limits: '100 requests per day'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// GET handler
app.get('/api/lookup-upc', (req, res) => {
    res.json({
        error: 'Use POST method',
        usage: 'Send POST with JSON body: {"upc": "your_upc_here"}'
    });
});

// Main UPC lookup endpoint
app.post('/api/lookup-upc', async (req, res) => {
    const { upc } = req.body;
    
    if (!upc) {
        return res.status(400).json({
            success: false,
            error: 'UPC code is required'
        });
    }

    console.log(`🔍 Looking up UPC: ${upc}`);

    try {
        // Query UPCitemdb API
        const response = await axios.get(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`, {
            headers: {
                'User-Agent': 'Movie-Catalog-Scanner/1.0'
            },
            timeout: 10000
        });

        if (response.data && response.data.items && response.data.items.length > 0) {
            const item = response.data.items[0];
            console.log(`✅ Found: ${item.title}`);

            // Extract movie-specific information
            const movieData = extractMovieInfo(item);
            
            return res.json({
                success: true,
                upc: upc,
                title: movieData.title,
                year: movieData.year,
                director: movieData.director,
                genre: movieData.genre,
                runtime: movieData.runtime,
                studio: movieData.studio,
                format: movieData.format,
                source: 'UPCitemdb',
                rawData: item // Include raw data for debugging
            });
        } else {
            console.log(`❌ No data found for UPC: ${upc}`);
            
            return res.json({
                success: false,
                upc: upc,
                error: 'UPC not found in database',
                message: 'This UPC may not exist or may not be a movie product'
            });
        }

    } catch (error) {
        console.error(`❌ API Error:`, error.message);
        
        return res.status(500).json({
            success: false,
            upc: upc,
            error: 'Database lookup failed',
            details: error.message
        });
    }
});

/**
 * Extract movie information from UPC database item
 */
function extractMovieInfo(item) {
    const title = item.title || 'Unknown Movie';
    const brand = item.brand || '';
    const category = item.category || '';
    const description = item.description || '';
    
    // Try to extract year from title
    const yearMatch = title.match(/\(?([0-9]{4})\)?/);
    const year = yearMatch ? parseInt(yearMatch[1]) : '';
    
    // Determine format from title/description
    let format = '';
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (titleLower.includes('4k') || titleLower.includes('ultra hd')) {
        format = '4K Ultra HD';
    } else if (titleLower.includes('blu-ray') || titleLower.includes('bluray')) {
        format = 'Blu-ray';
    } else if (titleLower.includes('dvd')) {
        format = 'DVD';
    } else if (titleLower.includes('digital')) {
        format = 'Digital';
    }
    
    // Try to identify studio from brand
    let studio = brand;
    if (!studio && titleLower.includes('criterion')) {
        studio = 'Criterion Collection';
    } else if (!studio && titleLower.includes('warner')) {
        studio = 'Warner Bros.';
    } else if (!studio && titleLower.includes('universal')) {
        studio = 'Universal Pictures';
    }
    
    // Clean up title (remove format info, years in parentheses, etc.)
    let cleanTitle = title
        .replace(/\s*\([^)]*\)$/g, '') // Remove parentheses at end
        .replace(/\s*(4K|Blu-ray|BluRay|DVD|Digital).*$/i, '') // Remove format info
        .replace(/\s*-\s*(4K|Blu-ray|BluRay|DVD|Digital).*$/i, '') // Remove format after dash
        .trim();
    
    return {
        title: cleanTitle,
        year: year,
        director: '', // Not available in UPC database
        genre: category,
        runtime: '', // Not available in UPC database
        studio: studio,
        format: format
    };
}

app.listen(PORT, () => {
    console.log(`🚀 Movie UPC Scanner running on http://localhost:${PORT}`);
    console.log(`🔍 Using UPCitemdb API for product lookups`);
    console.log(`📊 Rate limit: 100 requests per day`);
});