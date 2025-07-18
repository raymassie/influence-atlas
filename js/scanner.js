// Movie Catalog - Barcode Scanner Functionality - Fixed Version
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

        // Request camera access with fallback constraints
        let constraints = {
            video: { 
                facingMode: 'environment', // Try back camera first
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
            }
        };

        console.log('🎥 Requesting camera access...');
        
        try {
            scannerStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            // Fallback to any available camera
            console.log('⚠️ Back camera not available, trying any camera...');
            constraints = { video: true };
            scannerStream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        video.srcObject = scannerStream;
        isScanning = true;
        
        // Update button states
        startButton.disabled = true;
        stopButton.disabled = false;

        // Start barcode detection
        if ('BarcodeDetector' in window) {
            console.log('✅ Native BarcodeDetector available');
            scanner = new BarcodeDetector({ 
                formats: [
                    'ean_13', 'ean_8', 'upc_a', 'upc_e', 
                    'code_128', 'code_39', 'code_93',
                    'codabar', 'itf'
                ] 
            });
            
            // Wait for video to be ready
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
        
        // Reset button states
        const startButton = document.getElementById('start-scanner');
        const stopButton = document.getElementById('stop-scanner');
        startButton.disabled = false;
        stopButton.disabled = true;
        
        // Always offer manual input as fallback
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

    // Update button states
    startButton.disabled = false;
    stopButton.disabled = true;
    
    // Hide result
    document.getElementById('scanner-result').style.display = 'none';
    
    showStatus('scanner-status', '⏹️ Scanner stopped.', 'info');
}

async function scanForBarcodes() {
    if (!scanner || !scannerStream || !isScanning) {
        return;
    }

    const video = document.getElementById('scanner-video');
    
    try {
        // Make sure video is ready
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const barcodes = await scanner.detect(video);
            
            if (barcodes.length > 0) {
                const barcode = barcodes[0];
                console.log('🎯 Barcode detected:', barcode);
                handleBarcodeDetected(barcode.rawValue, barcode.format);
                return; // Stop scanning once we find a barcode
            }
        }
    } catch (error) {
        console.error('❌ Barcode detection error:', error);
        // Don't stop scanning for detection errors, just log them
    }

    // Continue scanning if still active
    if (isScanning && scanner) {
        requestAnimationFrame(scanForBarcodes);
    }
}

function startManualBarcodeInput() {
    // Remove existing manual input first
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
            <div style="margin-top: 15px; font-size: 12px; color: #7f8c8d;">
                <strong>Common UPC examples:</strong><br>
                • 12-digit: 025192354526<br>
                • 13-digit: 0025192354526
            </div>
        </div>
    `;
    
    const scannerContainer = document.querySelector('.scanner-container');
    scannerContainer.appendChild(manualInputContainer);
    
    // Focus on the input field
    setTimeout(() => {
        const input = document.getElementById('manual-barcode');
        if (input) {
            input.focus();
            
            // Allow Enter key to submit
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
        if (isValidBarcode(barcode)) {
            console.log('✅ Valid manual barcode entered:', barcode);
            handleBarcodeDetected(barcode, 'manual');
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
    // Check if it's a valid UPC/EAN barcode (8, 12, 13, or 14 digits)
    const cleanBarcode = barcode.replace(/\D/g, ''); // Remove non-digits
    return cleanBarcode.length >= 8 && cleanBarcode.length <= 14;
}

function handleBarcodeDetected(upc, format = 'unknown') {
    console.log(`🎯 Barcode detected: ${upc} (format: ${format})`);
    
    // Clean up the UPC (remove any non-digit characters)
    const cleanUPC = upc.replace(/\D/g, '');
    
    if (!isValidBarcode(cleanUPC)) {
        console.log('❌ Invalid barcode format');
        showStatus('scanner-status', '❌ Invalid barcode format. Please try again.', 'error');
        return;
    }
    
    // Display the result
    document.getElementById('scanned-upc').textContent = cleanUPC;
    document.getElementById('scanner-result').style.display = 'block';
    
    // Stop scanner
    if (isScanning) {
        stopScanner();
    }
    
    // Fill UPC field in form
    document.getElementById('upc').value = cleanUPC;
    
    // Try to lookup movie details (but don't fail if it doesn't work)
    lookupMovieByUPC(cleanUPC);
    
    // Switch to add movie tab after a brief delay
    setTimeout(() => {
        showTab('add-movie');
        // Update tab styling
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab')[0].classList.add('active');
        
        // Scroll to top of form
        document.getElementById('add-movie').scrollIntoView({ behavior: 'smooth' });
    }, 1500);
    
    showStatus('scanner-status', `✅ Barcode captured: ${cleanUPC}`, 'success');
}

async function lookupMovieByUPC(upc) {
    const loadingDiv = document.getElementById('lookup-loading');
    loadingDiv.style.display = 'block';
    
    console.log(`🔍 Looking up movie details for UPC: ${upc}`);
    
    try {
        showStatus('add-status', '🔍 Looking up movie details...', 'info');
        
        // Try the lookup but don't fail the whole process if it doesn't work
        let movieData = await tryLookupAPIs(upc);
        
        if (movieData) {
            fillFormWithMovieData(movieData);
            showStatus('add-status', `✅ Found: "${movieData.title}"! Please verify and complete the details.`, 'success');
            console.log('✅ Movie data found and form filled:', movieData);
        } else {
            // Don't show this as an error - just inform the user
            showStatus('add-status', `ℹ️ UPC ${upc} captured! Movie details not found in database - please enter manually.`, 'info');
            console.log('ℹ️ No movie data found for UPC, but that\'s okay');
            
            // Focus on the title field so user can start entering data
            setTimeout(() => {
                document.getElementById('title').focus();
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Lookup error:', error);
        showStatus('add-status', `ℹ️ UPC ${upc} captured! Unable to lookup details - please enter manually.`, 'info');
        
        // Focus on the title field
        setTimeout(() => {
            document.getElementById('title').focus();
        }, 500);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function tryLookupAPIs(upc) {
    // Try multiple UPC databases
    const apis = [
        { name: 'UPC Database', func: () => lookupUPCDatabase(upc) },
        { name: 'Barcode Lookup', func: () => lookupBarcodeAPI(upc) }
    ];
    
    for (const api of apis) {
        try {
            console.log(`🌐 Trying ${api.name}...`);
            const result = await api.func();
            if (result) {
                console.log(`✅ ${api.name} returned data:`, result);
                return result;
            }
        } catch (error) {
            console.log(`❌ ${api.name} failed:`, error.message);
            // Continue to next API
        }
    }
    
    console.log('ℹ️ All APIs tried - no movie data found');
    return null;
}

async function lookupUPCDatabase(upc) {
    try {
        // Try the free UPC database
        const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`;
        console.log('🌐 Fetching from UPC database:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 UPC Database response:', data);
        
        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            
            // Extract movie title from product name
            let title = item.title || item.brand || '';
            
            if (!title) {
                console.log('❌ No title found in UPC data');
                return null;
            }
            
            // Clean up title (remove common DVD/Blu-ray text)
            title = cleanMovieTitle(title);
            
            const movieData = {
                title: title,
                year: extractYearFromTitle(title),
                studio: item.brand || '',
                genre: extractGenreFromTitle(title)
            };
            
            console.log('✅ Extracted movie data from UPC:', movieData);
            return movieData;
        }
        
        console.log('❌ No items found in UPC database response');
        return null;
        
    } catch (error) {
        console.error('❌ UPC database error:', error);
        return null; // Don't throw, just return null
    }
}

async function lookupBarcodeAPI(upc) {
    // Alternative API - this is just a placeholder since most require API keys
    console.log('ℹ️ Alternative barcode lookup not implemented');
    return null;
}

function cleanMovieTitle(title) {
    // Remove common DVD/Blu-ray indicators and clean up the title
    return title
        .replace(/\(DVD\)/gi, '')
        .replace(/\(Blu-ray\)/gi, '')
        .replace(/\(4K\)/gi, '')
        .replace(/\(UHD\)/gi, '')
        .replace(/- DVD$/gi, '')
        .replace(/- Blu-ray$/gi, '')
        .replace(/- 4K$/gi, '')
        .replace(/DVD$/gi, '')
        .replace(/Blu-ray$/gi, '')
        .replace(/\[.*?\]/g, '') // Remove anything in square brackets
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
}

function extractYearFromTitle(title) {
    // Look for a 4-digit year in parentheses or at the end
    const yearMatch = title.match(/\((\d{4})\)|(\d{4})$/);
    return yearMatch ? (yearMatch[1] || yearMatch[2]) : '';
}

function extractGenreFromTitle(title) {
    // Simple genre detection based on keywords in title
    const lowerTitle = title.toLowerCase();
    
    const genreKeywords = {
        'Action': ['action', 'fight', 'battle', 'war', 'combat'],
        'Comedy': ['comedy', 'funny', 'laugh', 'humor'],
        'Drama': ['drama', 'story'],
        'Horror': ['horror', 'scary', 'fear', 'terror'],
        'Thriller': ['thriller', 'suspense'],
        'Romance': ['romance', 'love'],
        'Sci-Fi': ['sci-fi', 'science fiction', 'space', 'future'],
        'Fantasy': ['fantasy', 'magic', 'wizard'],
        'Animation': ['animation', 'animated', 'cartoon'],
        'Documentary': ['documentary']
    };
    
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
            return genre;
        }
    }
    
    return '';
}
