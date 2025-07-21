// Movie Catalog - Main Application Logic with Duplicate Prevention
// Global variables
let movies = [];
let googleScriptUrl = '';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🎬 Initializing Movie Catalog App...');
    setupForm();
    checkGoogleConfiguration();
    loadMoviesFromMemory();
    displayMovies();
    updateSpreadsheet();
    updateMovieCount();
}

// Configuration management
function checkGoogleConfiguration() {
    const savedUrl = localStorage.getItem('googleScriptUrl');
    if (savedUrl) {
        googleScriptUrl = savedUrl;
        showStatus('add-status', '☁️ Google integration configured. Ready to sync!', 'success');
        console.log('✅ Google Apps Script URL loaded from storage');
    } else {
        console.log('⚠️ No Google configuration found');
        // Show modal after a short delay to let the page load
        setTimeout(showConfigModal, 1000);
    }
}

function showConfigModal() {
    document.getElementById('config-modal').style.display = 'flex';
}

function closeConfigModal() {
    document.getElementById('config-modal').style.display = 'none';
}

function saveGoogleConfig() {
    const url = document.getElementById('google-script-url').value.trim();
    if (url && url.includes('script.google.com')) {
        googleScriptUrl = url;
        localStorage.setItem('googleScriptUrl', url);
        closeConfigModal();
        showStatus('add-status', '✅ Google integration configured successfully!', 'success');
        console.log('✅ Google Apps Script URL saved');
    } else {
        alert('❌ Please enter a valid Google Apps Script URL starting with https://script.google.com/');
    }
}

// Tab functionality
function showTab(tabName, event) {
    console.log(`🔄 Switching to tab: ${tabName}`);
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab - handle both event and direct calls
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Find the correct tab button when called programmatically
        const tabButtons = document.querySelectorAll('.tab');
        const tabMap = {
            'add-movie': 0,
            'scanner': 1,
            'collection': 2,
            'spreadsheet': 3
        };
        if (tabMap[tabName] !== undefined) {
            tabButtons[tabMap[tabName]].classList.add('active');
        }
    }
    
    // Load data when switching to collection or spreadsheet
    if (tabName === 'collection' || tabName === 'spreadsheet') {
        if (googleScriptUrl) {
            loadMoviesFromGoogle();
        }
    }
}

// Form setup
function setupForm() {
    const movieForm = document.getElementById('movieForm');
    const format2Container = document.getElementById('format2-container');
    const format3Container = document.getElementById('format3-container');
    const streamingCheckbox = document.querySelector('input[value="Streaming"]');

    // Show or hide additional format options based on Streaming selection
    streamingCheckbox.addEventListener('change', function() {
        const showAdditionalFormats = this.checked;
        format2Container.style.display = showAdditionalFormats ? 'flex' : 'none';
        format3Container.style.display = showAdditionalFormats ? 'flex' : 'none';
        console.log(`🔄 Streaming formats ${showAdditionalFormats ? 'shown' : 'hidden'}`);
    });

    movieForm.addEventListener('submit', function(event) {
        event.preventDefault();
        addMovie();
    });

    console.log('✅ Form event listeners set up');
}

// Enhanced addMovie function with duplicate checking
async function addMovie() {
    const addButton = document.getElementById('addMovieButton');
    const buttonText = addButton.querySelector('.button-text');
    const loading = document.getElementById('add-loading');
    
    console.log('🎬 Starting to add movie...');
    
    // Show loading state
    addButton.disabled = true;
    buttonText.textContent = 'Adding...';
    loading.style.display = 'inline-block';

    try {
        // Validate form
        if (!validateForm()) {
            return;
        }

        // Gather form data
        const movieData = gatherFormData();
        console.log('📝 Movie data gathered:', movieData);

        // Check for duplicates BEFORE processing
        const duplicateCheck = checkForDuplicates(movieData);
        if (duplicateCheck.isDuplicate) {
            const proceed = confirm(
                `🚨 Duplicate Movie Detected!\n\n` +
                `"${movieData.title}" (${movieData.year || 'Unknown Year'}) appears to already be in your collection.\n\n` +
                `${duplicateCheck.reason}\n\n` +
                `Do you want to add it anyway?`
            );
            
            if (!proceed) {
                showStatus('add-status', '⏭️ Movie not added - duplicate detected.', 'info');
                return;
            }
        }

        // Handle image upload if present
        const imageFile = document.getElementById('image').files[0];
        if (imageFile) {
            console.log('🖼️ Uploading image...');
            if (googleScriptUrl) {
                movieData.imageUrl = await uploadImageToGoogleDrive(imageFile, movieData.title);
                console.log('✅ Image uploaded:', movieData.imageUrl);
            } else {
                console.log('⚠️ No Google config - skipping image upload');
            }
        }

        // Add to Google Sheets
        if (googleScriptUrl) {
            console.log('☁️ Adding movie to Google Sheets...');
            await addMovieToGoogle(movieData);
            console.log('✅ Movie added to Google Sheets');
        } else {
            console.log('⚠️ No Google config - skipping Google Sheets sync');
        }

        // Add to local array
        movies.push(movieData);
        console.log(`📚 Movie added to local collection. Total: ${movies.length}`);

        // Refresh displays
        displayMovies();
        updateSpreadsheet();
        updateMovieCount();

        // Clear the form
        clearForm();

        showStatus('add-status', `✅ "${movieData.title}" added successfully!`, 'success');
        
        // Switch to collection tab to show the new movie
        setTimeout(() => {
            showTab('collection');
        }, 1000);

    } catch (error) {
        console.error('❌ Error adding movie:', error);
        showStatus('add-status', '❌ Error adding movie: ' + error.message, 'error');
    } finally {
        // Reset button state
        addButton.disabled = false;
        buttonText.textContent = '➕ Add Movie';
        loading.style.display = 'none';
    }
}

// New function to check for duplicates
function checkForDuplicates(newMovie) {
    console.log('🔍 Checking for duplicates...');
    
    const title = newMovie.title.toLowerCase().trim();
    const year = newMovie.year;
    const upc = newMovie.upc;
    
    // Check by UPC first (most reliable)
    if (upc) {
        const upcMatch = movies.find(movie => 
            movie.upc && movie.upc === upc
        );
        
        if (upcMatch) {
            console.log('🚨 Duplicate found by UPC:', upcMatch.title);
            return {
                isDuplicate: true,
                reason: `Same UPC (${upc}) already exists for "${upcMatch.title}"`
            };
        }
    }
    
    // Check by title and year (secondary check)
    if (title && year) {
        const titleYearMatch = movies.find(movie => 
            movie.title.toLowerCase().trim() === title && 
            movie.year === year
        );
        
        if (titleYearMatch) {
            console.log('🚨 Duplicate found by title+year:', titleYearMatch.title);
            return {
                isDuplicate: true,
                reason: `"${titleYearMatch.title}" (${year}) already exists in your collection`
            };
        }
    }
    
    // Check by title only (loose check)
    if (title) {
        const titleMatch = movies.find(movie => 
            movie.title.toLowerCase().trim() === title
        );
        
        if (titleMatch) {
            console.log('⚠️ Possible duplicate found by title:', titleMatch.title);
            return {
                isDuplicate: true,
                reason: `"${titleMatch.title}" might already exist (year: ${titleMatch.year || 'Unknown'})`
            };
        }
    }
    
    console.log('✅ No duplicates found');
    return {
        isDuplicate: false,
        reason: null
    };
}

function validateForm() {
    const format1Checkboxes = Array.from(document.querySelectorAll('.format1'));
    const format2Checkboxes = Array.from(document.querySelectorAll('.format2'));
    const format3Checkboxes = Array.from(document.querySelectorAll('.format3'));
    const streamingCheckbox = document.querySelector('input[value="Streaming"]');

    const format1Checked = format1Checkboxes.some(cb => cb.checked);
    const format2Checked = format2Checkboxes.some(cb => cb.checked);
    const format3Checked = format3Checkboxes.some(cb => cb.checked);

    if (!format1Checked) {
        showStatus('add-status', '⚠️ Please select at least one format (DVD, Blu-ray, 4K, or Streaming).', 'error');
        return false;
    }

    if (streamingCheckbox.checked && (!format2Checked || !format3Checked)) {
        showStatus('add-status', '⚠️ When Streaming is selected, please choose streaming platform and quality options.', 'error');
        return false;
    }

    const title = document.getElementById('title').value.trim();
    if (!title) {
        showStatus('add-status', '⚠️ Movie title is required!', 'error');
        return false;
    }

    return true;
}

function gatherFormData() {
    const format1Checkboxes = Array.from(document.querySelectorAll('.format1'));
    const format2Checkboxes = Array.from(document.querySelectorAll('.format2'));
    const format3Checkboxes = Array.from(document.querySelectorAll('.format3'));

    return {
        title: document.getElementById('title').value.trim(),
        director: document.getElementById('director').value.trim(),
        producer: document.getElementById('producer').value.trim(),
        studio: document.getElementById('studio').value.trim(),
        runtime: document.getElementById('runtime').value.trim(),
        genre: document.getElementById('genre').value,
        year: document.getElementById('year').value.trim(),
        formats: [
            ...format1Checkboxes.filter(cb => cb.checked).map(cb => cb.value),
            ...format2Checkboxes.filter(cb => cb.checked).map(cb => cb.value),
            ...format3Checkboxes.filter(cb => cb.checked).map(cb => cb.value)
        ].join(', '),
        upc: document.getElementById('upc').value.trim(),
        asin: document.getElementById('asin').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        dateAdded: new Date().toLocaleDateString(),
        imageUrl: ''
    };
}

function clearForm() {
    document.getElementById('movieForm').reset();
    document.getElementById('format2-container').style.display = 'none';
    document.getElementById('format3-container').style.display = 'none';
    console.log('✅ Form cleared');
}

// Movie management
function loadMoviesFromMemory() {
    // Initialize empty array - in production, this could load from localStorage as backup
    movies = [];
    console.log('📚 Initialized empty movie collection');
}

function displayMovies() {
    const movieList = document.getElementById('movieList');
    
    if (movies.length === 0) {
        movieList.innerHTML = `
            <div class="empty-state">
                <h3>📽️ Start Building Your Collection</h3>
                <p>Add movies manually using the form above, or use the barcode scanner to get started quickly!</p>
                <p>Your collection will sync with Google Drive automatically.</p>
            </div>
        `;
        return;
    }

    console.log(`📚 Displaying ${movies.length} movies`);
    movieList.innerHTML = '';

    movies.forEach((movie, index) => {
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-item');
        movieItem.innerHTML = `
            ${movie.imageUrl ? `<img src="${movie.imageUrl}" alt="${movie.title}" style="width: 60px; height: 80px; object-fit: cover; float: right; border-radius: 6px; margin-left: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">` : ''}
            <h3>${movie.title} ${movie.year ? `(${movie.year})` : ''}</h3>
            <div class="movie-meta">
                ${movie.director ? `<div><strong>🎬 Director:</strong> ${movie.director}</div>` : ''}
                ${movie.producer ? `<div><strong>👨‍💼 Producer:</strong> ${movie.producer}</div>` : ''}
                ${movie.studio ? `<div><strong>🏢 Studio:</strong> ${movie.studio}</div>` : ''}
                ${movie.genre ? `<div><strong>🎭 Genre:</strong> ${movie.genre}</div>` : ''}
                ${movie.runtime ? `<div><strong>⏱️ Runtime:</strong> ${movie.runtime}</div>` : ''}
                ${movie.formats ? `<div><strong>💿 Formats:</strong> ${movie.formats}</div>` : ''}
                ${movie.upc ? `<div><strong>🔢 UPC:</strong> ${movie.upc}</div>` : ''}
                ${movie.asin ? `<div><strong>📦 ASIN:</strong> ${movie.asin}</div>` : ''}
                ${movie.notes ? `<div><strong>📝 Notes:</strong> ${movie.notes}</div>` : ''}
                <div><strong>📅 Added:</strong> ${movie.dateAdded}</div>
            </div>
            <button class="remove-button" onclick="removeMovie(${index})">🗑️ Remove</button>
        `;
        movieList.appendChild(movieItem);
    });
}

function removeMovie(index) {
    const movie = movies[index];
    const confirmMessage = `🗑️ Are you sure you want to remove "${movie.title}" from your collection?`;
    
    if (confirm(confirmMessage)) {
        console.log(`🗑️ Removing movie: ${movie.title}`);
        
        // Remove from Google Sheets
        if (googleScriptUrl) {
            removeMovieFromGoogle(movie).catch(error => {
                console.error('❌ Error removing from Google Sheets:', error);
                showStatus('add-status', '⚠️ Movie removed locally but may still exist in Google Sheets', 'error');
            });
        }
        
        // Remove from local array
        movies.splice(index, 1);
        displayMovies();
        updateSpreadsheet();
        updateMovieCount();
        
        showStatus('add-status', `✅ "${movie.title}" removed successfully!`, 'success');
        console.log(`✅ Movie removed. Remaining: ${movies.length}`);
    }
}

function filterMovies() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const movieItems = document.querySelectorAll('.movie-item');
    let visibleCount = 0;
    
    movieItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm);
        item.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
    });

    console.log(`🔍 Search "${searchTerm}" - showing ${visibleCount} of ${movieItems.length} movies`);
    
    // Update movie count with filtered results
    if (searchTerm) {
        document.getElementById('movie-count').textContent = `${visibleCount} of ${movies.length} movies`;
    } else {
        updateMovieCount();
    }
}

function updateMovieCount() {
    const count = movies.length;
    const countElement = document.getElementById('movie-count');
    if (countElement) {
        countElement.textContent = `${count} movie${count !== 1 ? 's' : ''}`;
    }
}

// Enhanced loadMoviesFromGoogle with duplicate prevention
async function loadMoviesFromGoogle() {
    if (!googleScriptUrl) {
        showStatus('add-status', '⚠️ Google integration not configured. Click the settings icon to set up.', 'error');
        return;
    }
    
    console.log('📥 Loading movies from Google Sheets...');
    
    try {
        showStatus('add-status', '🔄 Syncing with Google Sheets...', 'info');
        
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
        const mergeResult = mergeMovieCollections(movies, processedMovies);
        movies = mergeResult.movies;
        
        displayMovies();
        updateSpreadsheet();
        updateMovieCount();
        
        const message = `✅ Synced successfully! ${mergeResult.added} new movies loaded, ${mergeResult.duplicates} duplicates skipped.`;
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

// Enhanced merge function with duplicate detection
function mergeMovieCollections(localMovies, remoteMovies) {
    console.log(`🔄 Merging collections: ${localMovies.length} local + ${remoteMovies.length} remote`);
    
    const merged = [...localMovies];
    let addedCount = 0;
    let duplicateCount = 0;
    
    remoteMovies.forEach(remoteMovie => {
        // Check if movie already exists locally
        const isDuplicate = localMovies.some(localMovie => {
            // Primary check: UPC match
            if (remoteMovie.upc && localMovie.upc && remoteMovie.upc === localMovie.upc) {
                return true;
            }
            
            // Secondary check: Title + Year match
            if (remoteMovie.title && localMovie.title && remoteMovie.year && localMovie.year) {
                return remoteMovie.title.toLowerCase().trim() === localMovie.title.toLowerCase().trim() &&
                       remoteMovie.year === localMovie.year;
            }
            
            // Tertiary check: Title only (if no year available)
            if (remoteMovie.title && localMovie.title && !remoteMovie.year && !localMovie.year) {
                return remoteMovie.title.toLowerCase().trim() === localMovie.title.toLowerCase().trim();
            }
            
            return false;
        });
        
        if (!isDuplicate) {
            merged.push(remoteMovie);
            addedCount++;
            console.log(`➕ Added remote movie: ${remoteMovie.title}`);
        } else {
            duplicateCount++;
            console.log(`⏭️ Skipped duplicate: ${remoteMovie.title}`);
        }
    });
    
    console.log(`✅ Merge complete: ${merged.length} total movies (${addedCount} added, ${duplicateCount} duplicates skipped)`);
    
    return {
        movies: merged,
        added: addedCount,
        duplicates: duplicateCount
    };
}

// Spreadsheet management
function updateSpreadsheet() {
    const tbody = document.getElementById('spreadsheet-body');
    tbody.innerHTML = '';

    if (movies.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="10" class="empty-state">
                <div>
                    <h3>📊 No Movies Yet</h3>
                    <p>Add some movies to see them in the spreadsheet view!</p>
                </div>
            </td>
        `;
        tbody.appendChild(row);
        return;
    }

    console.log(`📊 Updating spreadsheet with ${movies.length} movies`);

    movies.forEach((movie, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${movie.imageUrl ? `<img src="${movie.imageUrl}" alt="${movie.title}" class="cover-image">` : '📀'}</td>
            <td><strong>${movie.title}</strong></td>
            <td>${movie.year}</td>
            <td>${movie.director}</td>
            <td>${movie.genre}</td>
            <td>${movie.runtime}</td>
            <td>${movie.formats}</td>
            <td>${movie.upc}</td>
            <td>${movie.dateAdded}</td>
            <td><button class="remove-button" onclick="removeMovie(${index})" title="Remove ${movie.title}">🗑️</button></td>
        `;
        tbody.appendChild(row);
    });
}

function openGoogleSheet() {
    if (!googleScriptUrl) {
        showConfigModal();
        return;
    }
    
    // Extract the script ID from the URL to construct the spreadsheet URL
    // This is a simplified approach - in practice, you'd store the actual sheet ID
    const message = `
🔗 To open your Google Sheet:

1. Go to Google Drive (drive.google.com)
2. Look for the "MovieCatalog" folder
3. Open the "Movie Collection" spreadsheet

Or ask your Google Apps Script to return the sheet URL.
    `;
    
    alert(message);
}

// Export functions
function exportToCSV() {
    if (movies.length === 0) {
        alert('📊 No movies to export! Add some movies first.');
        return;
    }

    console.log('📥 Exporting to CSV...');

    const headers = ['Title', 'Year', 'Director', 'Producer', 'Studio', 'Genre', 'Runtime', 'Formats', 'UPC', 'ASIN', 'Notes', 'Date Added', 'Image URL'];
    const csvContent = [
        headers.join(','),
        ...movies.map(movie => [
            `"${movie.title.replace(/"/g, '""')}"`,
            `"${movie.year}"`,
            `"${movie.director.replace(/"/g, '""')}"`,
            `"${movie.producer.replace(/"/g, '""')}"`,
            `"${movie.studio.replace(/"/g, '""')}"`,
            `"${movie.genre}"`,
            `"${movie.runtime.replace(/"/g, '""')}"`,
            `"${movie.formats.replace(/"/g, '""')}"`,
            `"${movie.upc}"`,
            `"${movie.asin}"`,
            `"${movie.notes.replace(/"/g, '""')}"`,
            `"${movie.dateAdded}"`,
            `"${movie.imageUrl}"`
        ].join(','))
    ].join('\n');

    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csvContent, `movie-collection-${timestamp}.csv`, 'text/csv');
    
    showStatus('add-status', '📥 CSV file downloaded successfully!', 'success');
    console.log('✅ CSV export completed');
}

function exportToJSON() {
    if (movies.length === 0) {
        alert('📊 No movies to export! Add some movies first.');
        return;
    }

    console.log('📥 Exporting to JSON...');

    const exportData = {
        exportDate: new Date().toISOString(),
        totalMovies: movies.length,
        collection: movies
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(jsonContent, `movie-collection-${timestamp}.json`, 'application/json');
    
    showStatus('add-status', '📥 JSON file downloaded successfully!', 'success');
    console.log('✅ JSON export completed');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`💾 Downloaded: ${filename}`);
}

// Status message function
function showStatus(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = `status-message status-${type}`;
    statusElement.style.display = 'block';
    
    console.log(`📢 Status (${type}): ${message}`);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 5000);
}

// Enhanced form auto-fill with duplicate warning
function fillFormWithMovieData(movieData) {
    console.log('📝 Auto-filling form with movie data:', movieData);
    
    // Check if this movie might already exist
    let duplicateCheck = { isDuplicate: false };
    if (movieData.upc) {
        duplicateCheck = checkForDuplicates(movieData);
        if (duplicateCheck.isDuplicate) {
            showStatus('add-status', 
                `⚠️ Warning: ${duplicateCheck.reason}. Please verify before adding.`, 
                'error'
            );
        }
    }
    
    if (movieData.title) {
        document.getElementById('title').value = movieData.title;
        console.log(`✅ Title set: ${movieData.title}`);
    }
    if (movieData.director) {
        document.getElementById('director').value = movieData.director;
        console.log(`✅ Director set: ${movieData.director}`);
    }
    if (movieData.year) {
        document.getElementById('year').value = movieData.year;
        console.log(`✅ Year set: ${movieData.year}`);
    }
    if (movieData.genre) {
        const genreSelect = document.getElementById('genre');
        for (let option of genreSelect.options) {
            if (option.value.toLowerCase() === movieData.genre.toLowerCase()) {
                genreSelect.value = option.value;
                console.log(`✅ Genre set: ${option.value}`);
                break;
            }
        }
    }
    if (movieData.runtime) {
        document.getElementById('runtime').value = movieData.runtime;
        console.log(`✅ Runtime set: ${movieData.runtime}`);
    }
    if (movieData.studio) {
        document.getElementById('studio').value = movieData.studio;
        console.log(`✅ Studio set: ${movieData.studio}`);
    }
    if (movieData.producer) {
        document.getElementById('producer').value = movieData.producer;
        console.log(`✅ Producer set: ${movieData.producer}`);
    }
    if (movieData.upc) {
        document.getElementById('upc').value = movieData.upc;
        console.log(`✅ UPC set: ${movieData.upc}`);
    }
    
    // Focus on the first empty required field
    const titleField = document.getElementById('title');
    if (!titleField.value) {
        titleField.focus();
    }
    
    if (!duplicateCheck.isDuplicate) {
        showStatus('add-status', '✨ Form auto-filled with movie data! Please review and complete any missing information.', 'success');
    }
}
