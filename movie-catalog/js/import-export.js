// Movie Catalog - Import/Export Manager
// Handles file uploads, downloads, and data synchronization

class ImportExportManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Import buttons
        const importCSVBtn = document.getElementById('import-csv');
        const importJSONBtn = document.getElementById('import-json');
        const importFileInput = document.getElementById('import-file');

        if (importCSVBtn) {
            importCSVBtn.addEventListener('click', () => this.importFromCSV());
        }
        if (importJSONBtn) {
            importJSONBtn.addEventListener('click', () => this.importFromJSON());
        }
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Export buttons
        const exportCSVBtn = document.getElementById('export-csv');
        const exportJSONBtn = document.getElementById('export-json');
        const exportExcelBtn = document.getElementById('export-excel');

        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', () => this.exportToCSV());
        }
        if (exportJSONBtn) {
            exportJSONBtn.addEventListener('click', () => this.exportToJSON());
        }
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        }

        // Backup buttons
        const backupBtn = document.getElementById('create-backup');
        const restoreBtn = document.getElementById('restore-backup');

        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.createBackup());
        }
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.restoreBackup());
        }
    }

    // Import from CSV file
    async importFromCSV() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,text/csv';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const text = await this.readFileAsText(file);
                const result = window.dataManager.importFromCSV(text);
                
                this.showImportResult(result);
                this.refreshDisplay();
            };

            input.click();
        } catch (error) {
            this.showError('Error importing CSV: ' + error.message);
        }
    }

    // Import from JSON file
    async importFromJSON() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const text = await this.readFileAsText(file);
                const result = window.dataManager.importFromJSON(text);
                
                this.showImportResult(result);
                this.refreshDisplay();
            };

            input.click();
        } catch (error) {
            this.showError('Error importing JSON: ' + error.message);
        }
    }

    // Handle file upload (auto-detect format)
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await this.readFileAsText(file);
            let result;

            if (file.name.toLowerCase().endsWith('.csv')) {
                result = window.dataManager.importFromCSV(text);
            } else if (file.name.toLowerCase().endsWith('.json')) {
                result = window.dataManager.importFromJSON(text);
            } else {
                // Try to auto-detect format
                try {
                    JSON.parse(text);
                    result = window.dataManager.importFromJSON(text);
                } catch {
                    result = window.dataManager.importFromCSV(text);
                }
            }

            this.showImportResult(result);
            this.refreshDisplay();
        } catch (error) {
            this.showError('Error importing file: ' + error.message);
        }
    }

    // Export to CSV
    exportToCSV() {
        try {
            const csvContent = window.dataManager.exportToCSV();
            this.downloadFile(csvContent, 'movie-collection.csv', 'text/csv');
            this.showSuccess('CSV exported successfully!');
        } catch (error) {
            this.showError('Error exporting CSV: ' + error.message);
        }
    }

    // Export to JSON
    exportToJSON() {
        try {
            const jsonContent = window.dataManager.exportToJSON();
            this.downloadFile(jsonContent, 'movie-collection.json', 'application/json');
            this.showSuccess('JSON exported successfully!');
        } catch (error) {
            this.showError('Error exporting JSON: ' + error.message);
        }
    }

    // Export to Excel (CSV format that Excel can open)
    exportToExcel() {
        try {
            const csvContent = window.dataManager.exportToCSV();
            this.downloadFile(csvContent, 'movie-collection.xls', 'application/vnd.ms-excel');
            this.showSuccess('Excel file exported successfully!');
        } catch (error) {
            this.showError('Error exporting Excel file: ' + error.message);
        }
    }

    // Create backup
    createBackup() {
        try {
            const success = window.dataManager.createBackup();
            if (success) {
                this.showSuccess('Backup created successfully!');
            } else {
                this.showError('Failed to create backup');
            }
        } catch (error) {
            this.showError('Error creating backup: ' + error.message);
        }
    }

    // Restore from backup
    restoreBackup() {
        try {
            if (confirm('Are you sure you want to restore from backup? This will replace your current collection.')) {
                const success = window.dataManager.restoreFromBackup();
                if (success) {
                    this.showSuccess('Backup restored successfully!');
                    this.refreshDisplay();
                } else {
                    this.showError('Failed to restore backup');
                }
            }
        } catch (error) {
            this.showError('Error restoring backup: ' + error.message);
        }
    }

    // Import from clipboard (paste data)
    importFromClipboard() {
        navigator.clipboard.readText().then(text => {
            try {
                let result;
                // Try to detect format
                try {
                    JSON.parse(text);
                    result = window.dataManager.importFromJSON(text);
                } catch {
                    result = window.dataManager.importFromCSV(text);
                }
                
                this.showImportResult(result);
                this.refreshDisplay();
            } catch (error) {
                this.showError('Error importing from clipboard: ' + error.message);
            }
        }).catch(error => {
            this.showError('Error reading clipboard: ' + error.message);
        });
    }

    // Export to clipboard
    exportToClipboard(format = 'csv') {
        try {
            let content;
            if (format === 'json') {
                content = window.dataManager.exportToJSON();
            } else {
                content = window.dataManager.exportToCSV();
            }

            navigator.clipboard.writeText(content).then(() => {
                this.showSuccess(`${format.toUpperCase()} copied to clipboard!`);
            }).catch(error => {
                this.showError('Error copying to clipboard: ' + error.message);
            });
        } catch (error) {
            this.showError('Error exporting to clipboard: ' + error.message);
        }
    }

    // Helper methods
    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showImportResult(result) {
        const message = `Import completed!\n\n` +
                       `✅ ${result.imported} new movies imported\n` +
                       `⚠️ ${result.duplicates} duplicates skipped\n` +
                       `📊 Total movies: ${result.total}`;
        
        this.showSuccess(message);
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        // Create or find message container
        let container = document.getElementById('import-export-messages');
        if (!container) {
            container = document.createElement('div');
            container.id = 'import-export-messages';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                padding: 15px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(container);
        }

        // Set message and style
        container.textContent = message;
        container.style.backgroundColor = type === 'success' ? '#28a745' : 
                                        type === 'error' ? '#dc3545' : '#17a2b8';
        container.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    }

    refreshDisplay() {
        // Trigger UI refresh
        if (typeof displayMovies === 'function') {
            displayMovies();
        }
        if (typeof updateSpreadsheet === 'function') {
            updateSpreadsheet();
        }
        if (typeof updateMovieCount === 'function') {
            updateMovieCount();
        }
    }

    // Get supported formats
    getSupportedFormats() {
        return {
            import: ['CSV', 'JSON', 'Excel (CSV)'],
            export: ['CSV', 'JSON', 'Excel (CSV)']
        };
    }

    // Validate file format
    validateFile(file) {
        const validTypes = [
            'text/csv',
            'application/json',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        const validExtensions = ['.csv', '.json', '.xls', '.xlsx'];
        const fileName = file.name.toLowerCase();
        
        return validTypes.includes(file.type) || 
               validExtensions.some(ext => fileName.endsWith(ext));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.importExportManager = new ImportExportManager();
}); 