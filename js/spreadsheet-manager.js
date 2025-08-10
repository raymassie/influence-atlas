// Spreadsheet Manager
class SpreadsheetManager {
    constructor() {
        this.selectedFile = null;
        this.fileHandle = null;
        this.movies = [];
        this.isConnected = false;
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
        if (!this.fileHandle || !this.isConnected) {
            console.error('No spreadsheet connected');
            return false;
        }

        try {
            // Read current file content to preserve any data not in memory
            const file = await this.fileHandle.getFile();
            const currentContent = await file.text();
            const currentMovies = this.parseCSV(currentContent);
            
            // Merge current movies with in-memory movies (avoid duplicates)
            const allMovies = [...currentMovies];
            
            this.movies.forEach(newMovie => {
                const exists = allMovies.find(existing => 
                    existing.upc === newMovie.upc || 
                    (existing.title.toLowerCase() === newMovie.title.toLowerCase() && 
                     existing.year === newMovie.year)
                );
                
                if (!exists) {
                    allMovies.push(newMovie);
                }
            });
            
            // Generate CSV with all movies
            const csvContent = this.generateCSV(allMovies);
            
            const writable = await this.fileHandle.createWritable();
            await writable.write(csvContent);
            await writable.close();
            
            // Update in-memory movies to match what's in the file
            this.movies = allMovies;
            
            console.log('✅ Saved to spreadsheet (preserved existing data)');
            return true;
        } catch (error) {
            console.error('Failed to save to spreadsheet:', error);
            showMessage('Failed to save to spreadsheet. Please try again.', 'error');
            return false;
        }
    }

    async addMovie(movieData) {
        // Check for duplicates
        const existingMovie = this.movies.find(movie => 
            movie.upc === movieData.upc || 
            (movie.title.toLowerCase() === movieData.title.toLowerCase() && 
             movie.year === movieData.year)
        );
        
        if (existingMovie) {
            console.log('Duplicate movie found, not adding');
            return false;
        }

        // Add movie with ID
        const newMovie = {
            ...movieData,
            id: Date.now().toString(),
            added: new Date().toLocaleDateString()
        };
        
        this.movies.push(newMovie);
        
        // Save to spreadsheet
        const success = await this.saveToSpreadsheet();
        if (success) {
            console.log(`✅ Added movie to spreadsheet: ${newMovie.title}`);
            return newMovie;
        }
        
        return false;
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
        const statusElement = document.getElementById('spreadsheet-status');
        const selectionElement = document.querySelector('.spreadsheet-selection');
        
        if (this.isConnected && this.fileHandle) {
            statusElement.textContent = `Connected: ${this.fileHandle.name} (${this.movies.length} movies)`;
            selectionElement.classList.add('connected');
        } else {
            statusElement.textContent = 'No spreadsheet selected';
            selectionElement.classList.remove('connected');
        }
    }

    isConnected() {
        return this.isConnected;
    }
    
    getConnectionStatus() {
        return this.isConnected;
    }
}

// Global spreadsheet manager instance
let spreadsheetManager = null; 