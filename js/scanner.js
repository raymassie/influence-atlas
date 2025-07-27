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
    // Start scanner button - check multiple possible IDs for compatibility
    const startBtn = document.getElementById('startScanner') || 
                     document.getElementById('start-scanner');
    if (startBtn) {
        startBtn.addEventListener('click', startScanner);
    }
    
    // Stop scanner button - check multiple possible IDs for compatibility
    const stopBtn = document.getElementById('stopScanner') || 
                    document.getElementById('stop-scanner');
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
    const startBtn = document.getElementById('startScanner') || 
                     document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stopScanner') || 
                    document.getElementById('stop-scanner');
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

// Movie lookup function using free APIs
async function lookupMovieByUPC(upc) {
    console.log("🔍 Looking up movie for UPC:", upc);
    
    try {
        // Try multiple free APIs for movie data
        const apis = [
            `https://api.themoviedb.org/3/find/${upc}?api_key=1b7c076a0e4849aeefd1f3c429c79d3&external_source=imdb_id`,
            `https://api.themoviedb.org/3/search/movie?api_key=1b7c076a0e4849aeefd1f3c429c79d3&query=${encodeURIComponent(upc)}`
        ];
        
        for (const apiUrl of apis) {
            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.movie_results && data.movie_results.length > 0) {
                        const movie = data.movie_results[0];
                        return {
                            title: movie.title,
                            year: movie.release_date ? movie.release_date.split("-")[0] : "",
                            director: "", // Would need additional API call
                            genre: movie.genre_ids ? getGenreName(movie.genre_ids[0]) : "",
                            studio: "",
                            runtime: movie.runtime ? `${movie.runtime} min` : "",
                            upc: upc,
                            asin: "",
                            notes: `Found via TMDB API`
                        };
                    }
                }
            } catch (error) {
                console.warn("API attempt failed:", error);
                continue;
            }
        }
        
        // Fallback: try to search by UPC on Google (limited)
        console.log("No movie data found for UPC:", upc);
        return null;
        
    } catch (error) {
        console.error("Error in movie lookup:", error);
        return null;
    }
}

// Helper function to get genre name from ID
function getGenreName(genreId) {
    const genres = {
        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
        80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
        14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
        9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
        53: "Thriller", 10752: "War", 37: "Western"
    };
    return genres[genreId] || "";
}
}

// Movie lookup function using free APIs
async function lookupMovieByUPC(upc) {
    console.log("🔍 Looking up movie for UPC:", upc);
    
    try {
        // Try multiple free APIs for movie data
        const apis = [
            `https://api.themoviedb.org/3/find/${upc}?api_key=1b7c076a0e4849aeefd1f3c429c79d3&external_source=imdb_id`,
            `https://api.themoviedb.org/3/search/movie?api_key=1b7c076a0e4849aeefd1f3c429c79d3&query=${encodeURIComponent(upc)}`
        ];
        
        for (const apiUrl of apis) {
            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.movie_results && data.movie_results.length > 0) {
                        const movie = data.movie_results[0];
                        return {
                            title: movie.title,
                            year: movie.release_date ? movie.release_date.split("-")[0] : "",
                            director: "", // Would need additional API call
                            genre: movie.genre_ids ? getGenreName(movie.genre_ids[0]) : "",
                            studio: "",
                            runtime: movie.runtime ? `${movie.runtime} min` : "",
                            upc: upc,
                            asin: "",
                            notes: `Found via TMDB API`
                        };
                    }
                }
            } catch (error) {
                console.warn("API attempt failed:", error);
                continue;
            }
        }
        
        // Fallback: try to search by UPC on Google (limited)
        console.log("No movie data found for UPC:", upc);
        return null;
        
    } catch (error) {
        console.error("Error in movie lookup:", error);
        return null;
    }
}

// Helper function to get genre name from ID
function getGenreName(genreId) {
    const genres = {
        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
        80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
        14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
        9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
        53: "Thriller", 10752: "War", 37: "Western"
    };
    return genres[genreId] || "";
}

function handleScannedCode(code) {
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
    
    // Try to fetch movie details from UPC
    lookupMovieByUPC(cleanUPC).then(movieData => {
        if (movieData && movieData.title) {
            // Fill form with fetched data
            fillFormWithMovieData(movieData);
            switchToAddMovieTab();
            showMessage(`✅ Found: ${movieData.title} (${movieData.year || "Unknown year"})`, "success");
        } else {
            // Fallback to just UPC
            fillFormWithMovieData({ upc: cleanUPC });
            switchToAddMovieTab();
            showMessage(`UPC scanned: ${cleanUPC}. Please enter movie details manually.`, "warning");
        }
    }).catch(error => {
        console.error("Error looking up movie:", error);
        // Fallback to just UPC
        fillFormWithMovieData({ upc: cleanUPC });
        switchToAddMovieTab();
        showMessage(`UPC scanned: ${cleanUPC}. Please enter movie details manually.`, "warning");
    });
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
    
    // Special handling for format checkboxes
    if (movieData.format) {
        const formatValue = movieData.format.toLowerCase();
        document.querySelectorAll('.format1, .format2, .format3').forEach(checkbox => {
            if (checkbox.value.toLowerCase() === formatValue) {
                checkbox.checked = true;
            }
        });
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

// Test functions
function testScanner() {
    console.log('Testing scanner functionality...');
    const testUPC = '826663153750'; // Your duplicate UPC
    handleScannedCode(testUPC);
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
    window.scannerTest = {
        testScanner,
        handleScannedCode,
        checkLocalDuplicate
    };
}
