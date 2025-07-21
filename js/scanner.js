// Enhanced UPC lookup function that checks Google Sheets for duplicates FIRST
async function lookupMovieByUPC(upc) {
    const loadingDiv = document.getElementById('lookup-loading');
    loadingDiv.style.display = 'block';
    
    console.log(`🔍 Looking up movie details for UPC: ${upc}`);
    
    try {
        showStatus('scanner-status', '🔍 Checking for duplicates and looking up movie details...', 'info');
        
        // STEP 1: Check if UPC already exists in Google Sheets
        if (googleScriptUrl) {
            console.log('📊 Checking Google Sheets for existing UPC...');
            const duplicateCheck = await checkUPCInGoogleSheets(upc);
            
            if (duplicateCheck.exists) {
                console.log('🚨 UPC already exists in collection!');
                showStatus('scanner-status', 
                    `🚨 Duplicate Detected! "${duplicateCheck.movie.title}" (${duplicateCheck.movie.year || 'Unknown Year'}) with UPC ${upc} is already in your collection.`, 
                    'error'
                );
                
                // Show the existing movie details
                document.getElementById('scanner-result').innerHTML = `
                    <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <strong>🚨 Duplicate Movie Found!</strong><br>
                        <div style="margin-top: 10px; font-size: 16px;">
                            <strong>${duplicateCheck.movie.title}</strong><br>
                            Year: ${duplicateCheck.movie.year || 'Unknown'}<br>
                            UPC: ${upc}<br>
                            <small>This movie is already in your collection.</small>
                        </div>
                    </div>
                `;
                document.getElementById('scanner-result').style.display = 'block';
                
                return; // Stop here - don't proceed with lookup or form filling
            } else {
                console.log('✅ UPC not found in collection - proceeding with lookup');
            }
        }
        
        // STEP 2: If not a duplicate, proceed with normal UPC lookup
        let movieData = await lookupMovieByUPCViaScript(upc);
        
        if (movieData) {
            fillFormWithMovieData(movieData);
            showStatus('scanner-status', `✅ Found: "${movieData.title}"! Data from ${movieData.source}. Please verify details.`, 'success');
            console.log('✅ Movie data found and form filled:', movieData);
            
            // Switch to add movie tab
            setTimeout(() => {
                showTab('add-movie');
            }, 1500);
            
        } else {
            showStatus('scanner-status', `ℹ️ UPC ${upc} captured! Movie details not found - please enter manually.`, 'info');
            console.log('ℹ️ No movie data found for UPC');
            
            // Still switch to add movie tab with UPC filled
            setTimeout(() => {
                showTab('add-movie');
                document.getElementById('title').focus();
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ UPC lookup error:', error);
        showStatus('scanner-status', `ℹ️ UPC ${upc} captured! Unable to lookup details - please enter manually.`, 'info');
        
        setTimeout(() => {
            showTab('add-movie');
            document.getElementById('title').focus();
        }, 1000);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// New function to check if UPC exists in Google Sheets
async function checkUPCInGoogleSheets(upc) {
    if (!googleScriptUrl) {
        console.log('⚠️ No Google config - skipping duplicate check');
        return { exists: false };
    }
    
    try {
        console.log(`📊 Checking Google Sheets for UPC: ${upc}`);
        
        // Get all movies from Google Sheets
        const response = await fetch(`${googleScriptUrl}?action=getMovies`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        const movies = result.data || [];
        console.log(`📊 Checking ${movies.length} movies for UPC ${upc}`);
        
        // Look for matching UPC
        const existingMovie = movies.find(movie => {
            const movieUPC = (movie.upc || '').toString().trim();
            const searchUPC = upc.toString().trim();
            return movieUPC && movieUPC === searchUPC;
        });
        
        if (existingMovie) {
            console.log(`🚨 Found existing movie: ${existingMovie.title}`);
            return {
                exists: true,
                movie: {
                    title: existingMovie.title || 'Unknown Title',
                    year: existingMovie.year || '',
                    upc: existingMovie.upc || '',
                    director: existingMovie.director || '',
                    genre: existingMovie.genre || ''
                }
            };
        } else {
            console.log(`✅ UPC ${upc} not found in existing collection`);
            return { exists: false };
        }
        
    } catch (error) {
        console.error('❌ Error checking Google Sheets for duplicates:', error);
        // If we can't check, assume it's not a duplicate to avoid blocking legitimate adds
        return { exists: false };
    }
}

// Enhanced handleBarcodeDetected function
function handleBarcodeDetected(upc, format = 'unknown') {
    console.log(`🎯 RAW Barcode detected: "${upc}" (format: ${format})`);
    console.log(`🔍 UPC length: ${upc.length}`);
    
    // Handle EAN-13 codes that are actually UPC-A with leading zero
    let cleanUPC = upc;
    if (format === 'ean_13' && upc.length === 13 && upc.startsWith('0')) {
        cleanUPC = upc.substring(1); // Remove the leading zero
        console.log(`🔄 Converted EAN-13 to UPC-A: ${upc} → ${cleanUPC}`);
    }
    
    if (!isValidBarcode(cleanUPC)) {
        console.log('❌ Invalid barcode format');
        showStatus('scanner-status', '❌ Invalid barcode format. Please try again.', 'error');
        return;
    }
    
    // Display the cleaned result
    document.getElementById('scanned-upc').textContent = cleanUPC;
    document.getElementById('scanner-result').style.display = 'block';
    
    // Stop scanner
    if (isScanning) {
        stopScanner();
    }
    
    // Fill UPC field in form with cleaned value
    document.getElementById('upc').value = cleanUPC;
    
    // Enhanced lookup with duplicate checking
    lookupMovieByUPC(cleanUPC);
}

// Rest of scanner.js remains the same...
let scanner = null;
let scannerStream = null;
let isScanning = false;

// Initialize scanner when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupScanner();
    checkBrowserSupport();
});

function checkBrowserSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('❌ Camera API not supported');
        showStatus('scanner-status', '❌ Camera not supported in this browser. Please use Chrome, Edge, or Safari.', 'error');
        return false;
    }
    
    if (!('BarcodeDetector' in window)) {
        console.log('⚠️ Native BarcodeDetector not supported');
        showStatus('scanner-status', 'ℹ️ Advanced barcode detection not available. Manual entry is available below.', 'info');
        startManualBarcodeInput();
        return false;
    }
    
    console.log('✅ Browser supports camera and barcode detection');
    return true;
}

function setupScanner() {
    const startButton = document.getElementById('start-scanner');
    const stopButton = document.getElementById('stop-scanner');

    if (startButton && stopButton) {
        startButton.addEventListener('click', startScanner);
        stopButton.addEventListener('click', stopScanner);
        console.log('✅ Scanner event listeners set up');
    }
}

async function startScanner() {
    if (isScanning) {
        console.log('⚠️ Scanner already running');
        return;
    }

    console.log('📱 Starting barcode scanner...');

    try {
        const video = document.getElementById('scanner-video');
        const startButton = document.getElementById('start-scanner');
        const stopButton = document.getElementById('stop-scanner');

        let constraints = {
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
            }
        };

        console.log('🎥 Requesting camera access...');
        
        try {
            scannerStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            console.log('⚠️ Back camera not available, trying any camera...');
            constraints = { video: true };
            scannerStream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        video.srcObject = scannerStream;
        isScanning = true;
        
        startButton.disabled = true;
        stopButton.disabled = false;

        if ('BarcodeDetector' in window) {
            console.log('✅ Native BarcodeDetector available');
            scanner = new BarcodeDetector({ 
                formats: [
                    'ean_13', 'ean_8', 'upc_a', 'upc_e', 
                    'code_128', 'code_39', 'code_93',
                    'codabar', 'itf'
                ] 
            });
            
            video.addEventListener('loadedmetadata', () => {
                console.log('📹 Video metadata loaded, starting barcode detection');
                scanForBarcodes();
            });
            
            showStatus('scanner-status', '📱 Scanner started! Point your camera at a barcode.', 'success');
        } else {
            console.log('⚠️ Native BarcodeDetector not supported');
            showStatus('scanner-status', '⚠️ Barcode detection not supported. Use manual entry below.', 'info');
            startManualBarcodeInput();
        }

    } catch (error) {
        console.error('❌ Scanner error:', error);
        isScanning = false;
        
        let errorMessage = 'Camera error: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Camera is being used by another application.';
        } else {
            errorMessage += error.message;
        }
        
        showStatus('scanner-status', errorMessage, 'error');
        
        const startButton = document.getElementById('start-scanner');
        const stopButton = document.getElementById('stop-scanner');
        startButton.disabled = false;
        stopButton.disabled = true;
        
        startManualBarcodeInput();
    }
}

function stopScanner() {
    console.log('⏹️ Stopping scanner...');
    
    const video = document.getElementById('scanner-video');
    const startButton = document.getElementById('start-scanner');
    const stopButton = document.getElementById('stop-scanner');

    if (scannerStream) {
        scannerStream.getTracks().forEach(track => {
            track.stop();
            console.log('🔌 Camera track stopped');
        });
        video.srcObject = null;
        scannerStream = null;
    }

    scanner = null;
    isScanning = false;

    startButton.disabled = false;
    stopButton.disabled = true;
    
    document.getElementById('scanner-result').style.display = 'none';
    
    showStatus('scanner-status', '⏹️ Scanner stopped.', 'info');
}

async function scanForBarcodes() {
    if (!scanner || !scannerStream || !isScanning) {
        return;
    }

    const video = document.getElementById('scanner-video');
    
    try {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const barcodes = await scanner.detect(video);
            
            if (barcodes.length > 0) {
                const barcode = barcodes[0];
                console.log('🎯 Barcode detected:', barcode);
                handleBarcodeDetected(barcode.rawValue, barcode.format);
                return;
            }
        }
    } catch (error) {
        console.error('❌ Barcode detection error:', error);
    }

    if (isScanning && scanner) {
        requestAnimationFrame(scanForBarcodes);
    }
}

function startManualBarcodeInput() {
    removeManualBarcodeInput();
    
    console.log('⌨️ Starting manual barcode input');
    
    const manualInputContainer = document.createElement('div');
    manualInputContainer.id = 'manual-barcode-container';
    manualInputContainer.innerHTML = `
        <div style="margin: 20px 0; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 2px solid #ecf0f1;">
            <h4 style="margin-bottom: 15px; color: #2c3e50;">📝 Manual Barcode Entry</h4>
            <p style="margin-bottom: 15px; color: #7f8c8d; font-size: 14px;">
                Enter the UPC/EAN barcode number manually.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap;">
                <input type="text" 
                       id="manual-barcode" 
                       placeholder="Enter UPC/EAN barcode..." 
                       style="padding: 12px 16px; font-size: 16px; width: 250px; border: 2px solid #ecf0f1; border-radius: 8px; text-align: center;">
                <button onclick="handleManualBarcode()" 
                        style="padding: 12px 20px; background: linear-gradient(135deg, #27ae60, #2ecc71); border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    ✅ Submit
                </button>
            </div>
            <p style="margin-top: 10px; color: #95a5a6; font-size: 12px;">
                Look for a series of numbers under the barcode on your DVD/Blu-ray case
            </p>
        </div>
    `;
    
    const scannerContainer = document.querySelector('.scanner-container');
    scannerContainer.appendChild(manualInputContainer);
    
    setTimeout(() => {
        const input = document.getElementById('manual-barcode');
        if (input) {
            input.focus();
            
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleManualBarcode();
                }
            });
        }
    }, 100);
}

function removeManualBarcodeInput() {
    const existingContainer = document.getElementById('manual-barcode-container');
    if (existingContainer) {
        existingContainer.remove();
        console.log('🗑️ Removed manual barcode input');
    }
}

function handleManualBarcode() {
    const input = document.getElementById('manual-barcode');
    const barcode = input.value.trim();
    
    if (barcode) {
        const cleanBarcode = barcode.replace(/[\s-]/g, '');
        
        if (isValidBarcode(cleanBarcode)) {
            console.log('✅ Valid manual barcode entered:', cleanBarcode);
            handleBarcodeDetected(cleanBarcode, 'manual');
            input.value = '';
        } else {
            alert('⚠️ Please enter a valid barcode (8-14 digits)');
            input.focus();
        }
    } else {
        alert('⚠️ Please enter a barcode number');
        input.focus();
    }
}

function isValidBarcode(barcode) {
    const cleanBarcode = barcode.replace(/\D/g, '');
    return cleanBarcode.length >= 8 && cleanBarcode.length <= 14;
}

// Enhanced UPC lookup using Google Apps Script
async function lookupMovieByUPCViaScript(upc) {
    if (!googleScriptUrl) {
        console.log('⚠️ No Google config - skipping Google Apps Script UPC lookup');
        return null;
    }
    
    try {
        console.log(`🔍 Looking up UPC via Google Apps Script: ${upc}`);
        
        const response = await fetch(`${googleScriptUrl}?action=lookupUPCNew&upc=${upc}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Google Apps Script UPC response:', data);
        
        if (data.success && data.data) {
            return data.data;
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Google Apps Script UPC lookup error:', error);
        return null;
    }
}

document.addEventListener('touchmove', function(e) {
    if (isScanning) {
        e.preventDefault();
    }
}, { passive: false });
