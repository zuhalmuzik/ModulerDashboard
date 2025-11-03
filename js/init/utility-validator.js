/**
 * Utility Functions Validator
 * Validates that all required utility functions are loaded before app initialization
 */

(function() {
    'use strict';
    
    const errors = [];
    
    // Date Utils
    if (typeof getDailyVersion === 'undefined' || typeof getHourlyVersion === 'undefined') {
        errors.push('date-utils.js');
    }
    
    // Product Utils
    if (typeof isDiscountProduct === 'undefined' || typeof applyDiscountLogic === 'undefined') {
        errors.push('product-utils.js');
    }
    
    // String Utils
    if (typeof normalizeTurkish === 'undefined' || typeof levenshteinDistance === 'undefined' || typeof fuzzyMatch === 'undefined') {
        errors.push('string-utils.js');
    }
    
    // Store Utils
    if (typeof STORE_WORKING_HOURS === 'undefined' || typeof getStoreWorkingHours === 'undefined' || typeof normalizeStoreName === 'undefined') {
        errors.push('store-utils.js');
    }
    
    // Storage Utils
    if (typeof getLastMetadataUpdate === 'undefined' || typeof saveLastMetadataUpdate === 'undefined' || typeof isMetadataUpdated === 'undefined') {
        errors.push('storage-utils.js');
    }
    
    // Config
    if (typeof IS_DEVELOPMENT === 'undefined' || typeof safeConsole === 'undefined' || typeof activeChannels === 'undefined' || typeof dataLoadProgress === 'undefined') {
        errors.push('config.js');
    }
    
    // Data Loader Utils
    if (typeof loadStockLocations === 'undefined' || typeof loadCentralTargets === 'undefined') {
        errors.push('data-loader-utils.js');
    }
    
    // DOM Utils
    if (typeof safeUpdateElement === 'undefined' || typeof updateSelectionCount === 'undefined' || typeof getSelectedValues === 'undefined' || typeof filterCheckboxes === 'undefined') {
        errors.push('dom-utils.js');
    }
    
    // Time Utils
    if (typeof extractTimeInfo === 'undefined') {
        errors.push('time-utils.js');
    }
    
    // Location Utils
    if (typeof normalizeDistrictName === 'undefined') {
        errors.push('location-utils.js');
    }
    
    // Cost Utils
    if (typeof checkMonthlyReset === 'undefined' || typeof updateQueryCost === 'undefined' || typeof showCostStats === 'undefined') {
        errors.push('cost-utils.js');
    }
    
    // Report results
    if (errors.length > 0) {
        console.error('❌ Utility fonksiyonları yüklenemedi:', errors.join(', '));
    } else {
        console.log('✅ Tüm utility fonksiyonları yüklendi');
    }
})();

