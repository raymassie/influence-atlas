// Scanner functionality for movie catalog
// Global variables
let codeReader = null;
let scannerActive = false;
let selectedDeviceId = null;
let camerasInitialized = false;
let eventListenersSetup = false; // Track if event listeners are already set up

// Initialize scanner
function initializeScanner() {
    console.log('Initializing scanner...');
    
    if (codeReader) {
        console.log('Scanner already initialized');
        return;
    }
    
    // Check if ZXing is available
    if (typeof ZXing === 'undefined') {
        console.error('ZXing library not loaded');
        showMessage('ZXing library not available', 'error');
        return;
    }
    
    try {
        codeReader = new ZXing.BrowserMultiFormatReader();
        console.log('Scanner initialized successfully');
    } catch (error) {
        console.error('Failed to initialize scanner:', error);
        showMessage('Failed to initialize scanner', 'error');
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
    const manualBtn = document.querySelector('.manual-input-group button');
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
    
    // Since test camera works, skip the problematic camera listing
    // and go straight to the fallback scanner which we know works
    console.log('Using fallback scanner (test camera confirmed working)');
    
    // Small delay to show the status message
    setTimeout(() => {
        startScannerFallback();
    }, 500);
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

// Spreadsheet-first lookup: no hardcoded UPC database

// Database loaded

// Enhanced movie data lookup: spreadsheet (or local storage) only; no placeholders
async function lookupMovieByUPC(upc) {
    console.log("🔍 Looking up movie for UPC:", upc);

    const normalize = (s) => (s || '').toString().replace(/\D/g, '');
    const scanned = normalize(upc);
    const variants = new Set([scanned]);
    if (scanned.length === 12) variants.add('0' + scanned);
    if (scanned.length === 13 && scanned.startsWith('0')) variants.add(scanned.slice(1));

    // 1) Spreadsheet lookup (authoritative)
    if (window.spreadsheetManager && window.spreadsheetManager.getConnectionStatus()) {
        const rows = window.spreadsheetManager.getAllMovies();
        const match = rows.find(r => variants.has(normalize(r.upc)));
        if (match) {
            const firstFormat = (match.formats || '').split(',')[0]?.trim() || '';
            const result = {
                upc: upc,
                title: match.title || '',
                year: match.year || '',
                director: match.director || '',
                genre: match.genre || '',
                runtime: match.runtime || '',
                studio: match.studio || '',
                format: firstFormat
            };
            console.log("✅ Found in spreadsheet:", result);
            return result;
        }
    }

    // 2) Local storage fallback (if spreadsheet not connected)
    if (window.dataManager) {
        const rows = window.dataManager.getAllMovies();
        const match = rows.find(r => variants.has(normalize(r.upc)));
        if (match) {
            const firstFormat = (match.formats || '').split(',')[0]?.trim() || '';
            const result = {
                upc: upc,
                title: match.title || '',
                year: match.year || '',
                director: match.director || '',
                genre: match.genre || '',
                runtime: match.runtime || '',
                studio: match.studio || '',
                format: firstFormat
            };
            console.log("✅ Found in local storage:", result);
            return result;
        }
    }

    // 3) Not found anywhere: return UPC only, leave the rest blank to avoid incorrect data
    const result = {
        upc: upc,
        title: '',
        year: '',
        director: '',
        genre: '',
        runtime: '',
        studio: '',
        format: ''
    };
    console.log("⚠️ UPC not found in any data source. Returning minimal result:", result);
    return result;
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
    
    // Check for duplicates in local collection
    const duplicate = checkLocalDuplicate(cleanUPC);
    
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
    
    // Get movie data and fill form
    console.log("🔍 About to call lookupMovieByUPC...");
    const movieData = await lookupMovieByUPC(cleanUPC);
    console.log("🔍 Received movie data:", movieData);
    
    console.log("🔍 About to call fillFormWithMovieData...");
    fillFormWithMovieData(movieData);
    console.log("🔍 About to call switchToAddMovieTab...");
    switchToAddMovieTab();
    
    // If connected and not duplicate, auto-add to spreadsheet
    try {
        if (window.spreadsheetManager && window.spreadsheetManager.getConnectionStatus()) {
            const existing = window.spreadsheetManager.getAllMovies().find(m => (m.upc||'').replace(/\D/g,'') === cleanUPC.replace(/\D/g,''));
            if (!existing) {
                const titleToUse = (movieData.title || '').trim();
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
                    const added = await window.spreadsheetManager.addMovie(toAdd);
                    if (added) {
                        showMessage('✅ Saved scan to spreadsheet', 'success');
                    }
                }
            } else {
                showMessage('⚠️ Duplicate in spreadsheet. Not auto-added.', 'warning');
            }
        }
    } catch (e) {
        console.error('Auto-add after scan failed:', e);
    }

    // Stop scanner after successful scan
    stopScanner();
    
    // Close scanner modal
    closeScannerModal();
    
    // Create a summary of what was populated
    const populatedFields = [];
    if (movieData.title) populatedFields.push('title');
    if (movieData.format) populatedFields.push('format');
    if (movieData.year) populatedFields.push('year');
    if (movieData.director) populatedFields.push('director');
    if (movieData.runtime) populatedFields.push('runtime');
    if (movieData.upc) populatedFields.push('UPC');
    
    const summary = populatedFields.length > 0 
        ? `Form populated with: ${populatedFields.join(', ')}`
        : 'UPC captured - ready for manual entry';
    
    showMessage(`✅ UPC scanned: ${cleanUPC}. ${summary}`, "success");
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

// Switch to Add Movie tab
function switchToAddMovieTab() {
    console.log('Switching to Add Movie tab...');
    
    if (typeof showTab === 'function') {
        showTab('add-movie');
        console.log('✅ Switched to Add Movie tab using showTab function');
    } else {
        console.error('❌ showTab function not found');
        // Fallback: try to find and click the add movie tab button
        const addMovieTab = document.querySelector('button[onclick*="add-movie"]') ||
                           document.querySelector('button[onclick*="showTab"]');
        
        if (addMovieTab) {
            addMovieTab.click();
            console.log('✅ Clicked Add Movie tab button');
        } else {
            console.error('❌ Could not find Add Movie tab button');
        }
    }
    
    // Focus on the title field for easy editing
    setTimeout(() => {
        const titleField = document.getElementById('title');
        if (titleField) {
            titleField.focus();
            titleField.select();
            console.log('✅ Title field focused after tab switch');
        }
    }, 100);
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
    // Create a more meaningful title based on UPC
    const upcNum = parseInt(upc.slice(-6)); // Last 6 digits
    const movieNum = (upcNum % 10000) + 1; // Create a movie number
    
    // Try to make it sound like a real movie title
    const titles = [
        "The Hidden Truth",
        "Lost in Time", 
        "Beyond the Horizon",
        "The Last Stand",
        "Echoes of Yesterday",
        "The Silent Witness",
        "Through the Looking Glass",
        "The Final Chapter",
        "Shadows of the Past",
        "The Unknown Journey"
    ];
    
    const titleIndex = movieNum % titles.length;
    return `${titles[titleIndex]} (Movie #${movieNum})`;
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
    initializeScanner();
    setupEventListeners();
}); 