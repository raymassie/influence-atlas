const fs = require('fs');

// Read the current server file
let content = fs.readFileSync('server.js', 'utf8');

// Replace the search functions with improved versions that include movie-specific terms
const improvements = [
    {
        old: 'const response = await axios.get(`https://www.google.com/search?q=${upc}`,',
        new: 'const searchQuery = `"${upc}" movie film "blu-ray" "dvd" "criterion collection" "studio"`;\n        const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,',
    },
    {
        old: 'const response = await axios.get(`https://www.bing.com/search?q=${upc}`,',
        new: 'const searchQuery = `"${upc}" movie film "blu-ray" "dvd" "criterion collection" "studio"`;\n        const response = await axios.get(`https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`,',
    },
    {
        old: 'const response = await axios.get(`https://duckduckgo.com/?q=${upc}`,',
        new: 'const searchQuery = `"${upc}" movie film "blu-ray" "dvd" "criterion collection" "studio"`;\n        const response = await axios.get(`https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`,',
    }
];

// Apply improvements
improvements.forEach(improvement => {
    content = content.replace(improvement.old, improvement.new);
});

// Write back the improved server
fs.writeFileSync('server.js', content);

console.log('✅ Improved search strategy with movie-specific terms');
console.log('🔍 Now searches for: "UPC" movie film "blu-ray" "dvd" "criterion collection" "studio"');
