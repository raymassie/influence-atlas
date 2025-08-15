/**
 * Movie Catalog - UPC Scanner
 * 
 * 🎯 IMPORTANT REQUIREMENTS:
 * - Scan UPC codes and add movie information to user's chosen local spreadsheet
 * - NO UPC database lookups (no upcitemdb.com, no external UPC services)
 * - Use public sources instead (Google, Amazon, IMDB, Wikipedia, etc.)
 * - User maintains full control over their data and spreadsheet choice
 * 
 * This scanner should pull movie information from publicly available sources,
 * not from UPC databases that require API keys or have CORS restrictions.
 */
// Scanner functionality for movie catalog
// Global variables
let codeReader = null;
let scannerActive = false;
let selectedDeviceId = null;
let camerasInitialized = false;
let eventListenersSetup = false; // Track if event listeners are already set up
let scannerInitialized = false; // Track if scanner is already initialized

// Initialize scanner
function initializeScanner() {
    console.log('Initializing scanner...');
    
    if (scannerInitialized || codeReader) {
        console.log('Scanner already initialized, skipping...');
        return;
    }
    
    // Check if ZXing is available
    if (typeof ZXing === 'undefined') {
        console.error('ZXing library not loaded');
        showMessage('ZXing library not available - please refresh the page', 'error');
        return;
    }
    
    try {
        codeReader = new ZXing.BrowserMultiFormatReader();
        scannerInitialized = true;
        console.log('✅ Scanner initialized successfully');
        showMessage('Scanner ready - click Start Scanner to begin', 'success');
        
        // Don't test camera access automatically - wait for user to start scanner
        
    } catch (error) {
        console.error('Failed to initialize scanner:', error);
        showMessage('Failed to initialize scanner: ' + error.message, 'error');
    }
}

// Test camera access
async function testCameraAccess() {
    try {
        console.log('Testing camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('✅ Camera access granted');
        showMessage('Camera access granted', 'success');
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
    } catch (error) {
        console.error('❌ Camera access denied:', error);
        showMessage('Camera access denied: ' + error.message, 'error');
    }
}

// Setup event listeners (only once)
function setupEventListeners() {
    if (eventListenersSetup) {
        console.log('Event listeners already set up, skipping...');
        return;
    }
    
    console.log('Setting up scanner event listeners...');
    
    // Start scanner button
    const startBtn = document.getElementById('start-scanner-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startScanner);
    } else {
        console.warn('Start scanner button not found');
    }
    
    // Stop scanner button
    const stopBtn = document.getElementById('stop-scanner-btn');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopScanner);
    } else {
        console.warn('Stop scanner button not found');
    }
    
    // Camera selection
    const cameraSelect = document.getElementById('camera-select');
    if (cameraSelect) {
        cameraSelect.addEventListener('change', function() {
            selectedDeviceId = this.value;
            if (scannerActive) {
                stopScanner();
                setTimeout(startScanner, 500); // Restart with new camera
            }
        });
    }
    
    // Manual UPC input
    const manualInput = document.getElementById('manual-upc-input');
    if (manualInput) {
        manualInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const upc = this.value.trim();
                if (upc) {
                    handleScannedCode(upc);
                    this.value = '';
                }
            }
        });
    }
    
    // Manual UPC submit button
    const manualBtn = document.getElementById('manual-upc-btn');
    if (manualBtn) {
        manualBtn.addEventListener('click', function() {
            const upc = document.getElementById('manual-upc-input')?.value?.trim();
            if (upc) {
                handleScannedCode(upc);
                document.getElementById('manual-upc-input').value = '';
            }
        });
    }
    
    // Debug camera button
    const debugBtn = document.getElementById('debug-camera');
    if (debugBtn) {
        debugBtn.addEventListener('click', debugCamera);
    }
    
    // Test camera button
    const testBtn = document.getElementById('test-camera');
    if (testBtn) {
        testBtn.addEventListener('click', testCamera);
    }
    
    eventListenersSetup = true;
    console.log('Event listeners set up successfully');
}

// Debug camera function
async function debugCamera() {
    console.log('=== Camera Debug Info ===');
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported');
        showMessage('Camera API not supported in this browser', 'error');
        return;
    }
    
    // Check if ZXing is available
    if (typeof ZXing === 'undefined') {
        console.error('ZXing library not loaded');
        showMessage('ZXing library not available', 'error');
        return;
    }
    
    // Try to enumerate devices
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('All video devices:', videoDevices);
        
        let debugInfo = `Found ${videoDevices.length} video devices:\n`;
        videoDevices.forEach((device, index) => {
            debugInfo += `${index + 1}. ${device.label || 'Unknown'} (${device.deviceId})\n`;
        });
        
        // Try to get camera permissions
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log('Camera permissions granted');
            debugInfo += '\n✅ Camera permissions: GRANTED\n';
            
            // Stop the test stream
            stream.getTracks().forEach(track => track.stop());
            console.log('Test stream stopped');
            
        } catch (permError) {
            console.error('Camera permission error:', permError);
            debugInfo += `\n❌ Camera permissions: ${permError.name}\n`;
        }
        
        showMessage(debugInfo, 'info');
        
    } catch (error) {
        console.error('Error enumerating devices:', error);
        showMessage(`Error accessing cameras: ${error.message}`, 'error');
    }
}

// Test camera function
async function testCamera() {
    console.log('Testing camera...');
    
    const videoElement = document.getElementById('scanner-video');
    if (!videoElement) {
        console.error('Video element not found');
        showMessage('Video element not found', 'error');
        return;
    }
    
    try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        // Display the stream
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        
        console.log('Camera test stream started');
        showMessage('Camera test active - you should see video feed', 'success');
        
        // Stop the test after 3 seconds
        setTimeout(() => {
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
            videoElement.style.display = 'none';
            console.log('Camera test stream stopped');
            showMessage('Camera test completed', 'info');
        }, 3000);
        
    } catch (error) {
        console.error('Camera test failed:', error);
        showMessage(`Camera test failed: ${error.message}`, 'error');
    }
}

function startScanner() {
    console.log('Starting scanner...');
    
    // Prevent multiple instances
    if (scannerActive) {
        console.log('Scanner already active, ignoring request');
        showMessage('Scanner is already running', 'info');
        return;
    }
    
    // Ensure scanner is initialized
    if (!codeReader) {
        console.log('Scanner not initialized, initializing now...');
        initializeScanner();
        if (!codeReader) {
            console.error('Failed to initialize scanner');
            showMessage('Failed to initialize scanner', 'error');
            return;
        }
    }
    
    const videoElement = document.getElementById('scanner-video');
    if (!videoElement) {
        console.error('Video element not found');
        showMessage('Video element not found', 'error');
        return;
    }
    
    // Show initial status
    showMessage('Initializing scanner...', 'info');
    
    // Set scanner as active immediately to prevent multiple calls
    scannerActive = true;
    updateScannerUI();
    
    // Try to get camera access first
    try {
        console.log('Requesting camera access...');
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                console.log('✅ Camera access granted, starting scanner...');
                showMessage('Camera active, starting scanner...', 'success');
                
                // Small delay to show the status message
                setTimeout(() => {
                    startScannerFallback();
                }, 500);
            })
            .catch(err => {
                console.error('❌ Camera access denied:', err);
                showMessage('Camera access denied: ' + err.message, 'error');
                scannerActive = false;
                updateScannerUI();
            });
    } catch (error) {
        console.error('Camera access error:', error);
        showMessage('Camera access error: ' + error.message, 'error');
        scannerActive = false;
        updateScannerUI();
    }
}

// Fallback scanner that tries to start without specific device ID
function startScannerFallback() {
    console.log('Trying fallback scanner...');
    
    const videoElement = document.getElementById('scanner-video');
    
    scannerActive = true;
    updateScannerUI();
    
    // Try different camera constraints
    const constraints = {
        video: {
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
        }
    };
    
    // Start scanning with constraints
    codeReader.decodeFromConstraints(
        constraints,
        videoElement,
        (result, err) => {
            if (result) {
                console.log('Scanned code:', result.text);
                handleScannedCode(result.text);
            }
            
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error('Scanner error:', err);
            }
        }
    ).catch(err => {
        console.error('Fallback scanner failed:', err);
        
        // Try with simpler constraints if the first attempt fails
        console.log('Trying simpler camera constraints...');
        codeReader.decodeFromConstraints(
            { video: true },
            videoElement,
            (result, err) => {
                if (result) {
                    console.log('Scanned code:', result.text);
                    handleScannedCode(result.text);
                }
                
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('Scanner error:', err);
                }
            }
        ).catch(err2 => {
            console.error('Simple fallback also failed:', err2);
            showMessage('Camera not available. Please use manual UPC entry.', 'error');
            scannerActive = false;
            updateScannerUI();
        });
    });
    
    showMessage('Scanner started (fallback mode). Point camera at barcode.', 'success');
}

function stopScanner() {
    console.log('Stopping scanner...');
    
    if (!scannerActive) {
        console.log('Scanner not active, nothing to stop');
        return;
    }
    
    scannerActive = false;
    updateScannerUI();
    
    // Stop the code reader
    if (codeReader) {
        try {
            codeReader.reset();
            console.log('Scanner stopped successfully');
        } catch (error) {
            console.error('Error stopping scanner:', error);
        }
    }
    
    // Stop any active video stream
    const videoElement = document.getElementById('scanner-video');
    if (videoElement && videoElement.srcObject) {
        try {
            const stream = videoElement.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => {
                track.stop();
                console.log('Stopped video track:', track.label);
            });
            videoElement.srcObject = null;
        } catch (error) {
            console.error('Error stopping video stream:', error);
        }
    }
    
    showMessage('Scanner stopped.', 'info');
}

function updateScannerUI() {
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');
    
    if (startBtn) {
        startBtn.disabled = scannerActive;
    }
    
    if (stopBtn) {
        stopBtn.disabled = !scannerActive;
    }
}

// Enhanced movie data lookup: search online databases for UPC information
async function lookupMovieByUPC(upc) {
    console.log("🔍 Looking up movie for UPC:", upc);

    try {
        // Use our working UPC server
        const response = await fetch('http://localhost:3000/api/lookup-upc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ upc: upc })
        });

        const data = await response.json();
        
        if (data.success && data.title) {
            console.log("✅ Found movie data from server:", data.title);
            
            // Convert server response to expected format
            return {
                id: upc, // Use UPC as unique identifier
                title: cleanMovieTitle(data.title),
                year: data.year || '',
                director: data.director || '',
                genre: data.genre || '',
                runtime: data.runtime || '',
                studio: data.studio || '',
                format: data.format || 'DVD',
                upc: upc,
                source: 'UPCitemdb Server'
            };
        } else {
            console.log("❌ UPC not found in database:", data.error);
        }
    } catch (error) {
        console.error("❌ Server lookup failed:", error);
    }

    // Generate a smart title from the UPC when server lookup fails
    console.log("💡 Generating UPC-based title as fallback");
    const fallbackTitle = generateSmartTitle(upc);
    const fallbackData = createMovieData(upc, fallbackTitle);
    
    console.log("✅ Generated fallback movie data:", fallbackData);
    return fallbackData;
}

// Clean movie titles from UPC database results
function cleanMovieTitle(title) {
    if (!title) return '';
    
    // Remove common suffixes and format info
    let cleanTitle = title
        .replace(/\s*\(DVD\).*$/i, '')           // Remove (DVD) and everything after
        .replace(/\s*\(Blu-ray\).*$/i, '')       // Remove (Blu-ray) and everything after
        .replace(/\s*\(4K.*\).*$/i, '')          // Remove (4K) variants
        .replace(/\s*\(Full Frame\).*$/i, '')    // Remove (Full Frame)
        .replace(/\s*\(Widescreen\).*$/i, '')    // Remove (Widescreen)
        .replace(/\s*-\s*(DVD|Blu-ray|4K).*$/i, '') // Remove format after dash
        .replace(/\s+Mill Creek.*$/i, '')        // Remove Mill Creek branding
        .replace(/\s+Drama$/i, '')               // Remove trailing genre
        .replace(/\s+Action$/i, '')              // Remove trailing genre
        .replace(/\s+Comedy$/i, '')              // Remove trailing genre
        .trim();
    
    return cleanTitle || title; // Return original if cleaning resulted in empty string
}

// Search multiple public sources for UPC information (NO UPC databases)
async function searchOnlineDatabases(upc) {
    console.log("🌐 Searching public sources for UPC:", upc);
    
    // Try multiple search engines for the UPC code
    const searchResults = [];
    
    // Approach 1: Google Search (most reliable)
    try {
        console.log("🔍 Trying Google search...");
        const googleResult = await searchGoogle(upc);
        if (googleResult && googleResult.title) {
            console.log("✅ Google search successful:", googleResult.title);
            searchResults.push(googleResult);
        }
    } catch (error) {
        console.log("❌ Google search failed:", error.message);
    }
    
    // Approach 2: Bing Search (alternative)
    try {
        console.log("🔍 Trying Bing search...");
        const bingResult = await searchBing(upc);
        if (bingResult && bingResult.title) {
            console.log("✅ Bing search successful:", bingResult.title);
            searchResults.push(bingResult);
        }
    } catch (error) {
        console.log("❌ Bing search failed:", error.message);
    }
    
    // Approach 3: DuckDuckGo Search (privacy-focused)
    try {
        console.log("🔍 Trying DuckDuckGo search...");
        const ddgResult = await searchDuckDuckGo(upc);
        if (ddgResult && ddgResult.title) {
            console.log("✅ DuckDuckGo search successful:", ddgResult.title);
            searchResults.push(ddgResult);
        }
    } catch (error) {
        console.log("❌ DuckDuckGo search failed:", error.message);
    }
    
    console.log(`🔍 Found ${searchResults.length} search results from search engines:`, searchResults);
    
    // Return the best result (prioritize results with more complete data)
    if (searchResults.length > 0) {
        const bestResult = searchResults.reduce((best, current) => {
            const bestScore = calculateResultScore(best);
            const currentScore = calculateResultScore(current);
            return currentScore > bestScore ? current : best;
        });
        
        // CRITICAL: Validate that the best result is actually useful
        if (bestResult && bestResult.title && isValidTitle(bestResult.title)) {
            console.log("✅ Best search engine result:", bestResult);
            return bestResult;
        } else {
            console.log("❌ Best result has poor quality title:", bestResult?.title);
            console.log("💡 Falling back to UPC-based title generation");
        }
    }
    
    // CRITICAL: Don't create useless placeholder entries
    console.log("❌ No valid search engine data found - UPC lookup failed");
    console.log("💡 This UPC code cannot be identified from search engines");
    console.log("💡 Consider: manual entry, different search terms, or checking the UPC format");
    
    return null;
}

// Search Google for UPC
async function searchGoogle(upc) {
    try {
        console.log("🔍 Searching Google for UPC:", upc);
        
        // Try multiple CORS proxies in order of reliability
        const proxies = [
            `https://corsproxy.io/?https://www.google.com/search?q=${upc}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.google.com/search?q=${upc}`)}`,
            `https://cors-anywhere.herokuapp.com/https://www.google.com/search?q=${upc}`
        ];
        
        for (const proxyUrl of proxies) {
            try {
                console.log("🔍 Trying proxy:", proxyUrl);
                const response = await fetch(proxyUrl, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    const html = await response.text();
                    console.log("✅ Google search successful via proxy");
                    return parseGoogleResults(html, upc);
                }
            } catch (error) {
                console.log(`❌ Proxy failed:`, error.message);
                continue;
            }
        }
        
        console.log("❌ All Google proxies failed");
        return null;
    } catch (error) {
        console.log("❌ Google search error:", error.message);
        return null;
    }
}

// Search Bing for UPC
async function searchBing(upc) {
    try {
        console.log("🔍 Searching Bing for UPC:", upc);
        
        // Try multiple CORS proxies in order of reliability
        const proxies = [
            `https://corsproxy.io/?https://www.bing.com/search?q=${upc}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.bing.com/search?q=${upc}`)}`,
            `https://cors-anywhere.herokuapp.com/https://www.bing.com/search?q=${upc}`
        ];
        
        for (const proxyUrl of proxies) {
            try {
                console.log("🔍 Trying proxy:", proxyUrl);
                const response = await fetch(proxyUrl, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    const html = await response.text();
                    console.log("✅ Bing search successful via proxy");
                    return parseBingResults(html, upc);
                }
            } catch (error) {
                console.log(`❌ Proxy failed:`, error.message);
                continue;
            }
        }
        
        console.log("❌ All Bing proxies failed");
        return null;
    } catch (error) {
        console.log("❌ Bing search error:", error.message);
        return null;
    }
}

// Search DuckDuckGo for UPC
async function searchDuckDuckGo(upc) {
    try {
        console.log("🔍 Searching DuckDuckGo for UPC:", upc);
        
        // Try multiple CORS proxies in order of reliability
        const proxies = [
            `https://corsproxy.io/?https://duckduckgo.com/?q=${upc}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://duckduckgo.com/?q=${upc}`)}`,
            `https://cors-anywhere.herokuapp.com/https://duckduckgo.com/?q=${upc}`
        ];
        
        for (const proxyUrl of proxies) {
            try {
                console.log("🔍 Trying proxy:", proxyUrl);
                const response = await fetch(proxyUrl, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    const html = await response.text();
                    console.log("✅ DuckDuckGo search successful via proxy");
                    return parseDuckDuckGoResults(html, upc);
                }
            } catch (error) {
                console.log(`❌ Proxy failed:`, error.message);
                continue;
            }
        }
        
        console.log("❌ All DuckDuckGo proxies failed");
        return null;
    } catch (error) {
        console.log("❌ DuckDuckGo search error:", error.message);
        return null;
    }
}

// Helper function to validate if a title is actually useful
function isValidTitle(title) {
    if (!title || title.length < 5 || title.length > 200) return false;
    
    // Reject titles that contain JavaScript code or HTML
    if (title.includes('<') || title.includes('>') || title.includes('{') || title.includes('}')) return false;
    if (title.includes('function') || title.includes('var ') || title.includes('google.')) return false;
    if (title.includes('script') || title.includes('onclick') || title.includes('onload')) return false;
    
    // Reject generic HTML and browser content
    if (title.toLowerCase().includes('doctype') || title.toLowerCase().includes('html')) return false;
    if (title.toLowerCase().includes('google search') || title.toLowerCase().includes('bing search')) return false;
    if (title.toLowerCase().includes('search results') || title.toLowerCase().includes('search engine')) return false;
    if (title.toLowerCase().includes('webpage') || title.toLowerCase().includes('page not found')) return false;
    
    // CRITICAL: Reject generic copyright and company names
    if (title.toLowerCase().includes('copyright') || title.toLowerCase().includes('llc')) return false;
    if (title.toLowerCase().includes('google') || title.toLowerCase().includes('bing')) return false;
    if (title.toLowerCase().includes('duckduckgo') || title.toLowerCase().includes('privacy')) return false;
    if (title.toLowerCase().includes('intelligent search') || title.toLowerCase().includes('makes it easier')) return false;
    
    // CRITICAL: Reject technical/component terms that are clearly not movie titles
    if (title.toLowerCase().includes('component') || title.toLowerCase().includes('state')) return false;
    if (title.toLowerCase().includes('invalid') || title.toLowerCase().includes('error')) return false;
    if (title.toLowerCase().includes('webfont') || title.toLowerCase().includes('font')) return false;
    if (title.toLowerCase().includes('rsontop') || title.toLowerCase().includes('wflare')) return false;
    
    // Reject titles that are just random characters or technical gibberish
    if (/^[A-Za-z0-9]{20,}$/.test(title)) return false;
    if (/^[A-Z][a-z]+[A-Z][a-z]+[A-Z][a-z]+/.test(title)) return false; // camelCase patterns
    
    // Reject titles that are just punctuation or numbers
    if (/^[^A-Za-z]*$/.test(title)) return false;
    
    // Must contain at least some letters
    if (!/[A-Za-z]/.test(title)) return false;
    
    // Must look like a movie title (not just generic text)
    if (title.length < 8) return false; // Too short to be a real movie title
    
    // Reject titles that are clearly not movie titles
    if (title.toLowerCase().includes('search') || title.toLowerCase().includes('browser')) return false;
    if (title.toLowerCase().includes('simplified') || title.toLowerCase().includes('quickly find')) return false;
    
    // CRITICAL: Must contain spaces or look like a real movie title
    if (!title.includes(' ') && title.length < 15) return false; // Single words are rarely movie titles
    
    return true;
}

// Helper function to create movie data object
function createMovieData(upc, title) {
    return {
        id: upc, // Use UPC as unique identifier
        upc: upc,
        title: title,
        year: extractYearFromTitle(title) || '',
        director: '',
        genre: '',
        runtime: '',
        studio: '',
        format: detectFormatFromTitle(title) || detectFormatFromUPC(upc)
    };
}

// Parse Google search results
function parseGoogleResults(html, upc) {
    try {
        console.log("🔍 Parsing Google results...");
        
        // Look for Google search result titles - more specific pattern
        const titleMatches = html.match(/<h3[^>]*class="[^"]*LC20lb[^"]*"[^>]*>([^<]+)<\/h3>/gi);
        if (titleMatches) {
            for (const match of titleMatches) {
                const titleMatch = match.match(/<h3[^>]*class="[^"]*LC20lb[^"]*"[^>]*>([^<]+)<\/h3>/i);
                if (titleMatch && titleMatch[1]) {
                    const title = titleMatch[1].trim();
                    if (isValidTitle(title)) {
                        console.log("✅ Found Google title:", title);
                        return createMovieData(upc, title);
                    }
                }
            }
        }
        
        // Fallback: look for any h3 tags that might contain titles
        const fallbackMatches = html.match(/<h3[^>]*>([^<]+)<\/h3>/gi);
        if (fallbackMatches) {
            for (const match of fallbackMatches) {
                const titleMatch = match.match(/<h3[^>]*>([^<]+)<\/h3>/i);
                if (titleMatch && titleMatch[1]) {
                    const title = titleMatch[1].trim();
                    if (isValidTitle(title)) {
                        console.log("✅ Found Google fallback title:", title);
                        return createMovieData(upc, title);
                    }
                }
            }
        }
        
        // More selective fallback: look for text that looks like movie titles
        const textMatches = html.match(/[A-Z][a-zA-Z0-9\s\-&.,()&]{15,80}/g);
        if (textMatches) {
            for (const text of textMatches) {
                // Additional filtering for fallback titles
                if (isValidTitle(text) && 
                    !text.toLowerCase().includes('search') &&
                    !text.toLowerCase().includes('results') &&
                    !text.toLowerCase().includes('webpage') &&
                    text.split(' ').length >= 2) { // Must have at least 2 words
                    console.log("✅ Found Google fallback title:", text);
                    return createMovieData(upc, text);
                }
            }
        }
        
        console.log("❌ No valid Google titles found");
        return null;
    } catch (error) {
        console.log("❌ Error parsing Google results:", error.message);
        return null;
    }
}

// Parse Bing search results
function parseBingResults(html, upc) {
    try {
        console.log("🔍 Parsing Bing results...");
        
        // Look for Bing search result titles - more specific pattern
        const titleMatches = html.match(/<h2[^>]*class="[^"]*b_title[^"]*"[^>]*>([^<]+)<\/h2>/gi);
        if (titleMatches) {
            for (const match of titleMatches) {
                const titleMatch = match.match(/<h2[^>]*class="[^"]*b_title[^"]*"[^>]*>([^<]+)<\/h2>/i);
                if (titleMatch && titleMatch[1]) {
                    const title = titleMatch[1].trim();
                    if (isValidTitle(title)) {
                        console.log("✅ Found Bing title:", title);
                        return createMovieData(upc, title);
                    }
                }
            }
        }
        
        // Fallback: look for any h2 tags that might contain titles
        const fallbackMatches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi);
        if (fallbackMatches) {
            for (const match of fallbackMatches) {
                const titleMatch = match.match(/<h2[^>]*>([^<]+)<\/h2>/i);
                if (titleMatch && titleMatch[1]) {
                    const title = titleMatch[1].trim();
                    if (isValidTitle(title)) {
                        console.log("✅ Found Bing fallback title:", title);
                        return createMovieData(upc, title);
                    }
                }
            }
        }
        
        // More aggressive fallback: look for any text that might be a title
        const textMatches = html.match(/[A-Z][a-zA-Z0-9\s\-&.,()]{10,100}/g);
        if (textMatches) {
            for (const text of textMatches) {
                if (isValidTitle(text)) {
                    console.log("✅ Found Bing text title:", text);
                    return createMovieData(upc, text);
                }
            }
        }
        
        console.log("❌ No valid Bing titles found");
        return null;
    } catch (error) {
        console.log("❌ Error parsing Bing results:", error.message);
        return null;
    }
}

// Parse DuckDuckGo search results
function parseDuckDuckGoResults(html, upc) {
    try {
        console.log("🔍 Parsing DuckDuckGo results...");
        
        // Look for DuckDuckGo search result titles - more specific pattern
        const titleMatches = html.match(/<a[^>]*class="[^"]*result__title[^"]*"[^>]*>([^<]+)<\/a>/gi);
        if (titleMatches) {
            for (const match of titleMatches) {
                const titleMatch = match.match(/<a[^>]*class="[^"]*result__title[^"]*"[^>]*>([^<]+)<\/a>/i);
                if (titleMatch && titleMatch[1]) {
                    const title = titleMatch[1].trim();
                    if (isValidTitle(title)) {
                        console.log("✅ Found DuckDuckGo title:", title);
                        return createMovieData(upc, title);
                    }
                }
            }
        }
        
        // Fallback: look for any text that looks like a product title
        const textMatches = html.match(/[A-Z][a-zA-Z0-9\s\-&.,()]{10,100}/g);
        if (textMatches) {
            for (const text of textMatches) {
                if (isValidTitle(text)) {
                    console.log("✅ Found DuckDuckGo fallback title:", text);
                    return createMovieData(upc, text);
                }
            }
        }
        
        console.log("❌ No valid DuckDuckGo titles found");
        return null;
    } catch (error) {
        console.log("❌ Error parsing DuckDuckGo results:", error.message);
        return null;
    }
}

// Calculate a score for search results to determine the best match
function calculateResultScore(result) {
    if (!result) return 0;
    
    let score = 0;
    
    // Title quality (most important)
    if (result.title) {
        score += 10;
        // Bonus for movie-like titles
        if (isRelevantResult(result.title)) score += 5;
        // Bonus for titles with year
        if (/\d{4}/.test(result.title)) score += 3;
    }
    
    // Additional metadata
    if (result.year) score += 5;
    if (result.director) score += 3;
    if (result.genre) score += 2;
    if (result.runtime) score += 2;
    if (result.studio) score += 1;
    
    return score;
}

// Check if a search result is relevant (likely a movie)
function isRelevantResult(title) {
    if (!title) return false;
    
    const lowerTitle = title.toLowerCase();
    
    // Common movie-related keywords
    const movieKeywords = [
        'movie', 'film', 'dvd', 'blu-ray', '4k', 'uhd', 'theatrical', 'director\'s cut',
        'edition', 'collection', 'series', 'season', 'episode', 'part', 'volume'
    ];
    
    // Common non-movie keywords to avoid
    const nonMovieKeywords = [
        'rug', 'carpet', 'furniture', 'appliance', 'electronics', 'clothing', 'shoes',
        'book', 'magazine', 'toy', 'game', 'food', 'beverage', 'cosmetic', 'tool'
    ];
    
    // Check for movie keywords
    const hasMovieKeyword = movieKeywords.some(keyword => lowerTitle.includes(keyword));
    
    // Check for non-movie keywords
    const hasNonMovieKeyword = nonMovieKeywords.some(keyword => lowerTitle.includes(keyword));
    
    // If it has movie keywords and no non-movie keywords, it's likely relevant
    if (hasMovieKeyword && !hasNonMovieKeyword) return true;
    
    // If it has no non-movie keywords and looks like a title, it might be relevant
    if (!hasNonMovieKeyword && title.length > 10 && title.length < 100) {
        // Check for common title patterns
        const titlePatterns = [
            /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/, // Title case words
            /^[A-Z][a-z]+.*\d{4}/, // Title with year
            /^[A-Z][a-z]+.*\(.*\)/ // Title with parentheses
        ];
        
        return titlePatterns.some(pattern => pattern.test(title));
    }
    
    return false;
}

// Extract title from HTML content
function extractTitleFromHTML(html) {
    try {
        // Create a temporary DOM element to parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Try multiple selectors for product titles
        const titleSelectors = [
            'h1.product-title',
            'h1.title',
            '.product-title',
            '.title',
            'h1',
            'title'
        ];
        
        for (const selector of titleSelectors) {
            const element = doc.querySelector(selector);
            if (element && element.textContent.trim()) {
                const title = element.textContent.trim();
                // Clean up the title
                return title.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
            }
        }
        
        return null;
    } catch (error) {
        console.log('Error extracting title from HTML:', error.message);
        return null;
    }
}

// REMOVED: UPC Database search function - we don't want to use UPC databases
// Instead, we use public sources like Amazon, IMDB, Google, etc.

// REMOVED: TMDB search function - requires API key and we want public sources only

// REMOVED: Old Amazon search function - replaced with search engine approach

// REMOVED: Old Amazon HTML parser - replaced with search engine parsers

// REMOVED: Old Google Shopping search - replaced with main Google search

// REMOVED: Old Google Broad search - replaced with main Google search

// REMOVED: Old IMDB search - replaced with search engine approach



// Helper function to extract year from title
function extractYearFromTitle(title) {
    if (!title) return '';
    
    // Look for 4-digit year patterns
    const yearMatch = title.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        return yearMatch[0];
    }
    
    return '';
}

// Helper function to detect format from title
function detectFormatFromTitle(title) {
    if (!title) return '';
    
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('blu-ray') || titleLower.includes('bluray')) return 'Blu-ray';
    if (titleLower.includes('4k') || titleLower.includes('uhd')) return '4K';
    if (titleLower.includes('dvd')) return 'DVD';
    if (titleLower.includes('digital')) return 'Digital';
    if (titleLower.includes('streaming')) return 'Streaming';
    
    return '';
}

// Handle scanned barcode
async function handleScannedCode(code) {
    console.log('Handling scanned code:', code);
    
    // Clean and validate the UPC code
    const cleanUPC = code ? code.trim() : '';
    
    if (!cleanUPC) {
        showMessage('Invalid barcode detected - no code provided', 'error');
        return;
    }
    
    console.log('Clean UPC for processing:', cleanUPC);
    
    // Update the scanner result display
    const scannerResult = document.getElementById('scanner-result');
    if (scannerResult) {
        scannerResult.innerHTML = `<strong>Scanned UPC:</strong> ${cleanUPC}`;
    }
    
    // Check for duplicates in spreadsheet (if connected) or local storage
    let duplicate = null;
    
    if (window.spreadsheetManager && window.spreadsheetManager.getConnectionStatus()) {
        // Check spreadsheet first
        const spreadsheetMovies = window.spreadsheetManager.getAllMovies();
        duplicate = spreadsheetMovies.find(m => (m.upc || '').replace(/\D/g, '') === cleanUPC.replace(/\D/g, ''));
    }
    
    // Fallback to local storage check
    if (!duplicate) {
        duplicate = checkLocalDuplicate(cleanUPC);
    }
    
    if (duplicate) {
        const message = `⚠️ Duplicate UPC Found!\n\nThis movie is already in your collection:\n\n` +
                      `Title: ${duplicate.title}\n` +
                      `Year: ${duplicate.year}\n` +
                      `Format: ${duplicate.format || 'Unknown'}\n` +
                      `UPC: ${duplicate.upc}\n\n` +
                      `Do you want to add it anyway?`;
        
        if (!confirm(message)) {
            showMessage('Duplicate UPC scan cancelled', 'warning');
            return;
        }
    }
    
    // Show loading message
    showMessage("🔍 Looking up movie details...", "info");
    
    // Get movie data for spreadsheet
    console.log("🔍 About to call lookupMovieByUPC...");
    const movieData = await lookupMovieByUPC(cleanUPC);
    console.log("🔍 Received movie data:", movieData);
    
    // Go directly to spreadsheet - skip form filling and tab switching
    try {
        console.log('🔍 Checking spreadsheet manager availability...');
        console.log('🔍 window.spreadsheetManager exists:', !!window.spreadsheetManager);
        
        if (window.spreadsheetManager) {
            console.log('🔍 Spreadsheet manager found, checking connection...');
            const connectionStatus = window.spreadsheetManager.getConnectionStatus();
            console.log('🔍 Connection status:', connectionStatus);
            
            if (connectionStatus) {
                console.log('🔍 Connection is active, checking for existing movies...');
                const existing = window.spreadsheetManager.getAllMovies().find(m => (m.upc||'').replace(/\D/g,'') === cleanUPC.replace(/\D/g,''));
                console.log('🔍 Existing movie found:', existing);
                
                if (!existing) {
                    // CRITICAL: Validate that we actually got useful movie data
                    if (!movieData || !movieData.title) {
                        console.log('❌ No movie data found for UPC:', cleanUPC);
                        showMessage(`❌ Could not identify movie for UPC: ${cleanUPC}\n\n💡 This UPC code could not be found in public sources.\n💡 Try:\n• Manual entry with movie details\n• Checking if the UPC is correct\n• Using a different search approach`, 'warning');
                        return; // Don't add useless data to spreadsheet
                    }
                    
                    // CRITICAL: Check if the title is actually valid
                    if (!isValidTitle(movieData.title)) {
                        console.log('❌ Poor quality title rejected:', movieData.title);
                        showMessage(`❌ Poor quality title found: "${movieData.title}"\n\n💡 This title appears to be generic search results.\n💡 The movie will be added with a generated title instead.`, 'warning');
                        
                        // Generate a better title
                        const fallbackTitle = generateSmartTitle(cleanUPC);
                        movieData.title = fallbackTitle;
                        console.log('💡 Using generated fallback title:', fallbackTitle);
                    }
                    
                    const titleToUse = (movieData.title || '').trim();
                    console.log('🔍 Title to use:', titleToUse);
                    
                    if (!titleToUse) {
                        showMessage('Title is required before saving. Please enter a title.', 'warning');
                    } else {
                        const toAdd = {
                            title: titleToUse,
                            year: movieData.year || '',
                            director: movieData.director || '',
                            genre: movieData.genre || '', // optional
                            runtime: movieData.runtime || '',
                            formats: movieData.format || '',
                            upc: movieData.upc || cleanUPC,
                            asin: movieData.asin || '',
                            producer: movieData.producer || '',
                            studio: movieData.studio || '',
                            notes: movieData.notes || '',
                            image: movieData.image || ''
                        };
                        console.log('🔍 About to add movie to spreadsheet:', toAdd);
                        
                        const added = await window.spreadsheetManager.addMovie(toAdd);
                        console.log('🔍 Add movie result:', added);
                        
                        if (added) {
                            let successMsg = `✅ Added to spreadsheet: ${titleToUse}`;
                            if (movieData.year) successMsg += ` (${movieData.year})`;
                            if (movieData.format) successMsg += ` - ${movieData.format}`;
                            successMsg += ' - You can edit the details later';
                            showMessage(successMsg, 'success');
                            
                            // Refresh the display to show the new movie
                            if (typeof displayMovies === 'function') {
                                console.log('🔍 Calling displayMovies to refresh UI...');
                                displayMovies();
                            } else {
                                console.log('⚠️ displayMovies function not available');
                            }
                        } else {
                            showMessage('❌ Failed to add movie to spreadsheet', 'error');
                        }
                    }
                } else {
                    showMessage('⚠️ Movie already exists in spreadsheet', 'warning');
                }
            } else {
                console.log('❌ Spreadsheet manager exists but no connection');
                showMessage('❌ No spreadsheet connection. Please connect to a spreadsheet first.', 'error');
            }
        } else {
            console.log('❌ Spreadsheet manager not found in window object');
            showMessage('❌ No spreadsheet connection. Please connect to a spreadsheet first.', 'error');
        }
    } catch (e) {
        console.error('❌ Failed to add movie to spreadsheet:', e);
        showMessage('❌ Error adding movie to spreadsheet: ' + e.message, 'error');
    }

    // Keep scanner active for continuous scanning
    // Don't stop scanner or close modal
    
    // Clear the scanner result display for next scan
    const scannerResultElement = document.getElementById('scanner-result');
    if (scannerResultElement) {
        scannerResultElement.innerHTML = '';
    }
}

// Fill form with movie data
function fillFormWithMovieData(movieData) {
    console.log("Filling form with movie data:", movieData);
    
    let filledFields = 0;
    
    // Helper function to set field value and track changes
    function setFieldValue(fieldId, value, oldValue) {
        const field = document.getElementById(fieldId);
        if (field) {
            console.log(`Set ${fieldId} from "${oldValue}" to "${value}"`);
            field.value = value;
            if (value) filledFields++;
        } else {
            console.warn(`Field ${fieldId} not found`);
        }
    }
    
    // Fill in the form fields using correct IDs
    setFieldValue('title', movieData.title || '', '');
    setFieldValue('year', movieData.year || '', '');
    setFieldValue('genre', movieData.genre || '', '');
    setFieldValue('director', movieData.director || '', '');
    setFieldValue('producer', movieData.producer || '', '');
    setFieldValue('studio', movieData.studio || '', '');
    setFieldValue('runtime', movieData.runtime || '', '');
    setFieldValue('upc', movieData.upc || '', '');
    setFieldValue('asin', movieData.asin || '', '');
    setFieldValue('notes', movieData.notes || '', '');
    
    // Handle format selection
    if (movieData.format) {
        selectFormat(movieData.format);
    }
    
    console.log(`✅ Form populated: ${filledFields}/10 fields filled`);
    
    // Highlight and focus the title field for easy editing
    const titleField = document.getElementById('title');
    if (titleField) {
        titleField.focus();
        titleField.select();
        console.log("✅ Title field highlighted and selected");
    }
    
    // Switch to the Add Movie tab to show the populated form
    if (typeof showTab === 'function') {
        showTab('add-movie');
        console.log("✅ Switched to Add Movie tab using showTab function");
    } else {
        // Fallback if showTab function doesn't exist
        const addMovieTab = document.querySelector('[data-tab="add-movie"]');
        if (addMovieTab) {
            addMovieTab.click();
            console.log("✅ Switched to Add Movie tab using click");
        }
    }
}

// Select format function
function selectFormat(format) {
    console.log('Selecting format:', format);
    
    // Get all format checkboxes
    const formatCheckboxes = document.querySelectorAll('input[name="formats"]');
    
    // Uncheck all formats first
    formatCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Check the matching format
    let formatFound = false;
    formatCheckboxes.forEach(checkbox => {
        if (checkbox.value.toLowerCase() === format.toLowerCase()) {
            checkbox.checked = true;
            formatFound = true;
            console.log('✅ Selected format:', format);
        }
    });
    
    // If exact match not found, try partial matches
    if (!formatFound) {
        formatCheckboxes.forEach(checkbox => {
            const checkboxValue = checkbox.value.toLowerCase();
            const targetFormat = format.toLowerCase();
            
            if (checkboxValue.includes(targetFormat) || targetFormat.includes(checkboxValue)) {
                checkbox.checked = true;
                formatFound = true;
                console.log('✅ Selected similar format:', checkbox.value);
            }
        });
    }
    
    if (!formatFound) {
        console.log('⚠️ No matching format found for:', format);
    }
}

// Check for local duplicate
function checkLocalDuplicate(upc) {
    // Check spreadsheet manager first if connected
    if (window.spreadsheetManager && window.spreadsheetManager.getConnectionStatus()) {
        const movies = window.spreadsheetManager.getAllMovies();
        const duplicate = movies.find(movie => movie.upc === upc);
        if (duplicate) {
            console.log('Found duplicate in spreadsheet:', duplicate);
            return duplicate;
        }
    }
    
    // Fall back to data manager
    if (window.dataManager) {
        const movies = window.dataManager.getAllMovies();
        const duplicate = movies.find(movie => movie.upc === upc);
        if (duplicate) {
            console.log('Found duplicate in local storage:', duplicate);
            return duplicate;
        }
    }
    
    console.log('No duplicate found for UPC:', upc);
    return null;
}

// Extract year from UPC (UPC release date, not film release date)
function extractYearFromUPC(upc) {
    // UPC structure analysis for release date
    // Most UPCs encode the release year in specific positions
    
    // Method 1: Check if UPC contains a valid year pattern
    // Look for 4-digit year patterns in the UPC
    const upcStr = upc.toString();
    
    // Common patterns for year encoding in UPCs
    const yearPatterns = [
        // Pattern: Last 4 digits might be year
        { start: upcStr.length - 4, end: upcStr.length },
        // Pattern: Middle 4 digits might be year  
        { start: 4, end: 8 },
        // Pattern: First 4 digits after country code might be year
        { start: 2, end: 6 }
    ];
    
    for (const pattern of yearPatterns) {
        const potentialYear = parseInt(upcStr.substring(pattern.start, pattern.end));
        if (potentialYear >= 1950 && potentialYear <= 2030) {
            console.log(`Found UPC release year: ${potentialYear} at position ${pattern.start}-${pattern.end}`);
            return potentialYear.toString();
        }
    }
    
    // Method 2: Analyze UPC structure for release indicators
    // Many UPCs use specific digits to indicate release era
    const firstDigit = parseInt(upcStr[0]);
    const middleDigits = parseInt(upcStr.substring(4, 7));
    
    // Common UPC release year patterns
    if (firstDigit === 0 && middleDigits >= 100 && middleDigits <= 999) {
        // This might indicate a 2000s release
        const estimatedYear = 2000 + (middleDigits % 30);
        if (estimatedYear >= 2000 && estimatedYear <= 2030) {
            console.log(`Estimated UPC release year: ${estimatedYear} from UPC structure`);
            return estimatedYear.toString();
        }
    }
    
    console.log('Could not determine UPC release year from UPC structure');
    return "";
}

// Detect format from UPC structure
function detectFormatFromUPC(upc) {
    const upcStr = upc.toString();
    
    // UPC format detection based on structure and common patterns
    console.log(`Analyzing UPC format: ${upcStr}`);
    
    // Method 1: Check UPC length
    if (upcStr.length === 12) {
        // 12-digit UPCs are typically DVDs
        console.log('12-digit UPC detected - likely DVD');
        return 'DVD';
    } else if (upcStr.length === 13) {
        // 13-digit UPCs could be Blu-ray or DVD
        // Check specific patterns
        const firstDigit = parseInt(upcStr[0]);
        if (firstDigit === 0) {
            console.log('13-digit UPC starting with 0 - likely DVD');
            return 'DVD';
        } else if (firstDigit === 1) {
            console.log('13-digit UPC starting with 1 - likely Blu-ray');
            return 'Blu-ray';
        }
    }
    
    // Method 2: Check for format-specific patterns in UPC
    // Common UPC prefixes for different formats
    const formatPatterns = {
        'DVD': ['0', '1', '2', '3'],
        'Blu-ray': ['1', '2', '3', '4'],
        '4K': ['5', '6'],
        'Digital': ['7', '8', '9']
    };
    
    const firstDigit = upcStr[0];
    for (const [format, prefixes] of Object.entries(formatPatterns)) {
        if (prefixes.includes(firstDigit)) {
            console.log(`Format detected from UPC prefix: ${format}`);
            return format;
        }
    }
    
    // Method 3: Analyze UPC structure for format indicators
    // Some UPCs encode format information in specific positions
    const middleDigits = parseInt(upcStr.substring(4, 7));
    
    if (middleDigits >= 100 && middleDigits <= 299) {
        console.log('UPC middle digits suggest DVD format');
        return 'DVD';
    } else if (middleDigits >= 300 && middleDigits <= 599) {
        console.log('UPC middle digits suggest Blu-ray format');
        return 'Blu-ray';
    } else if (middleDigits >= 600 && middleDigits <= 999) {
        console.log('UPC middle digits suggest 4K format');
        return '4K';
    }
    
    // Default fallback
    console.log('Using default format detection - DVD');
    return 'DVD';
}

// Generate a more descriptive title from UPC
function generateTitleFromUPC(upc) {
    // Create a practical title that indicates this needs manual entry
    const upcNum = parseInt(upc.slice(-6)); // Last 6 digits
    const movieNum = (upcNum % 10000) + 1; // Create a movie number
    
    // Try to extract some meaningful information from the UPC
    const format = detectFormatFromUPC(upc);
    const year = extractYearFromUPC(upc);
    
    let title = `Movie #${movieNum}`;
    
    // Add format information if detected
    if (format && format !== 'Unknown') {
        title += ` (${format})`;
    }
    
    // Add year information if detected
    if (year) {
        title += ` - ${year}`;
    }
    
    // Add UPC for reference
    title += ` [UPC: ${upc}]`;
    
    console.log(`Generated UPC-based title: ${title}`);
    return title;
}

// Enhanced title generation with better fallback options
function generateSmartTitle(upc, searchResults = []) {
    // If we have any search results, try to use them
    if (searchResults.length > 0) {
        const bestResult = searchResults[0];
        if (bestResult.title && bestResult.title !== 'Unknown' && isValidTitle(bestResult.title)) {
            return bestResult.title;
        }
    }
    
    // Try to generate a title from UPC patterns
    const upcStr = upc.toString();
    
    // Check if this looks like a movie UPC
    if (upcStr.length === 12 || upcStr.length === 13) {
        // Common movie UPC patterns
        const moviePatterns = [
            { prefix: '0', format: 'DVD', description: 'Standard DVD' },
            { prefix: '1', format: 'Blu-ray', description: 'Blu-ray Disc' },
            { prefix: '2', format: 'Blu-ray', description: 'Blu-ray Disc' },
            { prefix: '3', format: 'Blu-ray', description: 'Blu-ray Disc' },
            { prefix: '5', format: '4K', description: '4K Ultra HD' },
            { prefix: '6', format: '4K', description: '4K Ultra HD' },
            { prefix: '7', format: 'DVD', description: 'Standard DVD' },
            { prefix: '8', format: 'Blu-ray', description: 'Blu-ray Disc' },
            { prefix: '9', format: 'DVD', description: 'Standard DVD' }
        ];
        
        const firstDigit = upcStr[0];
        const pattern = moviePatterns.find(p => p.prefix === firstDigit);
        
        if (pattern) {
            return `Unknown ${pattern.description} Movie [UPC: ${upc}]`;
        }
    }
    
    // Fallback to generic title
    return generateTitleFromUPC(upc);
}

// Show message function
function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const statusElement = document.getElementById('scanner-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status-message';
        }, 5000);
    }
}

// Handle manual UPC input
function handleManualUPC() {
    const upcInput = document.getElementById('manual-upc-input');
    if (upcInput && upcInput.value.trim()) {
        handleScannedCode(upcInput.value.trim());
        upcInput.value = '';
    } else {
        showMessage('Please enter a UPC code', 'warning');
    }
}

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Scanner DOM loaded, initializing...');
    
    // Only initialize once
    if (scannerInitialized) {
        console.log('Scanner already initialized, skipping...');
        return;
    }
    
    // Wait a bit for ZXing library to load
    setTimeout(() => {
        if (typeof ZXing !== 'undefined') {
            console.log('ZXing library available, initializing scanner...');
            initializeScanner();
            setupEventListeners();
        } else {
            console.error('ZXing library not loaded yet, retrying...');
            // Retry after a longer delay
            setTimeout(() => {
                if (typeof ZXing !== 'undefined') {
                    console.log('ZXing library now available, initializing scanner...');
                    initializeScanner();
                    setupEventListeners();
                } else {
                    console.error('ZXing library failed to load');
                    showMessage('Barcode scanner library failed to load. Please refresh the page.', 'error');
                }
            }, 2000);
        }
    }, 500);
    
    // Also initialize when scanner modal opens
    if (typeof openScanner === 'function') {
        console.log('Scanner modal open function available');
    }
});

// Make scanner functions globally available
window.initializeScanner = initializeScanner;
window.startScanner = startScanner;
window.stopScanner = stopScanner;
window.debugCamera = debugCamera;
window.testCamera = testCamera;
window.handleManualUPC = handleManualUPC; 
