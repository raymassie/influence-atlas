# Movie Catalog - Requirements & Specifications

## 🎯 Core UPC Scanning Requirements

### What We DO Want:
- ✅ **Scan UPC codes** using device camera
- ✅ **Add movie information** to a **local spreadsheet** that the user chooses
- ✅ **Pull information from public sources** (not UPC databases)
- ✅ **Local data control** - user owns their data and chooses where to store it
- ✅ **Automatic movie lookup** using publicly available information

### What We DON'T Want:
- ❌ **NO UPC database lookups** - do not use external UPC databases like upcitemdb.com
- ❌ **NO dependency on third-party UPC services** that require API keys or have CORS restrictions
- ❌ **NO external data storage** that the user doesn't control

## 📊 Data Source Requirements

### Preferred Public Sources:
1. **Google Search** - Search for movie title + UPC to find product pages
2. **Amazon Product Pages** - Extract movie details from Amazon listings
3. **IMDB** - Get movie information from IMDB database
4. **Wikipedia** - Movie details and metadata
5. **Other Public Movie Databases** - Any publicly accessible movie information

### Data to Extract:
- Movie title
- Release year
- Director
- Genre
- Runtime
- Studio/Production company
- Format (DVD, Blu-ray, 4K, etc.)
- Any other publicly available metadata

## 🔧 Technical Implementation

### Spreadsheet Integration:
- User selects their own spreadsheet file
- Application reads/writes directly to user's chosen file
- No cloud dependencies unless user chooses them
- Support for CSV, Excel, and Google Sheets formats

### Error Handling:
- Graceful fallback when public sources are unavailable
- Clear user feedback about what information was found/not found
- Option for manual entry when automatic lookup fails

### Privacy & Control:
- All data stays local to user's chosen spreadsheet
- No data sent to external services without user consent
- User maintains full control over their movie collection data

## 📝 Development Notes

**Remember:** The goal is to create a tool that helps users catalog their movies by scanning UPC codes and pulling information from public sources, NOT from UPC databases. The user should be able to choose their own spreadsheet and have full control over their data.
