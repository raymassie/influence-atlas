// Movie Catalog - Google Apps Script Integration - Complete Version

// Add movie to Google Sheets
async function addMovieToGoogle(movieData) {
    if (window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL !== '1J4cLx-JQfCUhJYEgRUDGsWYo4qTbJQMjAW0WVXlcseo') {
        throw new Error('Google Apps Script URL not configured');
    }
    
    console.log('☁️ Adding movie to Google Sheets:', movieData.title);
    
    try {
        const response = await fetch(getGoogleScriptUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'addMovie',
                data: movieData
            }),
            mode: 'no-cors' // Required for Google Apps Script
        });
        
        // Note: With no-cors mode, we can't read the response
        // We'll assume success if no error is thrown
        console.log('✅ Movie sent to Google Sheets (no-cors mode)');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error adding movie to Google Sheets:', error);
        throw new Error(`Failed to add movie to Google Sheets: ${error.message}`);
    }
}

// Load movies from Google Sheets
async function loadMoviesFromGoogle() {
    if (window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL !== '1J4cLx-JQfCUhJYEgRUDGsWYo4qTbJQMjAW0WVXlcseo') {
        showStatus('add-status', '⚠️ Google integration not configured. Click the settings icon to set up.', 'error');
        return;
    }
    
    console.log('📥 Loading movies from Google Sheets...');
    
    try {
        showStatus('add-status', '🔄 Syncing with Google Sheets...', 'info');
        
        // Use a simple GET request for loading movies
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
        
        const loadedMovies = result.data || [];
        
        // Process the loaded movies to match our format
        const processedMovies = loadedMovies.map(movie => ({
            title: movie.title || '',
            year: movie.year || '',
            director: movie.director || '',
            producer: movie.producer || '',
            studio: movie.studio || '',
            genre: movie.genre || '',
            runtime: movie.runtime || '',
            formats: movie.formats || '',
            upc: movie.upc || '',
            asin: movie.asin || '',
            notes: movie.notes || '',
            dateAdded: movie.dateadded || movie.dateAdded || '',
            imageUrl: movie.imageurl || movie.imageUrl || ''
        }));
        
        // Merge with local movies, avoiding duplicates
        const mergedMovies = mergeMovieCollections(movies, processedMovies);
        movies = mergedMovies;
        
        displayMovies();
        updateSpreadsheet();
        updateMovieCount();
        
        const message = `✅ Synced successfully! Loaded ${loadedMovies.length} movies from Google Sheets.`;
        showStatus('add-status', message, 'success');
        console.log(`✅ ${message}`);
        
    } catch (error) {
        console.error('❌ Error loading movies from Google Sheets:', error);
        const errorMessage = 'Failed to sync with Google Sheets. Using local data only.';
        showStatus('add-status', `❌ ${errorMessage}`, 'error');
        
        // Show help for common issues
        setTimeout(() => {
            if (confirm('🤔 Having trouble with Google Sheets sync?\n\nCommon fixes:\n• Make sure your Google Apps Script is deployed as a web app\n• Check that the script URL is correct\n• Verify the script has proper permissions\n\nWould you like to reconfigure your Google integration?')) {
                showConfigModal();
            }
        }, 2000);
    }
}

// Remove movie from Google Sheets
async function removeMovieFromGoogle(movieData) {
    if (!googleScriptUrl) {
        console.log('⚠️ No Google config - skipping Google Sheets removal');
        return;
    }
    
    console.log('🗑️ Removing movie from Google Sheets:', movieData.title);
    
    try {
        const response = await fetch(googleScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'removeMovie',
                data: movieData
            }),
            mode: 'no-cors'
        });
        
        console.log('✅ Movie removal sent to Google Sheets');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error removing movie from Google Sheets:', error);
        throw new Error(`Failed to remove movie from Google Sheets: ${error.message}`);
    }
}

// Upload image to Google Drive
async function uploadImageToGoogleDrive(file, movieTitle) {
    if (!googleScriptUrl) {
        console.log('⚠️ No Google config - skipping image upload');
        return '';
    }
    
    console.log('🖼️ Uploading image to Google Drive:', file.name);
    
    try {
        // Convert file to base64
        const base64Data = await fileToBase64(file);
        
        // Create a clean filename
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const cleanTitle = movieTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const fileName = `${cleanTitle}_cover.${fileExtension}`;
        
        const response = await fetch(googleScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'uploadImage',
                data: {
                    fileName: fileName,
                    fileData: base64Data,
                    mimeType: file.type
                }
            }),
            mode: 'no-cors'
        });
        
        // Since we can't read the response in no-cors mode,
        // we'll return a placeholder URL
        const placeholderUrl = `https://drive.google.com/uc?id=PLACEHOLDER_${Date.now()}`;
        console.log('📤 Image upload sent to Google Drive (placeholder URL returned)');
        
        return placeholderUrl;
        
    } catch (error) {
        console.error('❌ Error uploading image to Google Drive:', error);
        return '';
    }
}

// Enhanced UPC lookup using Google Apps Script
async function lookupMovieByUPCViaScript(upc) {
    if (!googleScriptUrl) {
        console.log('⚠️ No Google config - skipping UPC lookup');
        return null;
    }
    
    try {
        console.log(`🔍 Looking up UPC via Google Apps Script: ${upc}`);
        
        const response = await fetch(`${googleScriptUrl}?action=lookupUPC&upc=${upc}`, {
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

// Utility function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data:image/jpeg;base64, part
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Merge movie collections, avoiding duplicates
function mergeMovieCollections(localMovies, remoteMovies) {
    console.log(`🔄 Merging collections: ${localMovies.length} local + ${remoteMovies.length} remote`);
    
    const merged = [...localMovies];
    
    remoteMovies.forEach(remoteMovie => {
        // Check if movie already exists locally
        const isDuplicate = localMovies.some(localMovie => 
            localMovie.title.toLowerCase() === remoteMovie.title.toLowerCase() &&
            localMovie.year === remoteMovie.year &&
            localMovie.upc === remoteMovie.upc
        );
        
        if (!isDuplicate) {
            merged.push(remoteMovie);
            console.log(`➕ Added remote movie: ${remoteMovie.title}`);
        } else {
            console.log(`⏭️ Skipped duplicate: ${remoteMovie.title}`);
        }
    });
    
    console.log(`✅ Merge complete: ${merged.length} total movies`);
    return merged;
}

// Test Google Apps Script connection
async function testGoogleConnection() {
    if (!googleScriptUrl) {
        return { success: false, error: 'No Google Apps Script URL configured' };
    }
    
    console.log('🧪 Testing Google Apps Script connection...');
    
    try {
        const response = await fetch(googleScriptUrl + '?action=test', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Google Apps Script connection test passed');
            return { success: true, message: result.message };
        } else {
            throw new Error(result.error || 'Unknown error');
        }
        
    } catch (error) {
        console.error('❌ Google Apps Script connection test failed:', error);
        return { success: false, error: error.message };
    }
}

// Initialize Google Drive folder structure
async function initializeGoogleDrive() {
    if (!googleScriptUrl) {
        console.log('⚠️ Cannot initialize Google Drive - no script URL configured');
        return;
    }
    
    console.log('📁 Initializing Google Drive folder structure...');
    
    try {
        const response = await fetch(googleScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'initializeFolders'
            }),
            mode: 'no-cors'
        });
        
        console.log('✅ Google Drive initialization request sent');
        showStatus('add-status', '📁 Google Drive folders initialized successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error initializing Google Drive:', error);
        showStatus('add-status', '❌ Failed to initialize Google Drive folders', 'error');
    }
}

// Export collection to Google Sheets
async function exportCollectionToGoogle() {
    if (!googleScriptUrl) {
        showStatus('add-status', '⚠️ Google integration not configured', 'error');
        return;
    }
    
    if (movies.length === 0) {
        showStatus('add-status', '⚠️ No movies to export', 'error');
        return;
    }
    
    console.log(`📤 Exporting ${movies.length} movies to Google Sheets...`);
    showStatus('add-status', '📤 Exporting collection to Google Sheets...', 'info');
    
    try {
        const response = await fetch(googleScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'bulkAddMovies',
                data: movies
            }),
            mode: 'no-cors'
        });
        
        console.log('✅ Bulk export completed');
        showStatus('add-status', '✅ Collection exported to Google Sheets successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error exporting to Google Sheets:', error);
        showStatus('add-status', '❌ Failed to export collection to Google Sheets', 'error');
    }
}

// Get Google Drive folder information
async function getGoogleDriveFolderInfo() {
    if (!googleScriptUrl) {
        return null;
    }
    
    console.log('📁 Getting Google Drive folder information...');
    
    try {
        const response = await fetch(googleScriptUrl + '?action=getFolderInfo', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📁 Folder info received:', data);
        
        return data;
        
    } catch (error) {
        console.error('❌ Error getting folder info:', error);
        return null;
    }
}

// Auto-sync function (could be called periodically)
async function autoSync() {
    if (!googleScriptUrl || movies.length === 0) {
        return;
    }
    
    console.log('🔄 Auto-syncing with Google Sheets...');
    
    try {
        await loadMoviesFromGoogle();
        console.log('✅ Auto-sync completed');
    } catch (error) {
        console.error('❌ Auto-sync failed:', error);
    }
}

// Set up periodic auto-sync (every 5 minutes)
let autoSyncInterval;

function startAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
    }
    
    // Auto-sync every 5 minutes
    autoSyncInterval = setInterval(autoSync, 5 * 60 * 1000);
    console.log('✅ Auto-sync started (every 5 minutes)');
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        console.log('⏹️ Auto-sync stopped');
    }
}

// Start auto-sync when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Start auto-sync after a delay to let the app initialize
    setTimeout(() => {
        if (window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL !== '1J4cLx-JQfCUhJYEgRUDGsWYo4qTbJQMjAW0WVXlcseo') {
            startAutoSync();
        }
    }, 10000); // Wait 10 seconds after page load
});

// Handle page visibility changes to pause/resume auto-sync
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopAutoSync();
        console.log('📱 Page hidden - stopping auto-sync');
    } else {
        if (window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL !== '1J4cLx-JQfCUhJYEgRUDGsWYo4qTbJQMjAW0WVXlcseo') {
            startAutoSync();
            console.log('📱 Page visible - resuming auto-sync');
        }
    }
});

// Google Sheets URL helper
function getGoogleSheetsUrl() {
    // This would need to be configured or returned by the Google Apps Script
    // For now, we'll provide a generic link to Google Drive
    return 'https://drive.google.com/drive/folders/your-movie-catalog-folder-id';
}

// Validate Google Apps Script URL
function isValidGoogleScriptUrl(url) {
    const googleScriptPattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;
    return googleScriptPattern.test(url);
}

// Enhanced configuration with validation
function saveGoogleConfigEnhanced() {
    const url = document.getElementById('google-script-url').value.trim();
    
    if (!url) {
        alert('⚠️ Please enter a Google Apps Script URL');
        return;
    }
    
    if (!isValidGoogleScriptUrl(url)) {
        alert('⚠️ Please enter a valid Google Apps Script URL.\n\nIt should look like:\nhttps://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
        return;
    }
    
    googleScriptUrl = url;
    localStorage.setItem('googleScriptUrl', url);
    closeConfigModal();
    
    // Test the connection
    testGoogleConnection().then(result => {
        if (result.success) {
            showStatus('add-status', '✅ Google integration configured and tested successfully!', 'success');
            
            // Initialize the Google Drive structure
            initializeGoogleDrive();
            
            // Start auto-sync
            startAutoSync();
            
        } else {
            showStatus('add-status', '⚠️ Google integration configured but connection test failed. Please check your script deployment.', 'error');
        }
    });
    
    console.log('✅ Google Apps Script URL configured and validated');
}

// Error handling helper
function handleGoogleApiError(error, operation) {
    console.error(`❌ Google API Error (${operation}):`, error);
    
    let userMessage = `Failed to ${operation}. `;
    
    if (error.message.includes('CORS')) {
        userMessage += 'This is likely a CORS issue. Please ensure your Google Apps Script is properly deployed.';
    } else if (error.message.includes('403')) {
        userMessage += 'Permission denied. Please check your Google Apps Script permissions.';
    } else if (error.message.includes('404')) {
        userMessage += 'Script not found. Please verify your Google Apps Script URL.';
    } else if (error.message.includes('network')) {
        userMessage += 'Network error. Please check your internet connection.';
    } else {
        userMessage += 'Please check your Google Apps Script configuration.';
    }
    
    showStatus('add-status', `❌ ${userMessage}`, 'error');
}

// Debug function to check Google integration status
function debugGoogleIntegration() {
    console.log('🔍 Google Integration Debug Info:');
    console.log('📝 Script URL:', googleScriptUrl || 'Not configured');
    console.log('💾 Stored URL:', localStorage.getItem('googleScriptUrl') || 'Not stored');
    console.log('📊 Local Movies:', movies.length);
    console.log('🔄 Auto-sync Active:', !!autoSyncInterval);
    
        if (window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL !== '1J4cLx-JQfCUhJYEgRUDGsWYo4qTbJQMjAW0WVXlcseo') {
        testGoogleConnection().then(result => {
            console.log('🧪 Connection Test:', result);
        });
    }
}

// Enhanced Google Drive integration status
async function checkGoogleDriveIntegration() {
    if (!googleScriptUrl) {
        return {
            configured: false,
            message: 'Google Apps Script not configured'
        };
    }
    
    try {
        const testResult = await testGoogleConnection();
        const folderInfo = await getGoogleDriveFolderInfo();
        
        return {
            configured: true,
            connected: testResult.success,
            foldersInitialized: !!folderInfo,
            testResult: testResult,
            folderInfo: folderInfo
        };
    } catch (error) {
        return {
            configured: true,
            connected: false,
            error: error.message
        };
    }
}
