// Global variables
let filteredMovies = [];
let currentSortField = 'title';
let currentSortDirection = 'asc';

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Movie Catalog app initializing...');
    initializeApp();
});

function initializeApp() {
    setupAppEventListeners();
    displayMovies();
    updateMovieCount();
    updateSpreadsheet();
}

function showTab(tabName, event) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked tab
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Special handling for collection tab
    if (tabName === 'collection') {
        displayMovies();
    }
}

function setupAppEventListeners() {
    // Add Movie form submission - matches HTML id="movieForm"
    const addMovieForm = document.getElementById('movieForm');
    
    if (addMovieForm) {
        addMovieForm.addEventListener('submit', handleAddMovie);
    }
    
    // Search functionality - matches HTML id="search-input"
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Scanner button listeners - check multiple possible IDs for compatibility
    const startBtn = document.getElementById('start-scanner') || 
                     document.getElementById('startScanner');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            if (typeof startScanner === 'function') {
                startScanner();
            }
        });
    }
    
    const stopBtn = document.getElementById('stop-scanner') || 
                    document.getElementById('stopScanner');
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            if (typeof stopScanner === 'function') {
                stopScanner();
            }
        });
    }
}

function handleAddMovie(event) {
    event.preventDefault();
    
    // Get form data using correct field IDs from HTML
    const movieData = {
        title: document.getElementById('title')?.value?.trim() || '',
        year: document.getElementById('year')?.value?.trim() || '',
        genre: document.getElementById('genre')?.value?.trim() || '',
        director: document.getElementById('director')?.value?.trim() || '',
        producer: document.getElementById('producer')?.value?.trim() || '',
        studio: document.getElementById('studio')?.value?.trim() || '',
        runtime: document.getElementById('runtime')?.value?.trim() || '',
        upc: document.getElementById('upc')?.value?.trim() || '',
        asin: document.getElementById('asin')?.value?.trim() || '',
        notes: document.getElementById('notes')?.value?.trim() || ''
    };
    
    // Get selected formats
    const selectedFormats = [];
    document.querySelectorAll('.format1:checked').forEach(checkbox => {
        selectedFormats.push(checkbox.value);
    });
    
    document.querySelectorAll('.format2:checked').forEach(checkbox => {
        selectedFormats.push(checkbox.value);
    });
    
    document.querySelectorAll('.format3:checked').forEach(checkbox => {
        selectedFormats.push(checkbox.value);
    });
    
    movieData.formats = selectedFormats.join(', ');
    
    // Validate required fields
    if (!movieData.title) {
        showMessage('Please enter a movie title', 'error');
        return;
    }
    
    // Check for duplicates
    const duplicate = checkForLocalDuplicate(movieData);
    if (duplicate) {
        const message = `⚠️ Duplicate Found!\n\nThis movie is already in your collection:\n\n` +
                      `Title: ${duplicate.title}\n` +
                      `Year: ${duplicate.year}\n` +
                      `Format: ${duplicate.formats || 'Unknown'}\n` +
                      `UPC: ${duplicate.upc}\n\n` +
                      `Do you want to add it anyway?`;
        
        if (!confirm(message)) {
            return;
        }
    }
    
    // Add movie using data manager
    try {
        const addedMovie = window.dataManager.addMovie(movieData);
        
        showMessage(`✅ "${addedMovie.title}" added successfully!`, 'success');
        
        // Reset form
        event.target.reset();
        
        // Update displays
        displayMovies();
        updateSpreadsheet();
        updateMovieCount();
        
        // Switch to collection tab to show the new movie
        setTimeout(() => {
            showTab('collection');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error adding movie:', error);
        showMessage('Error adding movie: ' + error.message, 'error');
    }
}

function checkForLocalDuplicate(movieData) {
    const cleanTitle = movieData.title ? movieData.title.toLowerCase().trim() : "";
    const cleanYear = movieData.year ? movieData.year.toString().trim() : "";
    const cleanUPC = movieData.upc ? movieData.upc.trim() : "";
    
    return window.dataManager.getAllMovies().find(movie => {
        // Check UPC match (most reliable)
        if (cleanUPC && movie.upc && movie.upc.trim() === cleanUPC) {
            return true;
        }
        
        // Check title + year match
        const movieTitle = movie.title ? movie.title.toLowerCase().trim() : "";
        const movieYear = movie.year ? movie.year.toString().trim() : "";
        
        if (cleanTitle && cleanYear && movieTitle && movieYear && cleanTitle === movieTitle && cleanYear === movieYear) {
            return true;
        }
        
        return false;
    });
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredMovies = [];
    } else {
        filteredMovies = window.dataManager.searchMovies(searchTerm);
    }
    
    displayMovies();
}

function displayMovies() {
    // Use correct container ID from HTML
    const container = document.getElementById('movieList');
    if (!container) {
        console.error('Movie list container not found');
        return;
    }
    
    const allMovies = window.dataManager.getAllMovies();
    const moviesToDisplay = filteredMovies.length > 0 ? filteredMovies : allMovies;
    
    if (moviesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📽️ Start Building Your Collection</h3>
                <p>Add movies manually or use the barcode scanner to get started!</p>
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
    const addedDate = movie.dateAdded ? new Date(movie.dateAdded).toLocaleDateString() : '';
    
    return `
        <div class="movie-card" data-movie-id="${movie.upc || movie.title + movie.year}">
            <div class="movie-header">
                <h3 class="movie-title">${escapeHtml(movie.title)} ${movie.year ? `(${movie.year})` : ''}</h3>
                <button class="remove-movie-btn" data-movie-title="${escapeHtml(movie.title)}" data-movie-year="${escapeHtml(movie.year)}" data-movie-upc="${escapeHtml(movie.upc)}" title="Remove Movie">
                    🗑️ Remove
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
                
                ${movie.formats ? `<div class="movie-detail">
                    <span class="detail-icon">💿</span>
                    <span class="detail-label">Formats:</span>
                    <span class="detail-value">${escapeHtml(movie.formats)}</span>
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleRemoveMovie(event) {
    const movieData = {
        title: event.target.getAttribute('data-movie-title') || '',
        year: event.target.getAttribute('data-movie-year') || '',
        upc: event.target.getAttribute('data-movie-upc') || ''
    };
    
    const confirmMessage = `Are you sure you want to remove "${movieData.title}" ${movieData.year ? `(${movieData.year})` : ''} from your collection?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Find the movie to remove
    const movies = window.dataManager.getAllMovies();
    const movieToRemove = movies.find(movie => {
        // Try UPC match first
        if (movieData.upc && movie.upc && movieData.upc === movie.upc) {
            return true;
        }
        // Fall back to title + year match
        return movie.title === movieData.title && movie.year === movieData.year;
    });
    
    if (movieToRemove) {
        // Remove using data manager
        const removed = window.dataManager.removeMovie(movieToRemove.id);
        
        if (removed) {
            // Also remove from filtered movies if it exists there
            const filteredIndex = filteredMovies.findIndex(movie => 
                movie.title === movieData.title && movie.year === movieData.year
            );
            if (filteredIndex !== -1) {
                filteredMovies.splice(filteredIndex, 1);
            }
            
            displayMovies();
            updateSpreadsheet();
            updateMovieCount();
            showMessage('Movie removed successfully', 'success');
        }
    }
}

function updateMovieCount() {
    const countElement = document.getElementById('movie-count');
    if (countElement) {
        const count = window.dataManager.getAllMovies().length;
        countElement.textContent = `${count} movie${count !== 1 ? 's' : ''}`;
    }
}

// These functions are now handled by the DataManager
// loadMoviesFromLocalStorage() and saveMoviesToLocalStorage() are no longer needed

// Function to filter movies (called from HTML)
function filterMovies() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        handleSearch({ target: searchInput });
    }
}

// Function to refresh spreadsheet (called from HTML)
function refreshSpreadsheet() {
    updateSpreadsheet();
}

// Function to update spreadsheet view
function updateSpreadsheet() {
    const tbody = document.getElementById('spreadsheet-body');
    if (!tbody) return;
    
    const movies = window.dataManager.getAllMovies();
    
    if (movies.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <div>
                        <h3>📊 No Data Yet</h3>
                        <p>Add some movies to see them in the spreadsheet!</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = movies.map(movie => `
        <tr>
            <td>
                ${movie.imageUrl ? `<img src="${movie.imageUrl}" alt="${movie.title}" class="cover-image" width="50">` : '📽️'}
            </td>
            <td>${escapeHtml(movie.title)}</td>
            <td>${movie.year || ''}</td>
            <td>${escapeHtml(movie.director || '')}</td>
            <td>${escapeHtml(movie.genre || '')}</td>
            <td>${escapeHtml(movie.runtime || '')}</td>
            <td>${escapeHtml(movie.formats || '')}</td>
            <td>${movie.upc || ''}</td>
            <td>${movie.dateAdded ? new Date(movie.dateAdded).toLocaleDateString() : ''}</td>
            <td>
                <button onclick="removeMovie('${movie.id}')" class="remove-button">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Function to remove movie (called from spreadsheet)
function removeMovie(movieId) {
    if (confirm('Are you sure you want to remove this movie?')) {
        const removed = window.dataManager.removeMovie(movieId);
        if (removed) {
            displayMovies();
            updateSpreadsheet();
            updateMovieCount();
            showMessage(`Removed "${removed.title}" from collection`, 'success');
        }
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
    
    // Use correct field IDs from HTML
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
        }
    });
}

// Functions to maintain compatibility
function closeConfigModal() {
    const modal = document.getElementById('config-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveGoogleConfig() {
    // No-op for agnostic version
    showMessage('Configuration saved', 'success');
    closeConfigModal();
}

// For external access
if (typeof window !== 'undefined') {
    window.movieCatalog = {
        fillFormWithMovieData,
        showMessage,
        getMovieCollection: () => window.dataManager.getAllMovies()
    };
}
