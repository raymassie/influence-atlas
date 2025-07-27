# Google Apps Script Setup Guide

This guide will help you set up Google Apps Script to handle your movie catalog data storage and image uploads.

## Quick Setup Checklist

- [ ] Create Google Apps Script project
- [ ] Replace default code with Movie Catalog backend
- [ ] Deploy as web app with "Anyone" access
- [ ] Copy the web app URL
- [ ] Configure URL in your Movie Catalog app
- [ ] Test by adding a movie

## Step 1: Create Google Apps Script Project

1. **Go to Google Apps Script**: Open [script.google.com](https://script.google.com)
2. **Sign in**: Use your Google account
3. **Create New Project**: Click "New project"
4. **Rename Project**: Click "Untitled project" → rename to "Movie Catalog Backend"

## Step 2: Add the Backend Code

1. **Delete Default Code**: Select all code in `Code.gs` and delete it
2. **Paste New Code**: Copy the complete Google Apps Script code below
3. **Save**: Press `Ctrl+S` (or `Cmd+S` on Mac)

```javascript
// Movie Catalog Google Apps Script Backend
// This script handles data storage and image uploads for the Movie Catalog app

const FOLDER_NAME = 'MovieCatalog';
const IMAGES_FOLDER_NAME = 'Images';
const SHEET_NAME = 'Movie Collection';

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'getMovies':
        return getMovies();
      case 'test':
        return ContentService.createTextOutput(JSON.stringify({
          success: true, 
          message: 'Google Apps Script is working!',
          timestamp: new Date().toISOString()
        })).setMimeType(ContentService.MimeType.JSON);
      case 'getFolderInfo':
        return getFolderInfo();
      default:
        return ContentService.createTextOutput(JSON.stringify({
          error: 'Invalid action: ' + action
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    Logger.log('doPost action: ' + action);
    
    switch(action) {
      case 'addMovie':
        return addMovie(data.data);
      case 'removeMovie':
        return removeMovie(data.data);
      case 'uploadImage':
        return uploadImage(data.data);
      case 'bulkAddMovies':
        return bulkAddMovies(data.data);
      case 'initializeFolders':
        return initializeFolders();
      default:
        return ContentService.createTextOutput(JSON.stringify({
          error: 'Invalid action: ' + action
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateFolder(folderName, parentFolder = null) {
  const parent = parentFolder || DriveApp.getRootFolder();
  const folders = parent.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    Logger.log('Creating folder: ' + folderName);
    return parent.createFolder(folderName);
  }
}

function getOrCreateSpreadsheet() {
  const folder = getOrCreateFolder(FOLDER_NAME);
  const files = folder.getFilesByName(SHEET_NAME);
  
  if (files.hasNext()) {
    const file = files.next();
    return SpreadsheetApp.openById(file.getId());
  } else {
    Logger.log('Creating new spreadsheet: ' + SHEET_NAME);
    const spreadsheet = SpreadsheetApp.create(SHEET_NAME);
    const file = DriveApp.getFileById(spreadsheet.getId());
    
    // Move to MovieCatalog folder
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    
    // Set up headers
    const sheet = spreadsheet.getActiveSheet();
    sheet.getRange(1, 1, 1, 13).setValues([[
      'Title', 'Year', 'Director', 'Producer', 'Studio', 'Genre', 
      'Runtime', 'Formats', 'UPC', 'ASIN', 'Notes', 'Date Added', 'Image URL'
    ]]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, 13);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    
    // Set column widths
    sheet.setColumnWidth(1, 200); // Title
    sheet.setColumnWidth(2, 60);  // Year
    sheet.setColumnWidth(3, 150); // Director
    sheet.setColumnWidth(4, 150); // Producer
    sheet.setColumnWidth(5, 120); // Studio
    sheet.setColumnWidth(6, 100); // Genre
    sheet.setColumnWidth(7, 80);  // Runtime
    sheet.setColumnWidth(8, 200); // Formats
    sheet.setColumnWidth(9, 120); // UPC
    sheet.setColumnWidth(10, 100); // ASIN
    sheet.setColumnWidth(11, 250); // Notes
    sheet.setColumnWidth(12, 100); // Date Added
    sheet.setColumnWidth(13, 150); // Image URL
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    Logger.log('Spreadsheet created and formatted');
    return spreadsheet;
  }
}

function addMovie(movieData) {
  try {
    Logger.log('Adding movie: ' + movieData.title);
    const spreadsheet = getOrCreateSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    
    sheet.appendRow([
      movieData.title || '',
      movieData.year || '',
      movieData.director || '',
      movieData.producer || '',
      movieData.studio || '',
      movieData.genre || '',
      movieData.runtime || '',
      movieData.formats || '',
      movieData.upc || '',
      movieData.asin || '',
      movieData.notes || '',
      movieData.dateAdded || new Date().toLocaleDateString(),
      movieData.imageUrl || ''
    ]);
    
    Logger.log('Movie added successfully');
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Movie added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error adding movie: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getMovies() {
  try {
    Logger.log('Getting movies from spreadsheet');
    const spreadsheet = getOrCreateSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      Logger.log('No movies found');
      return ContentService.createTextOutput(JSON.stringify({
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const movies = data.slice(1).map(row => {
      const movie = {};
      headers.forEach((header, index) => {
        // Convert header to camelCase property name
        const propName = header.toLowerCase()
          .replace(/\s+(.)/g, (match, char) => char.toUpperCase())
          .replace(/\s/g, '');
        movie[propName] = row[index] || '';
      });
      return movie;
    });
    
    Logger.log('Retrieved ' + movies.length + ' movies');
    return ContentService.createTextOutput(JSON.stringify({
      data: movies,
      count: movies.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error getting movies: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function removeMovie(movieData) {
  try {
    Logger.log('Removing movie: ' + movieData.title);
    const spreadsheet = getOrCreateSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find the movie to remove (match by title and UPC)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === movieData.title && data[i][8] === movieData.upc) {
        sheet.deleteRow(i + 1);
        Logger.log('Movie removed successfully');
        break;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Movie removed successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error removing movie: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadImage(imageData) {
  try {
    Logger.log('Uploading image: ' + imageData.fileName);
    const folder = getOrCreateFolder(FOLDER_NAME);
    const imagesFolder = getOrCreateFolder(IMAGES_FOLDER_NAME, folder);
    
    const blob = Utilities.newBlob(
      Utilities.base64Decode(imageData.fileData),
      imageData.mimeType,
      imageData.fileName
    );
    
    // Check if file already exists
    const existingFiles = imagesFolder.getFilesByName(imageData.fileName);
    if (existingFiles.hasNext()) {
      // Remove existing file
      existingFiles.next().setTrashed(true);
      Logger.log('Replaced existing image file');
    }
    
    const file = imagesFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const url = `https://drive.google.com/uc?id=${file.getId()}`;
    Logger.log('Image uploaded successfully: ' + url);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      url: url,
      fileId: file.getId()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error uploading image: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function bulkAddMovies(moviesArray) {
  try {
    Logger.log('Bulk adding ' + moviesArray.length + ' movies');
    const spreadsheet = getOrCreateSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    
    // Prepare data for bulk insert
    const rows = moviesArray.map(movie => [
      movie.title || '',
      movie.year || '',
      movie.director || '',
      movie.producer || '',
      movie.studio || '',
      movie.genre || '',
      movie.runtime || '',
      movie.formats || '',
      movie.upc || '',
      movie.asin || '',
      movie.notes || '',
      movie.dateAdded || new Date().toLocaleDateString(),
      movie.imageUrl || ''
    ]);
    
    // Add all rows at once
    if (rows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, 13).setValues(rows);
    }
    
    Logger.log('Bulk add completed successfully');
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `${moviesArray.length} movies added successfully`
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in bulk add: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeFolders() {
  try {
    Logger.log('Initializing Google Drive folder structure');
    
    // Create main folder
    const mainFolder = getOrCreateFolder(FOLDER_NAME);
    
    // Create images subfolder
    const imagesFolder = getOrCreateFolder(IMAGES_FOLDER_NAME, mainFolder);
    
    // Create spreadsheet
    const spreadsheet = getOrCreateSpreadsheet();
    
    Logger.log('Folder structure initialized');
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Folder structure initialized',
      mainFolderId: mainFolder.getId(),
      imagesFolderId: imagesFolder.getId(),
      spreadsheetId: spreadsheet.getId()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error initializing folders: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getFolderInfo() {
  try {
    const folder = getOrCreateFolder(FOLDER_NAME);
    const imagesFolder = getOrCreateFolder(IMAGES_FOLDER_NAME, folder);
    const spreadsheet = getOrCreateSpreadsheet();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      mainFolder: {
        id: folder.getId(),
        url: folder.getUrl(),
        name: folder.getName()
      },
      imagesFolder: {
        id: imagesFolder.getId(),
        url: imagesFolder.getUrl(),
        name: imagesFolder.getName()
      },
      spreadsheet: {
        id: spreadsheet.getId(),
        url: spreadsheet.getUrl(),
        name: spreadsheet.getName()
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error getting folder info: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}