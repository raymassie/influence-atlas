
// PERFORMANCE OPTIMIZATIONS
// 1. Lazy loading of profile data
// 2. Index-based filtering
// 3. Memoized search results
// 4. Debounced search input

// Global variables for performance
let profileIndexes = {};
let searchCache = {};
let filterCache = {};

// Load indexes for faster filtering
async function loadIndexes() {
    try {
        const [archetypeIndex, domainIndex, qualityIndex] = await Promise.all([
            fetch('archetype-index.json').then(r => r.json()),
            fetch('domain-index.json').then(r => r.json()),
            fetch('quality-index.json').then(r => r.json())
        ]);
        
        profileIndexes = {
            archetype: archetypeIndex,
            domain: domainIndex,
            quality: qualityIndex
        };
        
        console.log('✓ Performance indexes loaded');
    } catch (error) {
        console.warn('⚠️  Could not load indexes, falling back to standard filtering');
    }
}

// Optimized filter function using indexes
function filterProfilesOptimized(filterType, filterValue) {
    if (!profileIndexes[filterType] || !profileIndexes[filterType][filterValue]) {
        return allProfiles; // Fallback to all profiles
    }
    
    const indexes = profileIndexes[filterType][filterValue];
    return indexes.map(index => allProfiles[index]);
}

// Memoized search function
function searchProfilesMemoized(query) {
    if (searchCache[query]) {
        return searchCache[query];
    }
    
    const results = allProfiles.filter(profile => {
        const searchText = `${profile.name} ${profile.notable_works || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    searchCache[query] = results;
    return results;
}

// Debounced search input
let searchTimeout;
function debouncedSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const results = searchProfilesMemoized(query);
        filteredProfiles = results;
        displayProfiles();
    }, 150); // 150ms delay
}

// Optimized quality filter using index
function applyQualityFilterOptimized(qualityTier) {
    console.log(`🎯 Applying optimized quality filter: ${qualityTier}`);
    
    if (activeQualityFilter === qualityTier) {
        clearAllFilters();
        activeQualityFilter = null;
        updateQualityFilterButtons();
        return;
    }
    
    clearAllFilters();
    
    // Use index for faster filtering
    if (profileIndexes.quality && profileIndexes.quality[qualityTier]) {
        const indexes = profileIndexes.quality[qualityTier];
        filteredProfiles = indexes.map(index => allProfiles[index]);
    } else {
        // Fallback to standard filtering
        filteredProfiles = allProfiles.filter(profile => {
            return profile.quality_tier === qualityTier;
        });
    }
    
    filteredProfiles.sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));
    updateQuickNavigationStats();
    displayProfiles();
    activeQualityFilter = qualityTier;
    updateQualityFilterButtons();
    
    console.log(`✅ Applied ${qualityTier} quality filter - found ${filteredProfiles.length} profiles`);
}

// Clear cache when filters change
function clearFilterCache() {
    searchCache = {};
    filterCache = {};
}
