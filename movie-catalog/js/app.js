// Global variables
let filteredMovies = [];
let currentSortField = 'title';
let currentSortDirection = 'asc';
let dataManager = null;

// Auto-save functionality
let autoSaveEnabled = false;
let autoSaveFile = null;

function enableAutoSave() {
    autoSaveEnabled = true;
    showMessage('Auto-save enabled - scanned movies will be saved to file automatically', 'success');
}

function disableAutoSave() {
    autoSaveEnabled = false;
    showMessage('Auto-save disabled', 'info');
}

function autoSaveMovie(movieData) {
    if (!autoSaveEnabled) return;
    
    try {
        // Create a timestamp for the filename
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `scanned-movie-${timestamp}.json`;
        
        // Create the movie data object
        const movieToSave = {
            ...movieData,
            scannedAt: now.toISOString(),
            source: 'barcode-scanner'
        };
        
        // Create and download the file
        const blob = new Blob([JSON.stringify(movieToSave, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Auto-saved movie: ${movieData.title} to ${filename}`);
        
    } catch (error) {
        console.error('Auto-save failed:', error);
        showMessage('Auto-save failed', 'error');
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Movie Catalog app initializing...');
    initializeApp();
});

function initializeApp() {
    // Initialize data manager first
    try {
        dataManager = new DataManager();
        window.dataManager = dataManager; // Make it globally accessible
        console.log('✅ Data manager initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize data manager:', error);
        showMessage('Failed to initialize data storage. Please refresh the page.', 'error');
        return;
    }
    
    // Initialize spreadsheet manager
    spreadsheetManager = new SpreadsheetManager();
    window.spreadsheetManager = spreadsheetManager;
    console.log('✅ Spreadsheet manager initialized');
    
    setupAppEventListeners();
    displayMovies();
    updateMovieCount();
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
    } else {
        console.warn('Movie form not found');
    }
    
    // Search functionality - matches HTML id="search-input"
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    } else {
        console.warn('Search input not found');
    }
    
    // Scanner button listeners - check multiple possible IDs for compatibility
    const startBtn = document.getElementById('start-scanner') || 
                     document.getElementById('startScanner');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            if (typeof startScanner === 'function') {
                startScanner();
            } else {
                console.warn('startScanner function not available');
            }
        });
    } else {
        console.warn('Start scanner button not found');
    }
    
    const stopBtn = document.getElementById('stop-scanner') || 
                    document.getElementById('stopScanner');
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            if (typeof stopScanner === 'function') {
                stopScanner();
            } else {
                console.warn('stopScanner function not available');
            }
        });
    } else {
        console.warn('Stop scanner button not found');
    }
    
    // Initialize import/export manager
    try {
        if (typeof ImportExportManager !== 'undefined') {
            window.importExportManager = new ImportExportManager();
            console.log('✅ Import/Export manager initialized');
        } else {
            console.warn('ImportExportManager not available');
        }
    } catch (error) {
        console.error('❌ Failed to initialize import/export manager:', error);
    }
    
    // Search for Details button
    const searchDetailsBtn = document.getElementById('searchDetailsButton');
    if (searchDetailsBtn) {
        searchDetailsBtn.addEventListener('click', handleSearchDetails);
    }
}

async function handleAddMovie(event) {
    event.preventDefault();
    
    // Check if data manager is available
    if (!dataManager) {
        showMessage('Data manager not initialized. Please refresh the page.', 'error');
        return;
    }
    
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
    
    // Validate required fields (all except genre)
    const requiredFields = ['title', 'year', 'director', 'producer', 'studio', 'runtime', 'upc', 'asin', 'notes', 'image'];
    for (const field of requiredFields) {
        if (!movieData[field] || String(movieData[field]).trim() === '') {
            showMessage(`Please enter a value for ${field}`, 'error');
            return;
        }
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
    
    // Add movie using appropriate manager
    try {
        let addedMovie;
        
        if (spreadsheetManager && spreadsheetManager.getConnectionStatus()) {
            // Use spreadsheet manager
            addedMovie = await spreadsheetManager.addMovie(movieData);
            if (!addedMovie) {
                showMessage('Movie already exists in spreadsheet', 'warning');
                return;
            }
        } else {
            // Fall back to data manager
            addedMovie = dataManager.addMovie(movieData);
        }
        
        showMessage(`✅ "${addedMovie.title}" added successfully!`, 'success');
        
        // Auto-save if enabled
        autoSaveMovie(addedMovie);
        
        // Reset form
        event.target.reset();
        
        // Update displays
        displayMovies();
        updateMovieCount();
        
        // Close modal
        hideAddMovieForm();
        
    } catch (error) {
        console.error('❌ Error adding movie:', error);
        showMessage('Error adding movie: ' + error.message, 'error');
    }
}

function checkForLocalDuplicate(movieData) {
    if (!dataManager) {
        console.warn('Data manager not available for duplicate check');
        return null;
    }
    
    const cleanTitle = movieData.title ? movieData.title.toLowerCase().trim() : "";
    const cleanYear = movieData.year ? movieData.year.toString().trim() : "";
    const cleanUPC = movieData.upc ? movieData.upc.trim() : "";
    
    return dataManager.getAllMovies().find(movie => {
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

// Sorting functions
function updateSorting() {
    const sortField = document.getElementById('sort-field').value;
    currentSortField = sortField;
    displayMovies();
}

function toggleSortDirection() {
    const sortBtn = document.getElementById('sort-direction');
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    
    if (currentSortDirection === 'asc') {
        sortBtn.textContent = '↑ Ascending';
        sortBtn.classList.add('active');
    } else {
        sortBtn.textContent = '↓ Descending';
        sortBtn.classList.add('active');
    }
    
    displayMovies();
}

// View switching functions
function switchToCardView() {
    console.log('Switching to card view...');
    
    // Update button states
    document.getElementById('card-view-btn').classList.add('active');
    document.getElementById('list-view-btn').classList.remove('active');
    
    // Update CSS classes for proper display
    const movieList = document.getElementById('movieList');
    const movieTable = document.getElementById('movieTable');
    
    movieList.classList.remove('list-view');
    movieList.classList.add('card-view');
    movieTable.classList.remove('card-view');
    movieTable.classList.add('list-view');
    
    // Refresh the display using the enhanced displayMovies function
    displayMovies();
}

function switchToListView() {
    console.log('Switching to list view...');
    
    // Update button states
    document.getElementById('list-view-btn').classList.add('active');
    document.getElementById('card-view-btn').classList.remove('active');
    
    // Update CSS classes for proper display
    const movieList = document.getElementById('movieList');
    const movieTable = document.getElementById('movieTable');
    
    movieList.classList.remove('card-view');
    movieList.classList.add('list-view');
    movieTable.classList.remove('list-view');
    movieTable.classList.add('card-view');
    
    // Refresh the display using the enhanced displayMovies function
    displayMovies();
}



// Display movies as cards (existing functionality)
function displayMoviesAsCards(movies) {
    const movieList = document.getElementById('movieList');
    
    console.log('🎬 Displaying movies as cards:', movies);
    console.log('🎬 Number of movies:', movies.length);
    
    if (movies.length === 0) {
        movieList.innerHTML = `
            <div class="empty-state">
                <h3>📽️ No Movies Found</h3>
                <p>Try adjusting your search or add some movies to get started!</p>
            </div>
        `;
        return;
    }
    
    const cardsHTML = movies.map(movie => {
        console.log('🎬 Creating card for movie:', movie);
        return `
            <div class="movie-card" data-id="${movie.id || movie.upc || 'unknown'}">
                <div class="movie-cover">
                    ${movie.image ? `<img src="${movie.image}" alt="${movie.title}">` : '<div class="no-image">🎬</div>'}
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title || 'Unknown Title'}</h3>
                    <p class="movie-year">${movie.year || ''}</p>
                    <p class="movie-director">${movie.director || ''}</p>
                    <p class="movie-genre">${movie.genre || ''}</p>
                    <p class="movie-runtime">${movie.runtime || ''}</p>
                    <div class="movie-formats">
                        ${movie.formats ? movie.formats.split(',').map(format => 
                            `<span class="format-tag">${format.trim()}</span>`
                        ).join('') : ''}
                    </div>
                    <p class="movie-upc">UPC: ${movie.upc || ''}</p>
                    <p class="movie-added">Added: ${movie.added || ''}</p>
                </div>
                <div class="movie-actions">
                    <button class="edit-btn" onclick="editMovie('${movie.id || movie.upc || 'unknown'}')">✏️ Edit</button>
                    <button class="delete-btn" onclick="removeMovie('${movie.id || movie.upc || 'unknown'}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('🎬 Generated cards HTML length:', cardsHTML.length);
    movieList.innerHTML = cardsHTML;
}

// Display movies as table (new functionality)
function displayMoviesAsTable(movies) {
    const tableBody = document.getElementById('movie-table-body');
    
    if (movies.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <div>
                        <h3>📊 No Movies Found</h3>
                        <p>Try adjusting your search or add some movies to get started!</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = movies.map(movie => `
        <tr data-id="${movie.id}">
            <td>
                ${movie.image ? 
                    `<img src="${movie.image}" alt="${movie.title}" class="movie-cover">` : 
                    '<div class="movie-cover no-image">🎬</div>'
                }
            </td>
            <td class="movie-title">${movie.title}</td>
            <td class="movie-year">${movie.year}</td>
            <td class="movie-director">${movie.director}</td>
            <td class="movie-genre">${movie.genre}</td>
            <td class="movie-runtime">${movie.runtime}</td>
            <td class="movie-formats">
                ${movie.formats ? movie.formats.split(',').map(format => 
                    `<span class="format-tag">${format.trim()}</span>`
                ).join('') : ''}
            </td>
            <td class="movie-upc">${movie.upc}</td>
            <td class="movie-added">${movie.added}</td>
            <td class="movie-actions">
                <button class="action-btn edit-btn" onclick="editMovie('${movie.id}')" title="Edit">✏️</button>
                <button class="action-btn delete-btn" onclick="removeMovie('${movie.id}')" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
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

// Function to update movie count
function updateMovieCount(count) {
    const countElement = document.getElementById('movie-count');
    if (countElement) {
        if (count !== undefined) {
            countElement.textContent = `${count} movies`;
        } else {
            // Get count from current data source
            let movies = [];
            if (spreadsheetManager && spreadsheetManager.getConnectionStatus()) {
                movies = spreadsheetManager.getAllMovies();
            } else if (dataManager) {
                movies = dataManager.getAllMovies();
            }
            countElement.textContent = `${movies.length} movies`;
        }
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
async function removeMovie(movieId) {
    try {
        console.log('[DEBUG] Attempting to remove movie with ID:', movieId);
        if (spreadsheetManager && spreadsheetManager.getConnectionStatus()) {
            // Use spreadsheet manager
            const allMovies = spreadsheetManager.getAllMovies();
            console.log('[DEBUG] Spreadsheet movies before delete:', allMovies.map(m => m.id));
            const success = await spreadsheetManager.removeMovie(movieId);
            const afterMovies = spreadsheetManager.getAllMovies();
            console.log('[DEBUG] Spreadsheet movies after delete:', afterMovies.map(m => m.id));
            if (success) {
                showMessage('Movie removed from spreadsheet', 'success');
                displayMovies();
                updateMovieCount();
            } else {
                showMessage('Movie not found in spreadsheet', 'error');
            }
        } else if (dataManager) {
            // Fall back to data manager
            const removedMovie = dataManager.removeMovie(movieId);
            if (removedMovie) {
                showMessage(`🗑️ "${removedMovie.title}" removed from collection`, 'success');
                displayMovies();
                updateMovieCount();
            } else {
                showMessage('Movie not found', 'error');
            }
        } else {
            showMessage('No data manager available', 'error');
        }
    } catch (error) {
        console.error('Error removing movie:', error);
        showMessage('Error removing movie: ' + error.message, 'error');
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
    // Placeholder for Google Apps Script configuration
    console.log('Google config saved');
}

// Handle Search for Details button
function handleSearchDetails() {
    const upc = document.getElementById('upc')?.value?.trim();
    const title = document.getElementById('title')?.value?.trim();
    
    if (!upc && !title) {
        showMessage('Please enter a UPC code or movie title first', 'warning');
        return;
    }
    
    // Create search query
    let searchQuery = '';
    if (upc) {
        searchQuery = upc;
    } else if (title) {
        searchQuery = title;
    }
    
    // Open Google search in new tab
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' movie')}`;
    window.open(searchUrl, '_blank');
    
    showMessage('🔍 Opened Google search for movie details', 'success');
}

// For external access
if (typeof window !== 'undefined') {
    window.movieCatalog = {
        fillFormWithMovieData,
        showMessage,
        getMovieCollection: () => window.dataManager.getAllMovies()
    };
}

// Modal functions
function showAddMovieForm() {
    const modal = document.getElementById('add-movie-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function hideAddMovieForm() {
    const modal = document.getElementById('add-movie-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Enhanced openScanner function
function openScanner() {
    const scannerModal = document.getElementById('scanner-modal');
    scannerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Initialize and start scanner when modal opens
    if (typeof initializeScanner === 'function') {
        initializeScanner();
        
        // Auto-start the scanner after a brief delay
        setTimeout(() => {
            if (typeof startScanner === 'function') {
                console.log('Auto-starting camera...');
                startScanner();
            }
        }, 500);
    }
}

// Enhanced closeScannerModal function
function closeScannerModal() {
    const scannerModal = document.getElementById('scanner-modal');
    scannerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Stop scanner when modal closes
    if (typeof stopScanner === 'function') {
        console.log('Auto-stopping camera...');
        stopScanner();
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const scannerModal = document.getElementById('scanner-modal');
    if (event.target === scannerModal) {
        closeScannerModal();
    }
});

function toggleAutoSave() {
    const toggleBtn = document.getElementById('auto-save-toggle');
    
    if (autoSaveEnabled) {
        disableAutoSave();
        toggleBtn.textContent = '💾 Auto-Save: OFF';
        toggleBtn.classList.remove('active');
    } else {
        enableAutoSave();
        toggleBtn.textContent = '💾 Auto-Save: ON';
        toggleBtn.classList.add('active');
    }
}

// Spreadsheet integration functions
function selectSpreadsheet() {
    if (!spreadsheetManager) {
        spreadsheetManager = new SpreadsheetManager();
    }
    
    spreadsheetManager.selectSpreadsheet().then(success => {
        if (success) {
            displayMovies();
            updateMovieCount();
        }
    });
}

function createNewSpreadsheet() {
    if (!spreadsheetManager) {
        spreadsheetManager = new SpreadsheetManager();
    }
    
    spreadsheetManager.createNewSpreadsheet().then(success => {
        if (success) {
            displayMovies();
            updateMovieCount();
        }
    });
}

function promptSpreadsheetAction() {
    const action = confirm('No spreadsheet selected. Would you like to:\n\nOK = Select existing spreadsheet\nCancel = Create new spreadsheet');
    
    if (action) {
        selectSpreadsheet();
    } else {
        createNewSpreadsheet();
    }
}

// Enhanced displayMovies function to use spreadsheet data
function displayMovies() {
    // Use spreadsheet manager if connected, otherwise fall back to data manager
    let movies = [];
    let dataSource = 'none';
    
    if (spreadsheetManager && spreadsheetManager.getConnectionStatus()) {
        movies = spreadsheetManager.getAllMovies();
        dataSource = 'spreadsheet';
        console.log('📊 Using spreadsheet data:', movies.length, 'movies');
    } else if (dataManager) {
        movies = dataManager.getAllMovies();
        dataSource = 'local storage';
        console.log('📊 Using local storage data:', movies.length, 'movies');
    } else {
        console.error('No data source available');
        return;
    }
    
    console.log('📊 Data source:', dataSource, 'Movies:', movies.length);
    
    const searchTerm = document.getElementById('search-input')?.value?.toLowerCase() || '';
    
    // Filter movies based on search term
    let filteredMovies = movies.filter(movie => {
        if (!searchTerm) return true;
        return (
            movie.title?.toLowerCase().includes(searchTerm) ||
            movie.director?.toLowerCase().includes(searchTerm) ||
            movie.genre?.toLowerCase().includes(searchTerm) ||
            movie.year?.toString().includes(searchTerm) ||
            movie.upc?.toLowerCase().includes(searchTerm)
        );
    });
    
    // Sort movies
    filteredMovies.sort((a, b) => {
        let aValue = a[currentSortField] || '';
        let bValue = b[currentSortField] || '';
        
        // Handle numeric fields
        if (currentSortField === 'year') {
            aValue = parseInt(aValue) || 0;
            bValue = parseInt(bValue) || 0;
        }
        
        // Handle string fields
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        // Sort based on direction
        if (currentSortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    // Update movie count
    updateMovieCount(filteredMovies.length);
    
    // Check which view is active
    const isCardView = document.getElementById('card-view-btn').classList.contains('active');
    
    if (isCardView) {
        displayMoviesAsCards(filteredMovies);
    } else {
        displayMoviesAsTable(filteredMovies);
    }
}

// Function to edit movie
function editMovie(movieId) {
    console.log('🎬 Edit movie called with ID:', movieId);
    
    // Get the movie data
    let movie = null;
    
    if (spreadsheetManager && spreadsheetManager.getConnectionStatus()) {
        console.log('🎬 Looking in spreadsheet manager...');
        const movies = spreadsheetManager.getAllMovies();
        console.log('🎬 All spreadsheet movies:', movies);
        movie = movies.find(m => m.id === movieId);
        console.log('🎬 Found movie in spreadsheet:', movie);
    } else if (dataManager) {
        console.log('🎬 Looking in data manager...');
        const movies = dataManager.getAllMovies();
        console.log('🎬 All data manager movies:', movies);
        movie = movies.find(m => m.id === movieId);
        console.log('🎬 Found movie in data manager:', movie);
    }
    
    if (!movie) {
        console.error('🎬 Movie not found for ID:', movieId);
        showMessage('Movie not found', 'error');
        return;
    }
    
    console.log('🎬 Movie found, filling form with:', movie);
    
    // Fill the form with movie data
    fillFormWithMovieData(movie);
    
    // Show the add movie modal
    showAddMovieForm();
    
    // Update the form title to indicate editing
    const modalTitle = document.querySelector('#add-movie-modal .modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = '✏️ Edit Movie';
    }
    
    // Change the submit button text
    const submitBtn = document.querySelector('#add-movie-modal .submit-btn');
    if (submitBtn) {
        submitBtn.textContent = 'Update Movie';
    }
    
    showMessage(`Editing: ${movie.title}`, 'info');
}

// Test function to check all functionality
function testAllFunctions() {
    console.log('🧪 Testing all functions...');
    
    // Test 1: Check if all managers are initialized
    console.log('✅ Data Manager:', dataManager ? 'Initialized' : 'Missing');
    console.log('✅ Spreadsheet Manager:', spreadsheetManager ? 'Initialized' : 'Missing');
    
    // Test 2: Check if DOM elements exist
    const elements = [
        'movieList', 'movieTable', 'search-input', 'card-view-btn', 
        'list-view-btn', 'sort-field', 'sort-direction', 'movie-count',
        'add-movie-modal', 'scanner-modal', 'movieForm'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`✅ ${id}:`, element ? 'Found' : 'Missing');
    });
    
    // Test 3: Check if functions exist
    const functions = [
        'displayMovies', 'switchToCardView', 'switchToListView',
        'updateSorting', 'toggleSortDirection', 'filterMovies',
        'showAddMovieForm', 'hideAddMovieForm', 'editMovie',
        'removeMovie', 'openScanner', 'closeScannerModal',
        'selectSpreadsheet', 'createNewSpreadsheet'
    ];
    
    functions.forEach(funcName => {
        const func = window[funcName];
        console.log(`✅ ${funcName}:`, typeof func === 'function' ? 'Exists' : 'Missing');
    });
    
    // Test 4: Check current data sources
    if (spreadsheetManager && spreadsheetManager.getConnectionStatus()) {
        const movies = spreadsheetManager.getAllMovies();
        console.log('✅ Spreadsheet movies:', movies.length);
    }
    
    if (dataManager) {
        const movies = dataManager.getAllMovies();
        console.log('✅ Local storage movies:', movies.length);
    }
    
    console.log('🧪 Testing complete!');
}

// Call test function on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(testAllFunctions, 1000); // Wait for initialization
    
    // Auto-reconnect to spreadsheet after a short delay
    setTimeout(() => {
        autoReconnectSpreadsheet();
    }, 1500);
});

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    console.log('🔍 Searching for:', searchTerm);
    
    // Trigger display update with search filter
    displayMovies();
}

// Function to check spreadsheet connection status
function checkSpreadsheetStatus() {
    if (spreadsheetManager && spreadsheetManager.getConnectionStatus()) {
        const movies = spreadsheetManager.getAllMovies();
        console.log('✅ Spreadsheet connected with', movies.length, 'movies');
        showMessage(`Connected to spreadsheet (${movies.length} movies)`, 'success');
        return true;
    } else {
        console.log('❌ No spreadsheet connected');
        showMessage('No spreadsheet connected. Click "📁 Select Spreadsheet" to reconnect.', 'warning');
        return false;
    }
}

// Function to reconnect to spreadsheet
function reconnectSpreadsheet() {
    console.log('🔄 Attempting to reconnect to spreadsheet...');
    if (spreadsheetManager) {
        spreadsheetManager.selectSpreadsheet().then(success => {
            if (success) {
                displayMovies();
                updateMovieCount();
                showMessage('Successfully reconnected to spreadsheet!', 'success');
            } else {
                showMessage('Failed to reconnect. Please try selecting the spreadsheet again.', 'error');
            }
        });
    } else {
        showMessage('Spreadsheet manager not initialized. Please refresh the page.', 'error');
    }
}

// Auto-reconnect to spreadsheet on page load
function autoReconnectSpreadsheet() {
    console.log('🔄 Auto-reconnecting to spreadsheet...');
    
    // Try to reconnect to the last used spreadsheet
    if (spreadsheetManager) {
        spreadsheetManager.selectSpreadsheet().then(success => {
            if (success) {
                console.log('✅ Auto-reconnected to spreadsheet successfully');
                displayMovies();
                updateMovieCount();
                showMessage('✅ Reconnected to spreadsheet - your data is restored!', 'success');
            } else {
                console.log('❌ Auto-reconnect failed, using local storage');
                showMessage('⚠️ Could not auto-reconnect. Click "📁 Select Spreadsheet" to restore your data.', 'warning');
            }
        }).catch(error => {
            console.log('❌ Auto-reconnect error:', error);
            showMessage('⚠️ Auto-reconnect failed. Click "📁 Select Spreadsheet" to restore your data.', 'warning');
        });
    }
}
