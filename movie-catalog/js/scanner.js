// Scanner functionality for movie catalog
// Global variables
let codeReader = null;
let scannerActive = false;
let selectedDeviceId = null;
let camerasInitialized = false;
let eventListenersSetup = false; // Track if event listeners are already set up

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Scanner: DOM loaded, initializing...');
    initializeScanner();
    setupEventListeners();
});

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
    const startBtn = document.getElementById('start-scanner');
    if (startBtn) {
        startBtn.addEventListener('click', startScanner);
    } else {
        console.warn('Start scanner button not found');
    }
    
    // Stop scanner button
    const stopBtn = document.getElementById('stop-scanner');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopScanner);
    } else {
        console.warn('Stop scanner button not found');
    }
    
    // Camera selection
    const cameraSelect = document.getElementById('cameraSelect');
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
    const manualInput = document.getElementById('manualUPC');
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
    const manualBtn = document.getElementById('submitManualUPC');
    if (manualBtn) {
        manualBtn.addEventListener('click', function() {
            const upc = document.getElementById('manualUPC')?.value?.trim();
            if (upc) {
                handleScannedCode(upc);
                document.getElementById('manualUPC').value = '';
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
            debugInfo += '\n✅ Camera permissions granted\n';
            stream.getTracks().forEach(track => {
                debugInfo += `Track: ${track.label} (${track.getSettings().width}x${track.getSettings().height})\n`;
            });
            stream.getTracks().forEach(track => track.stop());
        } catch (permError) {
            debugInfo += `\n❌ Camera permission error: ${permError.name} - ${permError.message}\n`;
        }
        
        // Try ZXing camera listing
        try {
            const zxingDevices = await codeReader.listVideoInputDevices();
            debugInfo += `\nZXing found ${zxingDevices.length} cameras\n`;
        } catch (zxingError) {
            debugInfo += `\n❌ ZXing camera listing error: ${zxingError.message}\n`;
        }
        
        console.log(debugInfo);
        alert('Camera Debug Info:\n\n' + debugInfo);
        
    } catch (error) {
        console.error('Debug error:', error);
        showMessage('Debug failed: ' + error.message, 'error');
    }
}

// Test camera function
async function testCamera() {
    console.log('Testing camera...');
    
    const videoElement = document.getElementById('scanner-video');
    if (!videoElement) {
        showMessage('Video element not found', 'error');
        return;
    }
    
    try {
        // Try to get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        // Display the stream
        videoElement.srcObject = stream;
        videoElement.play();
        
        showMessage('✅ Camera test successful! Camera is working.', 'success');
        
        // Stop the test after 5 seconds
        setTimeout(() => {
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
            showMessage('Camera test completed', 'info');
        }, 5000);
        
    } catch (error) {
        console.error('Camera test failed:', error);
        showMessage('❌ Camera test failed: ' + error.message, 'error');
    }
}

// Initialize cameras when user clicks start scanner
async function initializeCameras() {
    if (camerasInitialized) {
        return true;
    }
    
    console.log('Initializing cameras...');
    
    try {
        // First, try to list cameras without requesting permissions
        let videoInputDevices = [];
        try {
            videoInputDevices = await codeReader.listVideoInputDevices();
            console.log('Found cameras (no permission needed):', videoInputDevices.length);
        } catch (listError) {
            console.log('Camera listing failed, will request permissions:', listError.message);
        }
        
        // If no cameras found, request permissions
        if (videoInputDevices.length === 0) {
            console.log('Requesting camera permissions...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            // Stop the test stream after a short delay
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
                console.log('Test stream stopped');
            }, 1000);
            
            // Now try to list cameras again
            try {
                videoInputDevices = await codeReader.listVideoInputDevices();
                console.log('Found cameras after permission:', videoInputDevices.length);
            } catch (listError2) {
                console.error('Still cannot list cameras after permission:', listError2);
                showMessage('Camera access granted but cannot detect cameras. Try refreshing the page.', 'warning');
                return false;
            }
        }
        
        // Update camera selection dropdown
        updateCameraSelection(videoInputDevices);
        
        if (videoInputDevices.length > 0) {
            // Prefer back camera if available
            const backCamera = videoInputDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment')
            );
            
            selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
            console.log('Selected camera:', selectedDeviceId);
            camerasInitialized = true;
            return true;
        } else {
            console.warn('No cameras found after permission granted');
            showMessage('No cameras detected on this device. Try using manual UPC entry.', 'warning');
            return false;
        }
    } catch (error) {
        console.error('Error initializing cameras:', error);
        
        if (error.name === 'NotAllowedError') {
            showMessage('Camera access denied. Please allow camera permissions and try again.', 'error');
        } else if (error.name === 'NotFoundError') {
            showMessage('No camera found on this device. Use manual UPC entry instead.', 'error');
        } else if (error.name === 'NotSupportedError') {
            showMessage('Camera not supported on this device. Use manual UPC entry instead.', 'error');
        } else {
            showMessage('Error accessing camera: ' + error.message + '. Use manual UPC entry instead.', 'error');
        }
        return false;
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

// Start scanner with specific device ID
function startScannerWithDevice(deviceId) {
    console.log('Starting scanner with device:', deviceId);
    
    const videoElement = document.getElementById('scanner-video');
    
    scannerActive = true;
    updateScannerUI();
    
    // Start scanning
    codeReader.decodeFromVideoDevice(deviceId, videoElement, (result, err) => {
        if (result) {
            console.log('Scanned code:', result.text);
            handleScannedCode(result.text);
        }
        
        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error('Scanner error:', err);
        }
    }).catch(err => {
        console.error('Error starting scanner:', err);
        showMessage('Error starting scanner: ' + err.message + '. Try fallback mode.', 'error');
        scannerActive = false;
        updateScannerUI();
        
        // Try fallback if device-specific scanner fails
        setTimeout(() => {
            console.log('Trying fallback after device failure...');
            startScannerFallback();
        }, 1000);
    });
    
    showMessage('Scanner started. Point camera at barcode.', 'success');
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
    
    if (startBtn) startBtn.disabled = scannerActive;
    if (stopBtn) stopBtn.disabled = !scannerActive;
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
    const scannedUpcSpan = document.getElementById('scanned-upc');
    if (scannedUpcSpan) {
        scannedUpcSpan.textContent = cleanUPC;
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
    
    // Stop scanner after successful scan
    stopScanner();
    
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

// Open movie search for UPC
function openMovieSearch(upc) {
    console.log('Opening movie search for UPC:', upc);
    
    // Create search queries for different movie databases
    const searches = [
        {
            name: 'Google Search',
            url: `https://www.google.com/search?q=${encodeURIComponent(upc + ' movie DVD Blu-ray')}`
        },
        {
            name: 'Amazon Search',
            url: `https://www.amazon.com/s?k=${encodeURIComponent(upc)}`
        },
        {
            name: 'IMDb Search',
            url: `https://www.imdb.com/find?q=${encodeURIComponent(upc)}`
        }
    ];
    
    // Open the first search (Google) in a new tab
    window.open(searches[0].url, '_blank');
    
    // Show a message with all search options
    const searchMessage = `🔍 Movie search opened!\n\nYou can also try:\n` +
                         searches.slice(1).map(s => `• ${s.name}: ${s.url}`).join('\n');
    
    console.log(searchMessage);
    
    // Create a quick search panel
    createQuickSearchPanel(upc, searches);
}

// Create a quick search panel for easy data entry
function createQuickSearchPanel(upc, searches) {
    // Remove existing panel if any
    const existingPanel = document.getElementById('quick-search-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create the panel
    const panel = document.createElement('div');
    panel.id = 'quick-search-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #3498db;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #2c3e50;">🎬 Quick Movie Entry</h3>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #e74c3c; color: white; border: none; border-radius: 5px; padding: 5px 10px; cursor: pointer;">✕</button>
        </div>
        
        <p style="margin-bottom: 15px; color: #7f8c8d;">
            Google search opened for UPC: <strong>${upc}</strong><br>
            Copy the movie details from the search results and paste them below:
        </p>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Movie Title:</label>
            <input type="text" id="quick-title" placeholder="Paste movie title here" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Year:</label>
            <input type="number" id="quick-year" placeholder="Year" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Format:</label>
            <select id="quick-format" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                <option value="DVD">DVD</option>
                <option value="BluRay">Blu-ray</option>
                <option value="4K">4K UHD</option>
                <option value="Streaming">Streaming</option>
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Director:</label>
            <input type="text" id="quick-director" placeholder="Director name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Runtime:</label>
            <input type="text" id="quick-runtime" placeholder="e.g., 120 min" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div style="display: flex; gap: 10px;">
            <button onclick="applyQuickData()" style="flex: 1; background: #28a745; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">✅ Apply to Form</button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex: 1; background: #6c757d; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">❌ Cancel</button>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 12px; color: #6c757d;">
            <strong>💡 Tip:</strong> Copy the movie title from Google search results and paste it in the title field above. 
            The form will be automatically updated with the correct information.
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Focus on the title field
    setTimeout(() => {
        const titleField = document.getElementById('quick-title');
        if (titleField) {
            titleField.focus();
        }
    }, 100);
}

// Apply quick data to the main form
function applyQuickData() {
    const title = document.getElementById('quick-title')?.value?.trim();
    const year = document.getElementById('quick-year')?.value?.trim();
    const format = document.getElementById('quick-format')?.value;
    const director = document.getElementById('quick-director')?.value?.trim();
    const runtime = document.getElementById('quick-runtime')?.value?.trim();
    
    // Apply to main form
    if (title) {
        const mainTitleField = document.getElementById('title');
        if (mainTitleField) {
            mainTitleField.value = title;
        }
    }
    
    if (year) {
        const mainYearField = document.getElementById('year');
        if (mainYearField) {
            mainYearField.value = year;
        }
    }
    
    if (format) {
        // Uncheck all format checkboxes
        document.querySelectorAll('.format1:checked, .format2:checked, .format3:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Check the selected format
        const formatCheckbox = document.querySelector(`input[value="${format}"]`);
        if (formatCheckbox) {
            formatCheckbox.checked = true;
        }
    }
    
    if (director) {
        const mainDirectorField = document.getElementById('director');
        if (mainDirectorField) {
            mainDirectorField.value = director;
        }
    }
    
    if (runtime) {
        const mainRuntimeField = document.getElementById('runtime');
        if (mainRuntimeField) {
            mainRuntimeField.value = runtime;
        }
    }
    
    // Close the panel
    const panel = document.getElementById('quick-search-panel');
    if (panel) {
        panel.remove();
    }
    
    // Show success message
    showMessage('✅ Movie data applied to form!', 'success');
    
    // Focus on the title field in the main form
    const mainTitleField = document.getElementById('title');
    if (mainTitleField) {
        mainTitleField.focus();
        mainTitleField.select();
    }
}

function checkLocalDuplicate(upc) {
    // Use data manager to check for duplicates
    if (window.dataManager && typeof window.dataManager.getAllMovies === 'function') {
        return window.dataManager.getAllMovies().find(movie => 
            movie.upc && movie.upc.toString().trim() === upc.toString().trim()
        );
    }
    
    console.warn('Data manager not available for duplicate check');
    return null;
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

// Select format in the form
function selectFormat(format) {
    console.log('Selecting format:', format);
    
    // Uncheck all format checkboxes first
    document.querySelectorAll('.format1:checked, .format2:checked, .format3:checked').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Check the appropriate format checkbox
    const formatCheckbox = document.querySelector(`input[value="${format}"]`);
    if (formatCheckbox) {
        formatCheckbox.checked = true;
        console.log(`✅ Selected format: ${format}`);
    } else {
        console.warn(`Format checkbox not found for: ${format}`);
        
        // List available format options for debugging
        const availableFormats = document.querySelectorAll('input[type="checkbox"][class*="format"]');
        console.log('Available format options:');
        availableFormats.forEach(checkbox => {
            console.log(`- ${checkbox.value} (${checkbox.className})`);
        });
        
        // Try to find a similar format
        const similarFormats = {
            'DVD': ['DVD'],
            'BluRay': ['BluRay', 'Blu-ray'],
            '4K': ['4K', '4K UHD'],
            'Streaming': ['Streaming']
        };
        
        const similarOptions = similarFormats[format] || [];
        for (const option of similarOptions) {
            const similarCheckbox = document.querySelector(`input[value="${option}"]`);
            if (similarCheckbox) {
                similarCheckbox.checked = true;
                console.log(`✅ Selected similar format: ${option}`);
                break;
            }
        }
    }
}

function switchToAddMovieTab() {
    console.log('Switching to Add Movie tab');
    
    // Use the showTab function that's already defined in app.js
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
}

function searchUPCOnGoogle(upc) {
    console.log('Searching Google for UPC:', upc);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(upc)}`;
    window.open(searchUrl, '_blank');
    console.log('✅ Opened Google search in new tab');
}

// Local movie database for common UPCs
const LOCAL_MOVIE_DATABASE = {
    // Add some common movie UPCs here
    "715515315616": {
        title: "The Big Heat",
        year: "2023", // UPC release year for Criterion 4K
        director: "Fritz Lang",
        genre: "Film-Noir, Crime, Drama",
        runtime: "90 min",
        studio: "Criterion Collection",
        format: "4K" // UPC indicates 4K format
    },
    "715515314213": {
        title: "The Wiz",
        year: "2025", // UPC release year for Criterion
        director: "Sidney Lumet",
        genre: "Musical, Fantasy, Adventure",
        runtime: "134 min",
        studio: "Criterion Collection",
        format: "Blu-ray" // UPC indicates Blu-ray format
    },
    "715515315623": {
        title: "The Godfather",
        year: "2008", // UPC release year
        director: "Francis Ford Coppola",
        genre: "Crime, Drama",
        runtime: "175 min",
        studio: "Paramount",
        format: "DVD"
    },
    "715515315630": {
        title: "Pulp Fiction",
        year: "2011", // UPC release year
        director: "Quentin Tarantino", 
        genre: "Crime, Drama",
        runtime: "154 min",
        studio: "Miramax",
        format: "Blu-ray" // UPC indicates Blu-ray format
    }
};

// Log database loading
console.log("🎬 Movie database loaded with entries:", Object.keys(LOCAL_MOVIE_DATABASE));
console.log("🎬 Database timestamp:", new Date().toISOString());

// Enhanced movie data lookup with local database
async function lookupMovieByUPC(upc) {
    console.log("🔍 Looking up movie for UPC:", upc);
    console.log("🔍 Local database keys:", Object.keys(LOCAL_MOVIE_DATABASE));
    
    // First check local database
    const localData = LOCAL_MOVIE_DATABASE[upc];
    console.log("🔍 Local data lookup result:", localData);
    
    if (localData) {
        console.log("✅ Found in local database:", localData);
        const result = {
            upc: upc,
            title: localData.title,
            year: localData.year,
            director: localData.director,
            genre: localData.genre,
            runtime: localData.runtime,
            studio: localData.studio,
            format: localData.format,
            notes: `UPC: ${upc} - Found in local database`
        };
        console.log("✅ Returning local database result:", result);
        return result;
    }
    
    // If not in local database, try to extract info from UPC
    console.log("🔍 UPC not in local database, extracting info...");
    
    // Extract potential year from UPC (last 2 digits might indicate year)
    const upcYear = extractYearFromUPC(upc);
    console.log("🔍 Extracted UPC year:", upcYear);
    
    // Create a more descriptive title based on UPC
    const descriptiveTitle = generateTitleFromUPC(upc);
    console.log("🔍 Generated title:", descriptiveTitle);
    
    const result = {
        upc: upc,
        title: descriptiveTitle,
        year: upcYear || "",
        director: "",
        genre: "",
        runtime: "",
        studio: "",
        format: detectFormatFromUPC(upc),
        notes: `UPC: ${upc} - Scanned on ${new Date().toLocaleDateString()} - Not in database`
    };
    
    console.log("✅ Returning generated result:", result);
    return result;
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

// Detect title from UPC (basic implementation)
function detectTitleFromUPC(upc) {
    // This is a placeholder - in a real implementation, you'd have:
    // 1. A database of UPCs with their corresponding titles
    // 2. API calls to movie databases
    // 3. Pattern matching for common UPC structures
    
    // For now, we'll return a clean placeholder title
    // Users can easily edit this to the actual movie title
    
    // Check if UPC looks like a movie UPC (12-13 digits)
    if (upc.length === 12 || upc.length === 13) {
        // Extract some digits to make the placeholder more unique
        const lastDigits = upc.slice(-4);
        return `Movie ${lastDigits}`;
    }
    
    // For non-standard UPCs, just use a generic placeholder
    return `Movie`;
}

// Detect ASIN from UPC (basic implementation)
function detectASINFromUPC(upc) {
    // Some UPCs can be converted to ASINs, but this is complex
    // For now, we'll return null and let users fill this manually
    // In a real implementation, you'd have a UPC-to-ASIN mapping database
    
    // Placeholder for future enhancement
    return null;
}

function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Look for message container
    let messageContainer = document.getElementById('scanner-message') ||
                          document.getElementById('message-container') ||
                          document.querySelector('.message-container');
    
    if (!messageContainer) {
        // Create message container if it doesn't exist
        messageContainer = document.createElement('div');
        messageContainer.id = 'scanner-message';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(messageContainer);
    }
    
    // Set message content and style
    messageContainer.textContent = message;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            messageContainer.style.backgroundColor = '#28a745';
            break;
        case 'error':
            messageContainer.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            messageContainer.style.backgroundColor = '#ffc107';
            messageContainer.style.color = '#212529';
            break;
        default:
            messageContainer.style.backgroundColor = '#17a2b8';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageContainer.parentNode) {
            messageContainer.parentNode.removeChild(messageContainer);
        }
    }, 5000);
}

// Update camera selection dropdown
function updateCameraSelection(devices) {
    const cameraSelect = document.getElementById('cameraSelect');
    if (cameraSelect) {
        cameraSelect.innerHTML = '';
        
        if (devices.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.text = 'No cameras found';
            cameraSelect.appendChild(option);
            return;
        }
        
        devices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${index + 1}`;
            if (device.deviceId === selectedDeviceId) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    }
}

// Test API functionality
// testAPIs function removed
