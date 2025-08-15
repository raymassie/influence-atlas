# Movie Catalog UPC Scanner Server

## 🎯 **Purpose**

This server solves the CORS issues that prevent the browser-based UPC scanner from getting real movie data. It runs locally and queries search engines directly without browser restrictions.

## 🚀 **Quick Start**

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Test the Server
```bash
curl http://localhost:3000/health
```

## 📡 **API Endpoints**

### **POST /api/lookup-upc**
Look up movie information by UPC code.

**Request:**
```json
{
  "upc": "715515315616"
}
```

**Response:**
```json
{
  "success": true,
  "upc": "715515315616",
  "title": "The Matrix (1999)",
  "year": 1999,
  "director": "",
  "genre": "Sci-Fi",
  "runtime": "",
  "studio": "Warner Bros.",
  "format": "DVD",
  "source": "Google Search",
  "searchEngine": "Google",
  "searchResults": [...]
}
```

### **GET /health**
Health check endpoint.

## 🔍 **How It Works**

1. **Receives UPC** from frontend
2. **Queries Multiple Search Engines**:
   - Google
   - Bing  
   - DuckDuckGo
3. **Parses HTML Responses** using Cheerio
4. **Validates Results** to filter out garbage data
5. **Scores Results** to find the best match
6. **Returns Clean Data** to frontend

## 🛡️ **Features**

- ✅ **No CORS Issues** - Server queries search engines directly
- ✅ **Multiple Search Engines** - Better coverage and reliability
- ✅ **Smart Result Filtering** - Eliminates JavaScript garbage
- ✅ **Fallback Support** - UPC pattern analysis when searches fail
- ✅ **Real Movie Data** - Actual titles, not generated ones
- ✅ **Local Operation** - Runs on your machine, no external dependencies

## 📁 **File Structure**

```
server/
├── package.json      # Dependencies and scripts
├── server.js         # Main server implementation
└── README.md         # This file
```

## 🔧 **Configuration**

### **Port**
Change the port in `server.js`:
```javascript
const PORT = 3000; // Change this if needed
```

### **Search Engines**
Add or remove search engines in the `lookup-upc` endpoint:
```javascript
const results = await Promise.allSettled([
    searchGoogle(upc),
    searchBing(upc),
    searchDuckDuckGo(upc)
    // Add more here
]);
```

## 🧪 **Testing**

### **Test with curl**
```bash
curl -X POST http://localhost:3000/api/lookup-upc \
  -H "Content-Type: application/json" \
  -d '{"upc": "715515315616"}'
```

### **Test with Browser**
Open `http://localhost:3000/health` in your browser.

## 🚨 **Troubleshooting**

### **Port Already in Use**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### **Dependencies Not Found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Search Engine Blocking**
The server uses realistic User-Agent headers, but search engines may still block requests. If this happens:
1. Check the server logs for error messages
2. The server will fall back to UPC pattern analysis
3. Consider implementing rate limiting or delays

## 🔄 **Development**

### **Auto-restart on Changes**
```bash
npm run dev
```

### **Logs**
The server logs all requests and search results to the console.

## 📋 **Requirements**

- Node.js 16+ 
- npm or yarn
- Internet connection (for search engine queries)

## 🎉 **Success Criteria**

- ✅ No CORS proxy dependencies
- ✅ Real movie data from UPC scans
- ✅ Reliable operation
- ✅ Offline functionality after setup
- ✅ Clean, meaningful results
