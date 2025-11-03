/**
 * Data Loader Utility Functions
 * Async functions for loading external data (stock locations, targets)
 */

/**
 * Stok konumlarını yükler
 * @returns {Promise<Object>} Stok konumları mapping objesi
 */
async function loadStockLocations() {
    try {
        const response = await fetch('data/stock-locations.json');
        if (!response.ok) throw new Error('Stock locations yüklenemedi');
        const data = await response.json();
        const locations = data.stock_locations || {};
        
        // safeConsole config.js'den gelecek (window objesinde)
        if (typeof safeConsole !== 'undefined') {
            safeConsole.log('✅ Stok konumları yüklendi:', Object.keys(locations).length, 'lokasyon');
        }
        
        return locations;
    } catch (error) {
        console.error('❌ Stock locations hatası:', error);
        return {};
    }
}

/**
 * Merkezi hedefleri yükler
 * @returns {Promise<Object|false>} Hedefler objesi veya false (hata durumunda)
 */
async function loadCentralTargets() {
    try {
        // safeConsole config.js'den gelecek (window objesinde)
        if (typeof safeConsole !== 'undefined') {
            safeConsole.log('🎯 Merkezi hedefler yükleniyor...');
        }
        
        const response = await fetch('data/targets.json?' + Date.now()); // Cache bypass
        
        if (response.ok) {
            const targets = await response.json();
            
            if (typeof safeConsole !== 'undefined') {
                safeConsole.log('✅ Merkezi hedefler yüklendi:', targets);
            }
            
            // Loading progress'i güncelle (dataLoadProgress config.js'den gelecek)
            if (typeof dataLoadProgress !== 'undefined') {
                dataLoadProgress.targets = true;
            }
            
            // checkLoadingComplete HTML'de kalacak, window üzerinden çağrılacak
            if (typeof window !== 'undefined' && typeof window.checkLoadingComplete === 'function') {
                window.checkLoadingComplete();
            }
            
            return targets;
        } else {
            if (typeof safeConsole !== 'undefined') {
                safeConsole.warn('⚠️ targets.json yüklenemedi, varsayılan hedefler kullanılacak');
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Hedef yükleme hatası:', error);
        return false;
    }
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.loadStockLocations = loadStockLocations;
    window.loadCentralTargets = loadCentralTargets;
}

