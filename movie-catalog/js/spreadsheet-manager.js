// Spreadsheet Manager
class SpreadsheetManager {
    constructor() {
        this.movies = [];
        this.fileHandle = null;
        this.selectedFile = null;
        this.isConnected = false;
        this.statusElement = null; // Add status element as class property
    }

    async selectSpreadsheet() {
        try {
            // Check if File System Access API is available
            if ('showOpenFilePicker' in window) {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [
                        {
                            description: 'CSV Files',
                            accept: {
                                'text/csv': ['.csv']
                            }
                        }
                    ],
                    multiple: false
                });

                this.fileHandle = fileHandle;
                this.selectedFile = fileHandle;
                
                // Test if we can read the file
                const file = await fileHandle.getFile();
                const content = await file.text();
                
                console.log('📄 File content length:', content.length);
                console.log('📄 First 500 characters:', content.substring(0, 500));
                
                // Parse existing data
                this.movies = this.parseCSV(content);
                
                console.log('📊 Parsed movies:', this.movies.length);
                console.log('📊 First movie:', this.movies[0]);
                
                this.isConnected = true;
                this.updateStatus();
                
                console.log(`✅ Connected to spreadsheet: ${file.name}`);
                showMessage(`Connected to spreadsheet: ${file.name} (${this.movies.length} movies imported)`, 'success');
                
                return true;
            } else {
                // Fallback for browsers without File System Access API
                showMessage('Your browser doesn\'t support direct file access. Please use a modern browser like Chrome or Edge.', 'error');
                return false;
            }
        } catch (error) {
            // Handle user cancellation gracefully
            if (error.name === 'AbortError') {
                console.log('User cancelled file selection');
                return false;
            }
            console.error('Failed to select spreadsheet:', error);
            showMessage('Failed to select spreadsheet. Please try again.', 'error');
            return false;
        }
    }

    async createNewSpreadsheet() {
        try {
            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'movie-collection.csv',
                    types: [
                        {
                            description: 'CSV Files',
                            accept: {
                                'text/csv': ['.csv']
                            }
                        }
                    ]
                });

                // Create empty CSV with headers
                const headers = ['id', 'title', 'year', 'director', 'genre', 'runtime', 'formats', 'upc', 'image', 'added'];
                const csvContent = headers.join(',') + '\n';
                
                const writable = await fileHandle.createWritable();
                await writable.write(csvContent);
                await writable.close();

                this.fileHandle = fileHandle;
                this.selectedFile = fileHandle;
                this.movies = [];
                this.isConnected = true;
                this.updateStatus();
                
                console.log(`✅ Created new spreadsheet: ${fileHandle.name}`);
                showMessage(`Created new spreadsheet: ${fileHandle.name}`, 'success');
                
                return true;
            } else {
                showMessage('Your browser doesn\'t support direct file access. Please use a modern browser like Chrome or Edge.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Failed to create spreadsheet:', error);
            showMessage('Failed to create spreadsheet. Please try again.', 'error');
            return false;
        }
    }

    parseCSV(csvContent) {
        console.log('🔍 Parsing CSV content...');
        
        if (!csvContent || csvContent.trim() === '') {
            console.log('⚠️ Empty CSV content');
            return [];
        }
        
        const lines = csvContent.trim().split('\n');
        console.log('📋 Total lines:', lines.length);
        
        if (lines.length < 1) {
            console.log('⚠️ No lines found in CSV');
            return [];
        }
        
        // Parse headers
        const headerLine = lines[0];
        const headers = this.parseCSVLine(headerLine);
        console.log('📋 Headers:', headers);
        
        const movies = [];
        
        // Process data lines (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines
            
            const values = this.parseCSVLine(line);
            console.log(`📋 Line ${i} values:`, values);
            
            if (values.length === 0) continue;
            
            const movie = {};
            
            headers.forEach((header, index) => {
                const value = values[index] || '';
                movie[header] = value;
            });
            
            console.log(`📋 Raw movie object:`, movie);
            
            // Check for title in various possible column names
            const title = movie.Title || movie.title || movie['Movie Title'] || movie['Movie'] || '';

            // Only add if we have at least a title
            if (title && title.trim()) {
                console.log(`✅ Adding movie: ${title}`);
                // Normalize the movie object to use lowercase keys
                const normalizedMovie = {
                    id: movie.id || movie.Id || Date.now().toString(),
                    title: title,
                    year: movie.Year || movie.year || movie['Release Year'] || '',
                    director: movie.Director || movie.director || '',
                    genre: movie.Genre || movie.genre || '',
                    runtime: movie.Runtime || movie.runtime || '',
                    formats: movie.Formats || movie.formats || '',
                    upc: movie.UPC || movie.upc || '',
                    image: movie['Image URL'] || movie.Image || movie.image || '',
                    added: movie['Date Added'] || movie.added || new Date().toLocaleDateString()
                };
                movies.push(normalizedMovie);
            } else {
                console.log(`⚠️ Skipping movie without title. Available fields:`, Object.keys(movie));
            }
        }
        
        console.log(`📊 Total movies parsed: ${movies.length}`);
        return movies;
    }
    
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        result.push(current.trim());
        
        return result;
    }

    generateCSV(movies) {
        const headers = ['id', 'title', 'year', 'director', 'genre', 'runtime', 'formats', 'upc', 'image', 'added'];
        const csvLines = [headers.join(',')];
        
        movies.forEach(movie => {
            const row = headers.map(header => {
                const value = movie[header] || '';
                // Escape commas and quotes in CSV
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(row.join(','));
        });
        
        return csvLines.join('\n');
    }

    async saveToSpreadsheet() {
        try {
            console.log('🔄 Starting save to spreadsheet...');
            console.log('📁 File handle:', this.fileHandle);
            console.log('📊 Movies to save:', this.movies.length);
            
            if (!this.fileHandle) {
                throw new Error('No spreadsheet selected');
            }
            
            // Check if we have permission to write to the file
            console.log('🔐 Checking file permissions...');
            const permission = await this.fileHandle.queryPermission({ mode: 'readwrite' });
            console.log('🔐 Current permission:', permission);
            
            if (permission === 'denied') {
                console.log('🔐 Permission denied, requesting access...');
                // Request permission from user
                const newPermission = await this.fileHandle.requestPermission({ mode: 'readwrite' });
                console.log('🔐 New permission result:', newPermission);
                if (newPermission !== 'granted') {
                    throw new Error('Permission denied for file write access');
                }
            }
            
            // Generate CSV with all movies
            console.log('📝 Generating CSV content...');
            const csvContent = this.generateCSV(this.movies);
            console.log('📝 CSV content length:', csvContent.length);
            console.log('📝 CSV preview:', csvContent.substring(0, 200) + '...');
            
            // Create writable stream with proper error handling
            console.log('✍️ Creating writable stream...');
            let writable;
            try {
                writable = await this.fileHandle.createWritable();
                console.log('✍️ Writable stream created successfully');
            } catch (error) {
                console.error('✍️ Failed to create writable stream:', error);
                if (error.name === 'SecurityError' && error.message.includes('User activation is required')) {
                    // This error occurs when the user hasn't interacted with the page
                    // We need to show a message asking them to try again
                    throw new Error('Please click the save button again to confirm file access');
                }
                throw error;
            }
            
            console.log('✍️ Writing content to file...');
            await writable.write(csvContent);
            console.log('✍️ Content written, closing stream...');
            await writable.close();
            console.log('✍️ Stream closed successfully');
            
            console.log('✅ Saved to spreadsheet successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to save to spreadsheet:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Provide user-friendly error messages
            let userMessage = 'Failed to save to spreadsheet. ';
            if (error.message.includes('Permission denied')) {
                userMessage += 'Please grant file access permission and try again.';
            } else if (error.message.includes('User activation is required')) {
                userMessage += 'Please click the save button again to confirm file access.';
            } else if (error.message.includes('No spreadsheet selected')) {
                userMessage += 'Please select a spreadsheet first.';
            } else {
                userMessage += 'Please try again.';
            }
            
            showMessage(userMessage, 'error');
            return false;
        }
    }

    async addMovie(movieData) {
        console.log('🎬 addMovie called with data:', movieData);
        console.log('📊 Current movies count:', this.movies.length);
        console.log('📁 File handle available:', !!this.fileHandle);
        
        // Check for duplicates
        const existingMovie = this.movies.find(movie => 
            movie.upc === movieData.upc || 
            (movie.title.toLowerCase() === movieData.title.toLowerCase() && 
             movie.year === movieData.year)
        );
        
        if (existingMovie) {
            console.log('⚠️ Duplicate movie found, not adding:', existingMovie);
            return false;
        }

        // Add movie with ID
        const newMovie = {
            ...movieData,
            id: Date.now().toString(),
            added: new Date().toLocaleDateString()
        };
        
        console.log('🎬 New movie object created:', newMovie);
        this.movies.push(newMovie);
        console.log('📊 Movies count after push:', this.movies.length);
        
        // Try to save to spreadsheet with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                console.log(`🔄 Save attempt ${retryCount + 1}/${maxRetries}...`);
                const success = await this.saveToSpreadsheet();
                if (success) {
                    console.log(`✅ Added movie to spreadsheet: ${newMovie.title}`);
                    return newMovie;
                } else {
                    console.log(`❌ Save attempt ${retryCount + 1} returned false`);
                }
            } catch (error) {
                console.log(`❌ Save attempt ${retryCount + 1} failed:`, error.message);
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`⏳ Waiting before retry ${retryCount + 1}...`);
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // If all retries failed, show error but keep movie in memory
        console.warn(`❌ Failed to save movie after ${maxRetries} attempts, keeping in memory`);
        showMessage(`Movie added to memory but failed to save to file. Please try saving manually.`, 'warning');
        
        // Return the movie object so it can still be used
        return newMovie;
    }

    async removeMovie(movieId) {
        const index = this.movies.findIndex(movie => movie.id === movieId);
        if (index === -1) return false;
        
        const removedMovie = this.movies.splice(index, 1)[0];
        
        // Save to spreadsheet
        const success = await this.saveToSpreadsheet();
        if (success) {
            console.log(`✅ Removed movie from spreadsheet: ${removedMovie.title}`);
            return true;
        }
        
        return false;
    }

    getAllMovies() {
        return this.movies;
    }

    updateStatus() {
        // Get status element and store as class property for use in other methods
        this.statusElement = document.getElementById('spreadsheet-status');
        const selectionElement = document.querySelector('.spreadsheet-selection');
        
        // Safety check - ensure elements exist before proceeding
        if (!this.statusElement || !selectionElement) {
            console.warn('Status elements not found, skipping status update');
            return;
        }
        
        if (this.isConnected && this.fileHandle) {
            const statusText = `Connected: ${this.fileHandle.name} (${this.movies.length} movies)`;
            this.statusElement.textContent = statusText;
            selectionElement.classList.add('connected');
            
            // Add a save button if there are unsaved changes
            this.addSaveButton();
        } else {
            this.statusElement.textContent = 'No spreadsheet selected';
            selectionElement.classList.remove('connected');
        }
    }
    
    // Add a manual save button to the UI
    addSaveButton() {
        // Safety check - ensure status element exists
        if (!this.statusElement) {
            console.warn('Status element not available, cannot add save button');
            return;
        }
        
        // Remove existing save button if it exists
        const existingButton = document.getElementById('manual-save-btn');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Create save button
        const saveButton = document.createElement('button');
        saveButton.id = 'manual-save-btn';
        saveButton.textContent = '💾 Save Changes';
        saveButton.className = 'btn btn-primary';
        saveButton.style.marginLeft = '10px';
        
        // Add click handler
        saveButton.addEventListener('click', async () => {
            try {
                const success = await this.saveToSpreadsheet();
                if (success) {
                    showMessage('Changes saved successfully!', 'success');
                    this.updateStatus();
                } else {
                    showMessage('Failed to save changes', 'error');
                }
            } catch (error) {
                console.error('Manual save failed:', error);
                showMessage('Save failed: ' + error.message, 'error');
            }
        });
        
        // Add to status area - use class property
        if (this.statusElement && this.statusElement.parentNode) {
            const statusContainer = this.statusElement.parentNode;
            statusContainer.appendChild(saveButton);
        }
    }

    // Refresh movies array from the actual spreadsheet file
    async refreshFromFile() {
        if (!this.fileHandle) {
            console.warn('No file handle available for refresh');
            return false;
        }
        
        try {
            console.log('🔄 Refreshing movies from spreadsheet file...');
            const file = await this.fileHandle.getFile();
            const content = await file.text();
            
            // Parse the CSV content
            const newMovies = this.parseCSV(content);
            
            // Update the in-memory array
            this.movies = newMovies;
            
            console.log(`✅ Refreshed ${this.movies.length} movies from file`);
            this.updateStatus();
            return true;
        } catch (error) {
            console.error('Failed to refresh from file:', error);
            return false;
        }
    }

    checkConnection() {
        return this.isConnected && this.fileHandle !== null;
    }
    
    getConnectionStatus() {
        return this.isConnected && this.fileHandle !== null;
    }
    
    // Check if there are unsaved changes
    hasUnsavedChanges() {
        // For now, we'll assume any movies in memory might be unsaved
        // In a more sophisticated implementation, we could track changes
        return this.movies.length > 0;
    }
    
    // Get the number of movies in memory
    getMovieCount() {
        return this.movies.length;
    }
    
    // Force a save attempt (useful for manual saves)
    async forceSave() {
        if (!this.fileHandle) {
            throw new Error('No spreadsheet selected');
        }
        
        try {
            const success = await this.saveToSpreadsheet();
            if (success) {
                showMessage('All changes saved successfully!', 'success');
                return true;
            } else {
                showMessage('Failed to save changes. Please try again.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Force save failed:', error);
            showMessage('Save failed: ' + error.message, 'error');
            return false;
        }
    }
}

// Global spreadsheet manager instance
let spreadsheetManager = null; 