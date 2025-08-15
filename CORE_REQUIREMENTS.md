# CORE REQUIREMENTS - MOVIE CATALOG UPC SCANNER

## CRITICAL INSTRUCTION - READ FIRST

**ANY AGENT WORKING ON THIS PROJECT MUST READ AND FOLLOW THESE REQUIREMENTS BEFORE MAKING ANY CHANGES.**

## Primary Objective
The user wants to scan a UPC code and add movie information to a local spreadsheet they choose. The application must work completely offline with local file access.

## Core UPC Scanning Requirements

### 1. NO UPC DATABASES
- **DO NOT** use UPC databases (upcitemdb.com, barcodelookup.com, etc.)
- **DO NOT** use APIs that require keys or authentication
- **DO NOT** implement fallbacks to UPC database services

### 2. USE PUBLIC SEARCH ENGINES
- **Search the UPC code** as a simple search term (like typing "12345678" into Google)
- **Get search results** that show what that UPC represents
- **Extract movie information** from those search results
- **Use multiple search engines** as fallbacks

### 3. Implementation Approach
```javascript
// ✅ CORRECT APPROACH - Search the UPC
fetch('https://www.google.com/search?q=12345678')
// or
fetch('https://www.bing.com/search?q=12345678')
// or
fetch('https://duckduckgo.com/?q=12345678')
```

### 4. What NOT to Do
```javascript
// ❌ WRONG - Direct scraping of e-commerce sites
fetch('https://www.amazon.com/s?k=12345678')
fetch('https://www.barcodelookup.com/12345678')
```

## Why This Approach Works
- **Search engines** are designed to be accessed by different origins
- **UPC searches** often return relevant product information
- **Less likely to be blocked** than direct e-commerce site scraping
- **More reliable** for getting basic product identification
- **UPC is just a search term** - search engines handle this naturally

## Data Requirements
- **Must extract actual movie information** (title, year, director, genre, etc.)
- **NO placeholder data** like "Unknown Movie" or UPC-based titles
- **If no movie data found**, return null and show user-friendly message
- **A UPC without movie information is useless** - don't add it to spreadsheet

## Technical Requirements
- **Local spreadsheet control** - user chooses the file
- **File System Access API** for local file operations
- **No external dependencies** on unreliable services
- **Graceful fallbacks** when searches fail
- **Clear user feedback** when UPC lookup fails

## File Locations
- **Current implementation**: `js/scanner-new.js`
- **Spreadsheet management**: `js/spreadsheet-manager.js`
- **Main app logic**: `js/app.js`
- **HTML structure**: `index.html`

## Previous Failed Approaches (DO NOT REPEAT)
1. **UPC database APIs** - blocked by CORS, require keys
2. **Direct e-commerce scraping** - blocked by anti-scraping measures
3. **CORS proxy services** - unreliable, often blocked
4. **Placeholder data generation** - creates useless entries

## Success Criteria
- User can scan a UPC
- Application searches public sources for that UPC
- Movie information is extracted and displayed
- Data is saved to user's chosen local spreadsheet
- No external API dependencies
- Works completely offline after initial setup

---

**REMEMBER**: The goal is to search the UPC code, not scrape specific websites. Search engines exist to be searched - use them for what they're designed for.
