// Global variables
let movieCollection = [];
let filteredMovies = [];
let currentSortField = 'title';
let currentSortDirection = 'asc';

// Configuration
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE'; // Replace with your actual URL

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Movie Catalog app initializing...');
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupTabs();
    loadMoviesFromLocalStorage();
    
    // Load Google Script URL from localStorage if available
    const savedScriptUrl = localStorage.getItem('googleScriptUrl');
    if (savedScriptUrl && savedScriptUrl !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        window.GOOGLE_SCRIPT_URL = savedScriptUrl;
    }
    
    console.log('App initialized successfully');
}

function setupEventListeners() {
    // Add Movie form submission
    const addMovieForm = document.getElementById('add-movie-form');
    if (addMovieForm) {
        addMovieForm.addEventListener('submit', handleAddMovie);
    }
    
    // Search functionality
    const searchInput = document.getElementById('search-movies');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Sync from Google button
    const syncButton = document.getElementById('sync-from-google');
    if (syncButton) {
        syncButton.addEventListener('click', loadMoviesFromGoogle);
    }
    
    // Sort functionality
    const sortButtons = document.querySelectorAll('[data-sort]');
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            const field = this.getAttribute('data-sort');
            handleSort(field);
        });
    });
    
    // Google Script URL configuration
    const configButton = document.getElementById('config-google-script');
    if (configButton) {
        configButton.addEventListener('click', configureGoogleScript);
    }
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Special handling for different tabs
            if (targetTab === 'collection') {
                displayMovies();
            } else if (targetTab === 'scanner') {
                // Scanner tab specific initialization
                console.log('Scanner tab activated');
            }
        });
    });
    
    // Activate first tab by default
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
}

async function handleAddMovie(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const movieData = {
        title: formData.get('title')?.trim() || '',
        year: formData.get('year')?.trim() || '',
        genre: formData.get('genre')?.trim() || '',
        director: formData.get('director')?.trim() || '',
        studio: formData.get('studio')?.trim() || '',
        format: formData.get('format')?.trim() || 'DVD',
        upc: formData.get('upc')?.trim() || '',
        notes: formData.get('notes')?.trim() || ''
    };
    
    console.log('Adding movie:', movieData);
    
    // Validate required fields
    if (!movieData.title) {
        showMessage('Movie title is required', 'error');
        return;
    }
    
    try {
        // Check for duplicates in local collection first
        const localDuplicate = checkForLocalDuplicate(movieData);
        if (localDuplicate) {
            const confirmMessage = `This movie appears to already be in your local collection:\n\n` +
                                 `"${localDuplicate.title}" (${localDuplicate.year})\n\n` +
                                 `Do you want to add it anyway?`;
            
            if (!confirm(confirmMessage)) {
                showMessage('Movie not added - duplicate found', 'warning');
                return;
            }
        }
        
        // Add timestamp
        movieData.added = new Date().toISOString();
        
        // Add to local collection
        movieCollection.push(movieData);
        saveMoviesToLocalStorage();
        
        // Try to sync to Google Sheets
        try {
            await addMovieToGoogle(movieData);
            showMessage('Movie added successfully and synced to Google Sheets', 'success');
        } catch (syncError) {
            console.error('Failed to sync to Google:', syncError);
            showMessage('Movie added locally but failed to sync to Google Sheets', 'warning');
        }
        
        // Clear form and refresh display
        event.target.reset();
        displayMovies();
        updateMovieCount();
        
    } catch (error) {
        console.error('Error adding movie:', error);
        showMessage('Error adding movie: ' + error.message, 'error');
    }
}

function checkForLocalDuplicate(movieData) {
    const cleanTitle = movieData.title.toLowerCase().trim();
    const cleanYear = movieData.year.toString().trim();
    const cleanUPC = movieData.upc.trim();
    
    return movieCollection.find(movie => {
        // Check UPC match (most reliable)
        if (cleanUPC && movie.upc && movie.upc.trim() === cleanUPC) {
            return true;
        }
        
        // Check title + year match
        const movieTitle = movie.title.toLowerCase().trim();
        const movieYear = movie.year.toString().trim();
        
        if (cleanTitle === movieTitle && cleanYear && movieYear && cleanYear === movieYear) {
            return true;
        }
        
        return false;
    });
}

async function addMovieToGoogle(movieData) {
    console.log('Syncing movie to Google Sheets:', movieData);
    
    const scriptUrl = getGoogleScriptUrl();
    if (!scriptUrl) {
        throw new Error('Google Script URL not configured');
    }
    
    const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'addMovie',
            title: movieData.title,
            year: movieData.year,
            genre: movieData.genre,
            director: movieData.director,
            studio: movieData.studio,
            format: movieData.format,
            upc: movieData.upc,
            notes: movieData.notes
        })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
        throw new Error(result.error);
    }
    
    return result;
}

async function loadMoviesFromGoogle() {
    console.log('Loading movies from Google Sheets...');
    
    const scriptUrl = getGoogleScriptUrl();
    if (!scriptUrl) {
        showMessage('Google Script URL not configured. Please configure it in settings.', 'error');
        return;
    }
    
    const syncButton = document.getElementById('sync-from-google');
    if (syncButton) {
        syncButton.disabled = true;
        syncButton.textContent = 'Syncing...';
    }
    
    try {
        showMessage('Loading movies from Google Sheets...', 'info');
        
        const response = await fetch(`${scriptUrl}?action=getMovies`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        if (result.success && result.movies) {
            console.log('Loaded movies from Google:', result.movies.length);
            
            // Merge with local collection, avoiding duplicates
            const mergeResult = mergeMovieCollections(result.movies);
            
            saveMoviesToLocalStorage();
            displayMovies();
            updateMovieCount();
            
            const message = `Successfully synced from Google Sheets. ` +
                          `${mergeResult.added} new movies added, ` +
                          `${mergeResult.duplicates} duplicates skipped.`;
            
            showMessage(message, 'success');
        } else {
            showMessage('No movies found in Google Sheets', 'info');
        }
        
    } catch (error) {
        console.error('Error loading from Google:', error);
        showMessage('Error loading from Google Sheets: ' + error.message, 'error');
    } finally {
        if (syncButton) {
            syncButton.disabled = false;
            syncButton.textContent = 'Sync from Google';
        }
    }
}

function mergeMovieCollections(googleMovies) {
    console.log('Merging movie collections...');
    
    let addedCount = 0;
    let duplicateCount = 0;
    
    googleMovies.forEach(googleMovie => {
        // Check if this movie already exists in local collection
        const existsLocally = movieCollection.some(localMovie => {
            // Check UPC match (most reliable)
            if (googleMovie.upc && localMovie.upc && 
                googleMovie.upc.trim() === localMovie.upc.trim()) {
                return true;
            }
            
            // Check title + year match
            const googleTitle = googleMovie.title.toLowerCase().trim();
            const localTitle = localMovie.title.toLowerCase().trim();
            const googleYear = googleMovie.year.toString().trim();
            const localYear = localMovie.year.toString().trim();
            
            if (googleTitle === localTitle && googleYear && localYear && 
                googleYear === localYear) {
                return true;
            }
            
            return false;
        });
        
        if (!existsLocally) {
            // Add timestamp if not present
            if (!googleMovie.added) {
                googleMovie.added = new Date().toISOString();
            }
            
            movieCollection.push(googleMovie);
            addedCount++;
            console.log('Added new movie from Google:', googleMovie.title);
        } else {
            duplicateCount++;
            console.log('Skipped duplicate movie:', googleMovie.title);
        }
    });
    
    console.log(`Merge complete: ${addedCount} added, ${duplicateCount} duplicates skipped`);
    
    return {
        added: addedCount,
        duplicates: duplicateCount
    };
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredMovies = [...movieCollection];
    } else {
        filteredMovies = movieCollection.filter(movie => {
            return movie.title.toLowerCase().includes(searchTerm) ||
                   movie.year.toString().includes(searchTerm) ||
                   movie.genre.toLowerCase().includes(searchTerm) ||
                   movie.director.toLowerCase().includes(searchTerm) ||
                   movie.studio.toLowerCase().includes(searchTerm);
        });
    }
    
    displayMovies();
}

function handleSort(field) {
    if (currentSortField === field) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortDirection = 'asc';
    }
    
    filteredMovies.sort((a, b) => {
        let valueA = a[field] || '';
        let valueB = b[field] || '';
        
        // Handle numeric fields
        if (field === 'year') {
            valueA = parseInt(valueA) || 0;
            valueB = parseInt(valueB) || 0;
        } else {
            valueA = valueA.toString().toLowerCase();
            valueB = valueB.toString().toLowerCase();
        }
        
        if (currentSortDirection === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
    
    displayMovies();
    updateSortIndicators();
}

function updateSortIndicators() {
    const sortButtons = document.querySelectorAll('[data-sort]');
    sortButtons.forEach(button => {
        const field = button.getAttribute('data-sort');
        const indicator = button.querySelector('.sort-indicator');
        
        if (field === currentSortField) {
            button.classList.add('active');
            if (indicator) {
                indicator.textContent = currentSortDirection === 'asc' ? '↑' : '↓';
            }
        } else {
            button.classList.remove('active');
            if (indicator) {
                indicator.textContent = '';
            }
        }
    });
}

function displayMovies() {
    const container = document.getElementById('movies-container');
    if (!container) {
        console.error('Movies container not found');
        return;
    }
    
    const moviesToDisplay = filteredMovies.length > 0 ? filteredMovies : movieCollection;
    
    if (moviesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="no-movies">
                <p>No movies in your collection yet.</p>
                <p>Use the Scanner or Add Movie tabs to start building your collection!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = moviesToDisplay.map(movie => createMovieCard(movie)).join('');
    
    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-movie-btn').forEach(button => {
        button.addEventListener('click', handleRemoveMovie);
    });
}

function createMovieCard(movie) {
    const formatIcon = getFormatIcon(movie.format);
    const addedDate = movie.added ? new Date(movie.added).toLocaleDateString() : '';
    
    return `
        <div class="movie-card" data-movie-id="${movie.upc || movie.title + movie.year}">
            <div class="movie-header">
                <h3 class="movie-title">${escapeHtml(movie.title)} ${movie.year ? `(${movie.year})` : ''}</h3>
                <button class="remove-movie-btn" data-movie='${JSON.stringify(movie)}' title="Remove Movie">
                    Remove
                </button>
            </div>
            
            <div class="movie-details">
                ${movie.studio ? `<div class="movie-detail">
                    <span class="detail-icon">🏢</span>
                    <span class="detail-label">Studio:</span>
                    <span class="detail-value">${escapeHtml(movie.studio)}</span>
                </div>` : ''}
                
                ${movie.genre ? `<div class="movie-detail">
                    <span class="detail-icon">🎭</span>
                    <span class="detail-label">Genre:</span>
                    <span class="detail-value">${escapeHtml(movie.genre)}</span>
                </div>` : ''}
                
                ${movie.director ? `<div class="movie-detail">
                    <span class="detail-icon">🎬</span>
                    <span class="detail-label">Director:</span>
                    <span class="detail-value">${escapeHtml(movie.director)}</span>
                </div>` : ''}
                
                ${movie.format ? `<div class="movie-detail">
                    <span class="detail-icon">${formatIcon}</span>
                    <span class="detail-label">Formats:</span>
                    <span class="detail-value">${escapeHtml(movie.format)}</span>
                </div>` : ''}
                
                ${movie.upc ? `<div class="movie-detail">
                    <span class="detail-icon">📊</span>
                    <span class="detail-label">UPC:</span>
                    <span class="detail-value">${escapeHtml(movie.upc)}</span>
                </div>` : ''}
                
                ${addedDate ? `<div class="movie-detail">
                    <span class="detail-icon">📅</span>
                    <span class="detail-label">Added:</span>
                    <span class="detail-value">${addedDate}</span>
                </div>` : ''}
                
                ${movie.notes ? `<div class="movie-detail notes">
                    <span class="detail-icon">📝</span>
                    <span class="detail-label">Notes:</span>
                    <span class="detail-value">${escapeHtml(movie.notes)}</span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function getFormatIcon(format) {
    if (!format) return '💿';
    
    const formatLower = format.toLowerCase();
    if (formatLower.includes('blu-ray') || formatLower.includes('bluray')) {
        return '💙';
    } else if (formatLower.includes('4k') || formatLower.includes('uhd')) {
        return '🔷';
    } else if (formatLower.includes('digital')) {
        return '💻';
    } else {
        return '💿'; // DVD or other
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function handleRemoveMovie(event) {
    const movieData = JSON.parse(event.target.getAttribute('data-movie'));
    
    const confirmMessage = `Are you sure you want to remove "${movieData.title}" ${movieData.year ? `(${movieData.year})` : ''} from your collection?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Remove from local collection
        const index = movieCollection.findIndex(movie => {
            // Try UPC match first
            if (movieData.upc && movie.upc && movieData.upc === movie.upc) {
                return true;
            }
            // Fall back to title + year match
            return movie.title === movieData.title && movie.year === movieData.year;
        });
        
        if (index !== -1) {
            movieCollection.splice(index, 1);
            saveMoviesToLocalStorage();
            
            // Also remove from filtered movies if it exists there
            const filteredIndex = filteredMovies.findIndex(movie => 
                movie.title === movieData.title && movie.year === movieData.year
            );
            if (filteredIndex !== -1) {
                filteredMovies.splice(filteredIndex, 1);
            }
            
            displayMovies();
            updateMovieCount();
        }
        
        // Try to remove from Google Sheets
        try {
            await removeMovieFromGoogle(movieData);
            showMessage('Movie removed successfully from both local and Google Sheets', 'success');
        } catch (syncError) {
            console.error('Failed to remove from Google:', syncError);
            showMessage('Movie removed locally but failed to remove from Google Sheets', 'warning');
        }
        
    } catch (error) {
        console.error('Error removing movie:', error);
        showMessage('Error removing movie: ' + error.message, 'error');
    }
}

async function removeMovieFromGoogle(movieData) {
    console.log('Removing movie from Google Sheets:', movieData);
    
    const scriptUrl = getGoogleScriptUrl();
    if (!scriptUrl) {
        throw new Error('Google Script URL not configured');
    }
    
    const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'removeMovie',
            title: movieData.title,
            year: movieData.year,
            upc: movieData.upc
        })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
        throw new Error(result.error);
    }
    
    return result;
}

function updateMovieCount() {
    const countElement = document.getElementById('movie-count');
    if (countElement) {
        const count = movieCollection.length;
        countElement.textContent = `${count} movie${count !== 1 ? 's' : ''}`;
    }
}

function loadMoviesFromLocalStorage() {
    try {
        const saved = localStorage.getItem('movieCollection');
        if (saved) {
            movieCollection = JSON.parse(saved);
            filteredMovies = [...movieCollection];
            console.log('Loaded movies from localStorage:', movieCollection.length);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        movieCollection = [];
        filteredMovies = [];
    }
    
    displayMovies();
    updateMovieCount();
}

function saveMoviesToLocalStorage() {
    try {
        localStorage.setItem('movieCollection', JSON.stringify(movieCollection));
        console.log('Saved movies to localStorage:', movieCollection.length);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getGoogleScriptUrl() {
    return window.GOOGLE_SCRIPT_URL || 
           localStorage.getItem('googleScriptUrl') || 
           GOOGLE_SCRIPT_URL;
}

function configureGoogleScript() {
    const currentUrl = getGoogleScriptUrl();
    const newUrl = prompt('Enter your Google Apps Script Web App URL:', currentUrl);
    
    if (newUrl && newUrl.trim() && newUrl !== currentUrl) {
        const cleanUrl = newUrl.trim();
        localStorage.setItem('googleScriptUrl', cleanUrl);
        window.GOOGLE_SCRIPT_URL = cleanUrl;
        showMessage('Google Script URL updated successfully', 'success');
    }
}

function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Look for existing message container
    let messageContainer = document.getElementById('message-container') ||
                          document.querySelector('.message-container');
    
    if (!messageContainer) {
        // Create message container if it doesn't exist
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 350px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        document.body.appendChild(messageContainer);
    }
    
    // Set message and style based on type
    messageContainer.textContent = message;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444', 
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    messageContainer.style.backgroundColor = colors[type] || colors.info;
    messageContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageContainer && messageContainer.style.display !== 'none') {
            messageContainer.style.display = 'none';
        }
    }, 5000);
}

// Helper function to fill form with movie data (used by scanner)
function fillFormWithMovieData(movieData) {
    console.log('Filling form with movie data:', movieData);
    
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
        }
    });
    
    // Special handling for format dropdown
    const formatField = document.getElementById('movie-format');
    if (formatField && movieData.format) {
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

// Export functions for use by other modules
if (typeof window !== 'undefined') {
    window.movieCatalog = {
        fillFormWithMovieData,
        showMessage,
        getGoogleScriptUrl,
        movieCollection
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
function saveGoogleConfig() {
    const urlInput = document.getElementById('google-script-url');
    if (urlInput && urlInput.value.trim()) {
        const url = urlInput.value.trim();
        localStorage.setItem('googleScriptUrl', url);
        window.GOOGLE_SCRIPT_URL = url;
        showMessage('Google Script URL saved successfully', 'success');
    }
}
