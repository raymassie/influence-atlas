// Global variables
let movieCollection = [];
let filteredMovies = [];
let currentSortField = 'title';
let currentSortDirection = 'asc';

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Movie Catalog app initializing...');
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadMoviesFromLocalStorage();
    console.log('App initialized successfully');
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

function setupEventListeners() {
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
    
    // Scanner button listeners
    const startBtn = document.getElementById('start-scanner');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            if (typeof startScanner === 'function') {
                startScanner();
            }
        });
    }
    
    const stopBtn = document.getElementById('stop-scanner');
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
    
    console.log('Adding movie:', movieData);
    
    // Validate required fields
    if (!movieData.title) {
        showMessage('Movie title is required', 'error');
        return;
    }
    
    // Check for duplicates in local collection
    const duplicate = checkForLocalDuplicate(movieData);
    if (duplicate) {
        const confirmMessage = `This movie appears to already be in your collection:\n\n` +
                             `"${duplicate.title}" (${duplicate.year})\n\n` +
                             `Do you want to add it anyway?`;
        
        if (!confirm(confirmMessage)) {
            showMessage('Movie not added - duplicate found', 'warning');
            return;
        }
    }
    
    // Add timestamp
    movieData.dateAdded = new Date().toISOString();
    
    // Add to local collection
    movieCollection.push(movieData);
    saveMoviesToLocalStorage();
    
    // Clear form and refresh display
    event.target.reset();
    displayMovies();
    updateMovieCount();
    
    showMessage('Movie added successfully', 'success');
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

function displayMovies() {
    // Use correct container ID from HTML
    const container = document.getElementById('movieList');
    if (!container) {
        console.error('Movie list container not found');
        return;
    }
    
    const moviesToDisplay = filteredMovies.length > 0 ? filteredMovies : movieCollection;
    
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
                <button class="remove-movie-btn" data-movie='${JSON.stringify(movie)}' title="Remove Movie">
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
    const movieData = JSON.parse(event.target.getAttribute('data-movie'));
    
    const confirmMessage = `Are you sure you want to remove "${movieData.title}" ${movieData.year ? `(${movieData.year})` : ''} from your collection?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
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
        showMessage('Movie removed successfully', 'success');
    }
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
        movieCollection
    };
}
