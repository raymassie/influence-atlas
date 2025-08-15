# Movie Catalog - Version 1.0

A web-based UPC scanner application for managing your movie collection with real movie data from barcode scanning.

## 🎉 **VERSION 1.0 - STABLE RELEASE**
✅ **WORKING** - Real movie data retrieval from UPC scanning

## 🎯 Core Requirements

**⚠️ CRITICAL: Read [CORE_REQUIREMENTS.md](./CORE_REQUIREMENTS.md) before making any changes!**

**UPC Scanning Behavior:**
- **Scan UPC codes** and automatically add movie information to a **local spreadsheet** of your choice
- **NO UPC database lookups** - do not use external UPC databases to fetch product information
- **Use public sources** instead - pull movie details from publicly available information sources
- **Local control** - you choose which spreadsheet to use and where to store your data

## Features

- 📱 **Barcode Scanner** - Scan DVD/Blu-ray barcodes with your device camera
- 🎬 **Automatic Movie Lookup** - Fetch movie details from barcode using public sources
- 📊 **Local Spreadsheet Integration** - Store your collection in any spreadsheet you choose
- 🖼️ **Image Storage** - Save movie covers to Google Drive
- 📱 **Mobile Responsive** - Works on desktop and mobile devices
- 📤 **Export Options** - Download your collection as CSV or JSON

## Live Demo

🔗 **[Open Movie Catalog App](https://raymassie.github.io/movie-catalog/)**

## Setup

1. Clone this repository
2. Set up Google Apps Script (see [setup instructions](./docs/google-setup.md))
3. Open `index.html` in your browser or use the live GitHub Pages deployment

## Technology Stack

- HTML5/CSS3/JavaScript
- Google Apps Script for backend
- Google Sheets for data storage
- Google Drive for image storage
- Camera API for barcode scanning

## Project Structure