// Movie Catalog - Data Manager (Platform Agnostic)
// Handles local storage, import/export, and data synchronization

class DataManager {
    constructor() {
        this.storageKey = 'movieCollection';
        this.backupKey = 'movieCollectionBackup';
        this.movies = [];
        this.loadFromStorage();
    }

    // Load movies from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.movies = JSON.parse(stored);
                console.log(`📥 Loaded ${this.movies.length} movies from local storage`);
                    } else {
            // No data exists - start with empty collection
            this.movies = [];
            console.log('📚 Starting with empty movie collection');
        }
    } catch (error) {
        console.error('❌ Error loading from storage:', error);
        this.movies = [];
        console.log('📚 Starting with empty movie collection');
    }
    }
    
    // Add demo movies for testing - DISABLED in v1.0
    addDemoMovies() {
        // Demo movies removed - app now starts with empty collection
        return;
        const demoMovies = [
            {
                title: "The Matrix (demo)",
                year: 1999,
                director: "Wachowski Sisters",
                genre: "Sci-Fi",
                runtime: 136,
                formats: ["DVD", "Blu-ray"],
                upc: "1234567890123",
                image: "",
                dateAdded: new Date().toISOString()
            },
            {
                title: "Inception (demo)",
                year: 2010,
                director: "Christopher Nolan",
                genre: "Sci-Fi",
                runtime: 148,
                formats: ["Blu-ray", "4K"],
                upc: "2345678901234",
                image: "",
                dateAdded: new Date().toISOString()
            },
            {
                title: "Pulp Fiction (demo)",
                year: 1994,
                director: "Quentin Tarantino",
                genre: "Crime",
                runtime: 154,
                formats: ["DVD"],
                upc: "3456789012345",
                image: "",
                dateAdded: new Date().toISOString()
            },
            {
                title: "The Shawshank Redemption (demo)",
                year: 1994,
                director: "Frank Darabont",
                genre: "Drama",
                runtime: 142,
                formats: ["Blu-ray"],
                upc: "4567890123456",
                image: "",
                dateAdded: new Date().toISOString()
            }
        ];
        
        this.movies = demoMovies;
        this.saveToStorage();
        console.log('📚 Added demo movies for testing');
    }

    // Save movies to localStorage
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.movies));
            console.log(`💾 Saved ${this.movies.length} movies to local storage`);
            return true;
        } catch (error) {
            console.error('❌ Error saving to storage:', error);
            return false;
        }
    }

    // Add a new movie
    addMovie(movieData) {
        const movie = {
            ...movieData,
            id: this.generateId(),
            dateAdded: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        this.movies.push(movie);
        this.saveToStorage();
        return movie;
    }

    // Update an existing movie
    updateMovie(id, movieData) {
        const index = this.movies.findIndex(m => m.id === id);
        if (index !== -1) {
            this.movies[index] = {
                ...this.movies[index],
                ...movieData,
                lastModified: new Date().toISOString()
            };
            this.saveToStorage();
            return this.movies[index];
        }
        return null;
    }

    // Remove a movie
    removeMovie(id) {
        const index = this.movies.findIndex(m => m.id === id);
        if (index !== -1) {
            const removed = this.movies.splice(index, 1)[0];
            this.saveToStorage();
            return removed;
        }
        return null;
    }

    // Get all movies
    getAllMovies() {
        return [...this.movies];
    }

    // Search movies
    searchMovies(query) {
        const searchTerm = query.toLowerCase();
        return this.movies.filter(movie => 
            movie.title?.toLowerCase().includes(searchTerm) ||
            movie.director?.toLowerCase().includes(searchTerm) ||
            movie.genre?.toLowerCase().includes(searchTerm) ||
            movie.upc?.includes(searchTerm)
        );
    }

    // Filter movies by criteria
    filterMovies(filters = {}) {
        return this.movies.filter(movie => {
            if (filters.genre && movie.genre !== filters.genre) return false;
            if (filters.year && movie.year !== filters.year) return false;
            if (filters.format && !movie.formats?.includes(filters.format)) return false;
            return true;
        });
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export to CSV
    exportToCSV() {
        if (this.movies.length === 0) {
            throw new Error('No movies to export');
        }

        const headers = [
            'Title', 'Year', 'Director', 'Producer', 'Studio', 'Genre', 
            'Runtime', 'Formats', 'UPC', 'ASIN', 'Notes', 'Date Added', 'Image URL'
        ];

        const csvContent = [
            headers.join(','),
            ...this.movies.map(movie => [
                this.escapeCSV(movie.title || ''),
                movie.year || '',
                this.escapeCSV(movie.director || ''),
                this.escapeCSV(movie.producer || ''),
                this.escapeCSV(movie.studio || ''),
                this.escapeCSV(movie.genre || ''),
                this.escapeCSV(movie.runtime || ''),
                this.escapeCSV(movie.formats || ''),
                movie.upc || '',
                movie.asin || '',
                this.escapeCSV(movie.notes || ''),
                movie.dateAdded || '',
                movie.imageUrl || ''
            ].join(','))
        ].join('\n');

        return csvContent;
    }

    // Export to JSON
    exportToJSON() {
        return JSON.stringify(this.movies, null, 2);
    }

    // Import from CSV
    importFromCSV(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) {
                throw new Error('CSV file must have at least a header row and one data row');
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const importedMovies = [];

            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length === 0) continue;

                const movie = {};
                headers.forEach((header, index) => {
                    if (values[index]) {
                        const key = this.mapCSVHeaderToField(header);
                        if (key) {
                            movie[key] = values[index].trim();
                        }
                    }
                });

                if (movie.title) {
                    importedMovies.push(movie);
                }
            }

            return this.mergeImportedMovies(importedMovies);
        } catch (error) {
            console.error('❌ Error importing CSV:', error);
            throw error;
        }
    }

    // Import from JSON
    importFromJSON(jsonText) {
        try {
            const importedMovies = JSON.parse(jsonText);
            if (!Array.isArray(importedMovies)) {
                throw new Error('JSON must contain an array of movies');
            }
            return this.mergeImportedMovies(importedMovies);
        } catch (error) {
            console.error('❌ Error importing JSON:', error);
            throw error;
        }
    }

    // Merge imported movies with existing collection
    mergeImportedMovies(importedMovies) {
        const existingUPCs = new Set(this.movies.map(m => m.upc).filter(Boolean));
        const newMovies = [];
        const duplicates = [];

        importedMovies.forEach(movie => {
            if (movie.upc && existingUPCs.has(movie.upc)) {
                duplicates.push(movie);
            } else {
                newMovies.push(movie);
                if (movie.upc) {
                    existingUPCs.add(movie.upc);
                }
            }
        });

        // Add new movies
        newMovies.forEach(movie => {
            this.addMovie(movie);
        });

        return {
            imported: newMovies.length,
            duplicates: duplicates.length,
            total: this.movies.length
        };
    }

    // Create backup
    createBackup() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                movies: this.movies
            };
            localStorage.setItem(this.backupKey, JSON.stringify(backup));
            console.log('💾 Backup created successfully');
            return true;
        } catch (error) {
            console.error('❌ Error creating backup:', error);
            return false;
        }
    }

    // Restore from backup
    restoreFromBackup() {
        try {
            const backup = localStorage.getItem(this.backupKey);
            if (!backup) {
                throw new Error('No backup found');
            }

            const backupData = JSON.parse(backup);
            this.movies = backupData.movies || [];
            this.saveToStorage();
            console.log('🔄 Backup restored successfully');
            return true;
        } catch (error) {
            console.error('❌ Error restoring backup:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        this.movies = [];
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ All data cleared');
    }
    
    // Clear demo data and reset to empty
    clearDemoData() {
        this.movies = [];
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Demo data cleared, localStorage reset');
    }

    // Get collection statistics
    getStats() {
        const stats = {
            total: this.movies.length,
            byGenre: {},
            byYear: {},
            byFormat: {},
            recentlyAdded: this.movies
                .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
                .slice(0, 5)
        };

        this.movies.forEach(movie => {
            // Genre stats
            if (movie.genre) {
                stats.byGenre[movie.genre] = (stats.byGenre[movie.genre] || 0) + 1;
            }

            // Year stats
            if (movie.year) {
                stats.byYear[movie.year] = (stats.byYear[movie.year] || 0) + 1;
            }

            // Format stats
            if (movie.formats) {
                let formatsArray;
                if (Array.isArray(movie.formats)) {
                    formatsArray = movie.formats;
                } else if (typeof movie.formats === 'string') {
                    formatsArray = movie.formats.split(',').map(f => f.trim());
                } else {
                    formatsArray = [];
                }
                
                formatsArray.forEach(format => {
                    if (format) {
                        stats.byFormat[format] = (stats.byFormat[format] || 0) + 1;
                    }
                });
            }
        });

        return stats;
    }

    // Helper methods
    escapeCSV(text) {
        if (!text) return '';
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    mapCSVHeaderToField(header) {
        const mapping = {
            'title': 'title',
            'year': 'year',
            'director': 'director',
            'producer': 'producer',
            'studio': 'studio',
            'genre': 'genre',
            'runtime': 'runtime',
            'formats': 'formats',
            'upc': 'upc',
            'asin': 'asin',
            'notes': 'notes',
            'date added': 'dateAdded',
            'image url': 'imageUrl'
        };
        return mapping[header.toLowerCase()];
    }
}

// Global instance
window.dataManager = new DataManager(); 