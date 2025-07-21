let scannerActive = false;
let codeReader = null;
let selectedDeviceId = null;

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeScanner();
    setupEventListeners();
});

function initializeScanner() {
    console.log('Initializing scanner...');
    codeReader = new ZXing.BrowserBarcodeReader();
    
    // Get available cameras
    codeReader.listVideoInputDevices().then((videoInputDevices) => {
        console.log('Found cameras:', videoInputDevices.length);
        
        if (videoInputDevices.length > 0) {
            // Prefer back camera if available
            const backCamera = videoInputDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment')
            );
            
            selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
            console.log('Selected camera:', selectedDeviceId);
            
            // Update camera selection dropdown if it exists
            updateCameraSelection(videoInputDevices);
        } else {
            console.error('No cameras found');
            showMessage('No cameras found on this device', 'error');
        }
    }).catch(err => {
        console.error('Error listing cameras:', err);
        showMessage('Error accessing cameras: ' + err.message, 'error');
    });
}

function updateCameraSelection(devices) {
    const cameraSelect = document.getElementById('cameraSelect');
    if (cameraSelect) {
        cameraSelect.innerHTML = '';
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

function setupEventListeners() {
    // Start scanner button
    const startBtn = document.getElementById('startScanner');
    if (startBtn) {
        startBtn.addEventListener('click', startScanner);
    }
    
    // Stop scanner button
    const stopBtn = document.getElementById('stopScanner');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopScanner);
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
            const manualInput = document.getElementById('manualUPC');
            if (manualInput) {
                const upc = manualInput.value.trim();
                if (upc) {
                    handleScannedCode(upc);
                    manualInput.value = '';
                }
            }
        });
    }
}

function startScanner() {
    console.log('Starting scanner...');
    
    if (!codeReader) {
        console.error('Scanner not initialized');
        showMessage('Scanner not initialized', 'error');
        return;
    }
    
    if (!selectedDeviceId) {
        console.error('No camera selected');
        showMessage('No camera available', 'error');
        return;
    }
    
    const videoElement = document.getElementById('scanner-video');
    if (!videoElement) {
        console.error('Video element not found');
        showMessage('Video element not found', 'error');
        return;
    }
    
    scannerActive = true;
    updateScannerUI();
    
    // Start decoding from video device
    codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
        if (result) {
            console.log('Scanned code:', result.text);
            handleScannedCode(result.text);
            
            // Optional: Auto-stop after successful scan
            // stopScanner();
        }
        
        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error('Scanner error:', err);
        }
    }).catch(err => {
        console.error('Error starting scanner:', err);
        showMessage('Error starting scanner: ' + err.message, 'error');
        scannerActive = false;
        updateScannerUI();
    });
    
    showMessage('Scanner started. Point camera at barcode.', 'success');
}

function stopScanner() {
    console.log('Stopping scanner...');
    
    if (codeReader) {
        codeReader.reset();
    }
    
    scannerActive = false;
    updateScannerUI();
    
    // Clear video stream
    const videoElement = document.getElementById('scanner-video');
    if (videoElement) {
        videoElement.srcObject = null;
    }
    
    showMessage('Scanner stopped.', 'info');
}

function updateScannerUI() {
    const startBtn = document.getElementById('startScanner');
    const stopBtn = document.getElementById('stopScanner');
    const videoElement = document.getElementById('scanner-video');
    
    if (startBtn) {
        startBtn.disabled = scannerActive;
        startBtn.textContent = scannerActive ? 'Scanner Running...' : 'Start Scanner';
    }
    
    if (stopBtn) {
        stopBtn.disabled = !scannerActive;
    }
    
    if (videoElement) {
        videoElement.style.display = scannerActive ? 'block' : 'none';
    }
}

async function handleScannedCode(code) {
    console.log('Handling scanned code:', code);
    
    // Clean and validate the UPC code
    const cleanUPC = code ? code.trim() : '';
    
    if (!cleanUPC) {
        showMessage('Invalid barcode detected - no code provided', 'error');
        return;
    }
    
    console.log('Clean UPC for processing:', cleanUPC);
    
    // Show loading message
    showMessage('Checking for duplicates...', 'info');
    
    try {
        // First, check if this UPC already exists in the collection
        console.log('About to check for duplicate with UPC:', cleanUPC);
        const duplicateCheck = await checkForDuplicate(cleanUPC);
        console.log('Duplicate check returned:', duplicateCheck);
        
        if (duplicateCheck.isDuplicate) {
            // Show duplicate warning with existing movie details
            const existingMovie = duplicateCheck.existingMovie;
            const message = `⚠️ Duplicate UPC Found!\n\nThis movie is already in your collection:\n\n` +
                          `Title: ${existingMovie.title}\n` +
                          `Year: ${existingMovie.year}\n` +
                          `Format: ${existingMovie.format}\n` +
                          `UPC: ${existingMovie.upc}\n\n` +
                          `Do you want to add it anyway?`;
            
            if (!confirm(message)) {
                showMessage('Duplicate UPC scan cancelled', 'warning');
                return;
            }
        }
        
        // If not a duplicate (or user chose to add anyway), proceed with UPC lookup
        showMessage('Looking up movie information...', 'info');
        await lookupMovieByUPC(cleanUPC);
        
    } catch (error) {
        console.error('Error handling scanned code:', error);
        showMessage('Error processing barcode: ' + error.message, 'error');
    }
}

async function checkForDuplicate(upc) {
    console.log('Checking for duplicate UPC:', upc);
    
    // Validate UPC parameter
    if (!upc || upc.trim() === '') {
        console.warn('No UPC provided for duplicate check');
        return { isDuplicate: false };
    }
    
    try {
        const scriptUrl = getGoogleScriptUrl();
        if (!scriptUrl) {
            throw new Error('Google Script URL not configured');
        }
        
        const cleanUPC = upc.trim();
        const url = `${scriptUrl}?action=checkDuplicate&upc=${encodeURIComponent(cleanUPC)}`;
        console.log('Checking duplicate at:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Duplicate check result:', result);
        
        if (result.error) {
            console.error('Duplicate check error:', result.error);
            // If there's an error checking, assume it's not a duplicate and proceed
            return { isDuplicate: false };
        }
        
        return {
            isDuplicate: result.isDuplicate || false,
            existingMovie: result.existingMovie || null
        };
        
    } catch (error) {
        console.error('Error checking for duplicate:', error);
        // If there's an error, assume it's not a duplicate and let the process continue
        return { isDuplicate: false };
    }
}

async function lookupMovieByUPC(upc) {
    console.log('Looking up UPC:', upc);
    
    try {
        showMessage('Searching movie database...', 'info');
        
        // Try the enhanced UPC lookup first
        const result = await lookupMovieByUPCViaScript(upc);
        
        if (result.success && result.data) {
            console.log('Movie found:', result.data);
            
            // Fill the form with the movie data
            fillFormWithMovieData(result.data);
            
            // Switch to Add Movie tab
            switchToAddMovieTab();
            
            showMessage(`Movie found: ${result.data.title} (${result.data.year})`, 'success');
        } else {
            console.log('Movie not found, using manual entry');
            
            // Pre-fill just the UPC and let user enter details manually
            fillFormWithMovieData({ upc: upc });
            
            // Switch to Add Movie tab
            switchToAddMovieTab();
            
            showMessage('Movie not found in database. Please enter details manually.', 'warning');
        }
        
    } catch (error) {
        console.error('Error looking up movie:', error);
        
        // Pre-fill just the UPC in case of error
        fillFormWithMovieData({ upc: upc });
        switchToAddMovieTab();
        
        showMessage('Error looking up movie. Please enter details manually.', 'error');
    }
}

async function lookupMovieByUPCViaScript(upc) {
    console.log('Looking up via Google Script:', upc);
    
    const scriptUrl = getGoogleScriptUrl();
    if (!scriptUrl) {
        throw new Error('Google Script URL not configured');
    }
    
    // Try the new lookup method first
    const url = `${scriptUrl}?action=lookupUPCNew&upc=${encodeURIComponent(upc)}`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Script lookup result:', result);
    
    return result;
}

function fillFormWithMovieData(movieData) {
    console.log('Filling form with movie data:', movieData);
    
    // Fill form fields if they exist
    const fields = {
        'movie-title': movieData.title || '',
        'movie-year': movieData.year || '',
        'movie-genre': movieData.genre || '',
        'movie-director': movieData.director || '',
        'movie-studio': movieData.studio || '',
        'movie-format': movieData.format || 'DVD',
        'movie-upc': movieData.upc || '',
        'movie-notes': movieData.notes || ''
    };
    
    Object.keys(fields).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = fields[fieldId];
            console.log(`Set ${fieldId} to: ${fields[fieldId]}`);
        } else {
            console.warn(`Field ${fieldId} not found`);
        }
    });
    
    // Special handling for format dropdown
    const formatField = document.getElementById('movie-format');
    if (formatField && movieData.format) {
        // Try to match the format value
        const options = Array.from(formatField.options);
        const matchingOption = options.find(option => 
            option.value.toLowerCase() === movieData.format.toLowerCase() ||
            option.text.toLowerCase() === movieData.format.toLowerCase()
        );
        
        if (matchingOption) {
            formatField.value = matchingOption.value;
        }
    }
}

function switchToAddMovieTab() {
    console.log('Switching to Add Movie tab');
    
    // Look for tab switching mechanism
    const addMovieTab = document.querySelector('[data-tab="add-movie"]') || 
                       document.querySelector('a[href="#add-movie"]') ||
                       document.getElementById('add-movie-tab');
    
    if (addMovieTab) {
        addMovieTab.click();
    } else {
        // Try to find and activate the add movie section
        const addMovieSection = document.getElementById('add-movie') ||
                               document.querySelector('.add-movie-section');
        
        if (addMovieSection) {
            // Show the section
            addMovieSection.style.display = 'block';
            addMovieSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function getGoogleScriptUrl() {
    // This should match your actual Google Apps Script web app URL
    // You'll need to update this with your actual script URL
    const scriptUrl = localStorage.getItem('googleScriptUrl') || 
                     window.GOOGLE_SCRIPT_URL ||
                     'YOUR_GOOGLE_SCRIPT_URL_HERE';
    
    if (scriptUrl === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        console.error('Google Script URL not configured');
        return null;
    }
    
    return scriptUrl;
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
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(messageContainer);
    }
    
    // Set message and style based on type
    messageContainer.textContent = message;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    messageContainer.style.backgroundColor = colors[type] || colors.info;
    messageContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageContainer) {
            messageContainer.style.display = 'none';
        }
    }, 5000);
}

// Utility function to test scanner functionality
function testScanner() {
    console.log('Testing scanner functionality...');
    
    // Test with a known UPC
    const testUPC = '025192354526'; // The Shawshank Redemption
    console.log('Testing with UPC:', testUPC);
    handleScannedCode(testUPC);
}

// Test function for duplicate checking specifically
async function testDuplicateCheck() {
    console.log('Testing duplicate check functionality...');
    
    const testUPC = '826663153750'; // The UPC that's causing duplicates
    console.log('Testing duplicate check with UPC:', testUPC);
    
    try {
        const result = await checkForDuplicate(testUPC);
        console.log('Duplicate check test result:', result);
        showMessage(`Duplicate check test: ${result.isDuplicate ? 'DUPLICATE FOUND' : 'NOT A DUPLICATE'}`, 'info');
    } catch (error) {
        console.error('Duplicate check test failed:', error);
        showMessage('Duplicate check test failed: ' + error.message, 'error');
    }
}

// Test function for Google Script URL
function testGoogleScriptUrl() {
    const url = getGoogleScriptUrl();
    console.log('Current Google Script URL:', url);
    
    if (!url || url === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        showMessage('Google Script URL not configured!', 'error');
    } else {
        showMessage('Google Script URL: ' + url, 'info');
    }
    
    return url;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startScanner,
        stopScanner,
        handleScannedCode,
        lookupMovieByUPC,
        testScanner,
        testDuplicateCheck,
        testGoogleScriptUrl,
        checkForDuplicate
    };
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
    window.scannerTest = {
        testScanner,
        testDuplicateCheck,
        testGoogleScriptUrl,
        checkForDuplicate,
        handleScannedCode
    };
}
