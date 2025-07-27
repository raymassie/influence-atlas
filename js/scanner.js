// Scanner functionality for movie catalog
let codeReader = null;
let scannerActive = false;
let selectedDeviceId = null;

// Initialize scanner when page loads
function initializeScanner() {
    console.log('Initializing scanner...');
    
    try {
        codeReader = new ZXing.BrowserBarcodeReader();
        
        // List available cameras
        codeReader.listVideoInputDevices().then((videoInputDevices) => {
            console.log('Found cameras:', videoInputDevices.length);
            
            if (videoInputDevices.length > 0) {
                // Select the first camera (usually the back camera)
                selectedDeviceId = videoInputDevices[0].deviceId;
                console.log('Selected camera:', selectedDeviceId);
            }
        }).catch(err => {
            console.error('Error listing cameras:', err);
        });
        
    } catch (error) {
        console.error('Error initializing scanner:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up scanner event listeners...');
    
    // Start scanner button
    const startBtn = document.getElementById('start-scanner');
    if (startBtn) {
        startBtn.addEventListener('click', startScanner);
    }
    
    // Stop scanner button
    const stopBtn = document.getElementById('stop-scanner');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopScanner);
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
    
    // Start scanning
    codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
        if (result) {
            console.log('Scanned code:', result.text);
            handleScannedCode(result.text);
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
    const movieData = await lookupMovieByUPC(cleanUPC);
    fillFormWithMovieData(movieData);
    switchToAddMovieTab();
    
    // Open Google search for the UPC
    searchUPCOnGoogle(cleanUPC);
    
    showMessage(`✅ UPC scanned: ${cleanUPC}. Google search opened for details.`, "success");
}

function checkLocalDuplicate(upc) {
    // Use data manager to check for duplicates
    if (window.dataManager) {
        return window.dataManager.getAllMovies().find(movie => 
            movie.upc && movie.upc.toString().trim() === upc.toString().trim()
        );
    }
    
    return null;
}

function fillFormWithMovieData(movieData) {
    console.log('Filling form with movie data:', movieData);
    
    // Use correct field IDs that match your HTML
    const fields = {
        'title': movieData.title || '',
        'year': movieData.year || '',
        'genre': movieData.genre || '',
        'director': movieData.director || '',
        'producer': movieData.producer || '',
        'studio': movieData.studio || '',
        'runtime': movieData.runtime || '',
        'upc': movieData.upc || '',
        'asin': movieData.asin || '',
        'notes': movieData.notes || ''
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

async function lookupMovieByUPC(upc) {
    console.log("🔍 Looking up movie for UPC:", upc);
    
    // Simple approach: just return the UPC and open Google search
    return {
        upc: upc,
        title: "",
        year: "",
        genre: "",
        runtime: "",
        director: "",
        producer: "",
        studio: "",
        asin: "",
        notes: "UPC scanned - Google search opened for details"
    };
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

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeScanner();
    setupEventListeners();
});
