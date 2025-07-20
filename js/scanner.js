async function lookupMovieByUPC(upc) {
    const loadingDiv = document.getElementById('lookup-loading');
    loadingDiv.style.display = 'block';
    
    console.log(`🔍 Looking up movie details for UPC: ${upc}`);
    
    try {
        showStatus('add-status', '🔍 Looking up movie details...', 'info');
        
        // Use Google Apps Script for UPC lookup (bypasses CORS)
        let movieData = await lookupMovieByUPCViaScript(upc);
        
        if (movieData) {
            fillFormWithMovieData(movieData);
            showStatus('add-status', `✅ Found: "${movieData.title}"! Data from ${movieData.source}. Please verify details.`, 'success');
            console.log('✅ Movie data found and form filled:', movieData);
        } else {
            showStatus('add-status', `ℹ️ UPC ${upc} captured! Movie details not found in databases - please enter manually.`, 'info');
            console.log('ℹ️ No movie data found for UPC');
            
            setTimeout(() => {
                document.getElementById('title').focus();
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Lookup error:', error);
        showStatus('add-status', `ℹ️ UPC ${upc} captured! Unable to lookup details - please enter manually.`, 'info');
        
        setTimeout(() => {
            document.getElementById('title').focus();
        }, 500);
    } finally {
        loadingDiv.style.display = 'none';
    }
}
