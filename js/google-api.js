// Enhanced UPC lookup using Google Apps Script
async function lookupMovieByUPCViaScript(upc) {
    if (!googleScriptUrl) {
        console.log('⚠️ No Google config - skipping UPC lookup');
        return null;
    }
    
    try {
        console.log(`🔍 Looking up UPC via Google Apps Script: ${upc}`);
        
        const response = await fetch(`${googleScriptUrl}?action=lookupUPC&upc=${upc}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Google Apps Script UPC response:', data);
        
        if (data.success && data.data) {
            return data.data;
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Google Apps Script UPC lookup error:', error);
        return null;
    }
}
