/**
 * Storage Utility Functions
 * localStorage wrapper fonksiyonları (metadata cache için)
 */

/**
 * Metadata storage key
 * @constant {string} METADATA_STORAGE_KEY
 */
const METADATA_STORAGE_KEY = 'zuhaMetadataLastUpdate';

/**
 * Son metadata güncelleme zamanını localStorage'dan alır
 * @returns {string|null} Son güncelleme zamanı veya null
 */
function getLastMetadataUpdate() {
    try {
        return localStorage.getItem(METADATA_STORAGE_KEY);
    } catch (e) {
        // localStorage kapalı veya dolu ise null döndür (graceful degradation)
        return null;
    }
}

/**
 * Son metadata güncelleme zamanını localStorage'a kaydeder
 * @param {string} lastUpdate - Güncelleme zamanı
 */
function saveLastMetadataUpdate(lastUpdate) {
    try {
        localStorage.setItem(METADATA_STORAGE_KEY, lastUpdate);
    } catch (e) {
        // localStorage dolu ise sessizce devam et (kritik değil)
        // Sadece ilk 5MB'ı kullanabiliyoruz, bu yeterli
    }
}

/**
 * Metadata'nın güncellenip güncellenmediğini kontrol eder
 * @param {Object} newMetadata - Yeni metadata objesi
 * @returns {boolean} Metadata güncellenmiş mi? (true = yeniden yükle, false = cache kullan)
 */
function isMetadataUpdated(newMetadata) {
    const lastUpdate = getLastMetadataUpdate();
    const newUpdate = newMetadata?.last_update;
    
    // İlk yükleme: Metadata kaydet, verileri yükle
    if (!lastUpdate) {
        if (newUpdate) saveLastMetadataUpdate(newUpdate);
        return true; // İlk yükleme, verileri yükle
    }
    
    // Metadata güncellenmiş: Cache temizle, verileri yeniden yükle
    if (newUpdate && newUpdate !== lastUpdate) {
        // NOT: Memory cache temizleme (loadedYears.clear(), loadedDataCache = {}) 
        // HTML'deki kullanım yerinde yapılıyor
        saveLastMetadataUpdate(newUpdate);
        return true; // Güncellenmiş, yeniden yükle
    }
    
    // Metadata değişmemiş: Cache kullan (hızlı yükleme)
    return false; // Değişmemiş, cache kullan
}

// Geriye dönük uyumluluk için window objesine export et (normal script tag için)
if (typeof window !== 'undefined') {
    window.METADATA_STORAGE_KEY = METADATA_STORAGE_KEY;
    window.getLastMetadataUpdate = getLastMetadataUpdate;
    window.saveLastMetadataUpdate = saveLastMetadataUpdate;
    window.isMetadataUpdated = isMetadataUpdated;
}

